import { app, BrowserWindow, ipcMain, shell, net, dialog } from "electron";
import path from "path";
import fsSync from "fs";
import http from "http";
import next from "next";
import { initializeUpdater, checkForUpdatesManually } from "./updater";
import { setupApplicationMenu } from "./menu";
import {
  getSecurityStatus,
  unlockApplication,
  setupOrUpdatePassword,
  setupOrUpdatePin,
  generateAndSaveRecoveryKey,
  recoverAndResetCredentials,
  toggleAppLock,
  setLockMethod,
  isAppLocked,
  setAppLockedState,
} from "./securityManager";

process.env.IS_ELECTRON = "true";
process.env.NEXT_PUBLIC_IS_ELECTRON = "true";

let mainWindow: BrowserWindow | null = null;
let prodServer: http.Server | null = null;
const NEXT_DEV_URL = process.env.NEXT_DEV_URL || "http://127.0.0.1:3000";

process.on("uncaughtException", (err) => {
  console.error("[Main] Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("[Main] Unhandled Rejection:", reason);
});

// Enforce single-instance lock for production packaged builds
if (app.isPackaged) {
  const gotLock = app.requestSingleInstanceLock();
  if (!gotLock) {
    console.log("[Main] Another instance is already running. Quitting.");
    app.quit();
    process.exit(0);
  }
}

app.on("second-instance", () => {
  if (mainWindow) {
    if (!mainWindow.isVisible()) mainWindow.show();
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

async function waitForDevServer(targetUrl: string, retries = 60, delayMs = 1000): Promise<boolean> {
  const checkUrl = targetUrl.replace("localhost", "127.0.0.1");
  console.log(`[Main] Waiting for HTTP server at ${checkUrl}...`);
  for (let i = 0; i < retries; i++) {
    try {
      const isReady = await new Promise<boolean>((resolve) => {
        const req = http.get(checkUrl, (res) => {
          resolve((res.statusCode || 500) < 500);
        });
        req.on("error", () => resolve(false));
        req.setTimeout(800, () => {
          req.destroy();
          resolve(false);
        });
      });
      if (isReady) {
        console.log(`[Main] HTTP server ready at ${checkUrl}`);
        return true;
      }
    } catch {
      // Continue polling
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return false;
}

async function startProductionServer(): Promise<string> {
  console.log("[Main] Initializing production Next.js server...");
  const appPath = app.getAppPath();
  const nextApp = next({ dev: false, dir: appPath });
  const handle = nextApp.getRequestHandler();
  await nextApp.prepare();

  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      handle(req, res);
    });

    const timeout = setTimeout(() => {
      reject(new Error("Production Next.js server start timed out after 30 seconds"));
    }, 30000);

    server.listen(0, "127.0.0.1", () => {
      clearTimeout(timeout);
      const address = server.address();
      if (typeof address === "object" && address !== null) {
        prodServer = server;
        const url = `http://127.0.0.1:${address.port}`;
        console.log(`[Main] Production Next.js server is ready at ${url}`);
        resolve(url);
      } else {
        reject(new Error("Failed to resolve production Next.js server port"));
      }
    });

    server.on("error", (err) => {
      clearTimeout(timeout);
      console.error("[Main] Production Next.js server error:", err);
      reject(err);
    });
  });
}

async function createWindow() {
  let targetUrl = NEXT_DEV_URL;

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: true,
    title: "AI Prompt Library",
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  setupApplicationMenu(mainWindow);

  mainWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
    console.error(`[Main] Window failed to load: ${errorDescription} (${errorCode})`);
    if (errorCode !== -3 && mainWindow && !mainWindow.isDestroyed()) {
      console.log("[Main] Retrying window load in 1.5s...");
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.loadURL(targetUrl).catch(() => {});
        }
      }, 1500);
    }
  });

  // External link navigation security: open in default OS browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http:") || url.startsWith("https:")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }

  if (app.isPackaged === false) {
    console.log("[Main] Development Mode (app.isPackaged === false)");
    targetUrl = `${NEXT_DEV_URL}/dashboard`;

    // Instantly reveal window with dark loading placeholder
    mainWindow.loadURL(
      `data:text/html,<html><head><title>AI Prompt Library</title></head><body style="background:%23090d16;color:%236366f1;font-family:system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;"><div style="font-size:24px;font-weight:bold;margin-bottom:8px;">AI Prompt Library</div><div style="font-size:13px;color:%2394a3b8;">Initializing local development server...</div></body></html>`
    ).catch(() => {});

    // Poll dev server in background and navigate when ready
    waitForDevServer(NEXT_DEV_URL, 60, 500).then(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        console.log(`[Main] Loading dev window URL: ${targetUrl}`);
        mainWindow.loadURL(targetUrl).catch((err) => {
          console.error("[Main] Dev window loadURL error:", err);
        });
      }
    });
  } else {
    console.log("[Main] Production Mode (app.isPackaged === true)");
    try {
      const baseUrl = await startProductionServer();
      targetUrl = `${baseUrl}/dashboard`;
      await waitForDevServer(baseUrl, 10, 500);
      console.log(`[Main] Loading production window URL: ${targetUrl}`);
      await mainWindow.loadURL(targetUrl);
    } catch (err) {
      console.error("[Main] Failed to start production server:", err);
    }
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

/** Central IPC Security Guard wrapper for sensitive IPC operations */
function protectedHandle(channel: string, handler: (...args: any[]) => any) {
  ipcMain.handle(channel, async (event, ...args) => {
    if (isAppLocked()) {
      return { success: false, error: "Application is locked. Access denied until unlocked." };
    }
    return handler(event, ...args);
  });
}

// Security IPC Handlers (Main Process Security Boundary)
ipcMain.handle("security:getStatus", () => getSecurityStatus());
ipcMain.handle("security:unlock", (_, input: string) => unlockApplication(input));
ipcMain.handle("security:changePassword", (_, currentPassword?: string, newPassword?: string) => setupOrUpdatePassword(currentPassword, newPassword));
ipcMain.handle("security:setupPin", (_, password: string, pin: string) => setupOrUpdatePin(password, pin));
ipcMain.handle("security:generateRecoveryKey", () => generateAndSaveRecoveryKey());
ipcMain.handle("security:recoverAccess", (_, recoveryInput: string, newPassword: string, method: "key" | "questions") => recoverAndResetCredentials(recoveryInput, newPassword, method));
ipcMain.handle("security:toggleLock", (_, enabled: boolean) => toggleAppLock(enabled));
ipcMain.handle("security:setLockMethod", (_, method: "password" | "pin") => setLockMethod(method));

// Public IPC Handlers
ipcMain.handle("app:getAppInfo", () => {
  return {
    version: app.getVersion(),
    platform: process.platform,
    arch: process.arch,
  };
});

ipcMain.handle("app:openExternal", async (_, url: string) => {
  if (typeof url === "string" && (url.startsWith("http:") || url.startsWith("https:"))) {
    await shell.openExternal(url);
    return { success: true };
  }
  return { success: false, error: "Invalid or unsafe URL protocol" };
});

ipcMain.handle("app:checkForUpdates", async () => {
  try {
    await checkForUpdatesManually();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

// Storage IPC Handlers (Protected via Central Security Guard)
protectedHandle("storage:selectFolder", async () => {
  if (!mainWindow) return { canceled: true, filePaths: [] };
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Select Prompt Library Storage Location",
    properties: ["openDirectory", "createDirectory"],
  });
  return result;
});

protectedHandle("storage:openStorageFolder", async (_, targetPath?: string) => {
  if (targetPath && typeof targetPath === "string" && fsSync.existsSync(targetPath)) {
    await shell.openPath(targetPath);
    return { success: true };
  }
  return { success: false, error: "Storage folder path not provided or accessible." };
});

// App Lifecycle
app.whenReady().then(async () => {
  console.log("[Main] Electron application starting...");

  try {
    const status = getSecurityStatus();
    if (status.enabled && status.requireStartup) {
      setAppLockedState(true);
    }
  } catch (secErr) {
    console.error("[Main] Failed to read security status during startup:", secErr);
  }

  try {
    await createWindow();
  } catch (winErr) {
    console.error("[Main] Failed to create main window:", winErr);
  }

  try {
    initializeUpdater(() => mainWindow);
  } catch (updErr) {
    console.error("[Main] Failed to initialize updater:", updErr);
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow().catch((e) => console.error("[Main] Activate createWindow error:", e));
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  if (prodServer) {
    console.log("[Main] Closing production Next.js HTTP server...");
    prodServer.close();
    prodServer = null;
  }
});
