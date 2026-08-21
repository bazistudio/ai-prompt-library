import { app, BrowserWindow, ipcMain, shell, dialog } from "electron";
import path from "path";
import fsSync from "fs";
import http from "http";
import next from "next";
import { initializeUpdater, checkForUpdatesManually } from "./updater";
import { setupApplicationMenu } from "./menu";
import { setupSystemTray, destroySystemTray } from "./tray";
import { initializeLicenseManager } from "./licenseManager";
import { startBackupScheduler, stopBackupScheduler } from "./backupScheduler";
import {
  getSecurityStatus,
  unlockApplication,
  setupOrUpdatePassword,
  setupOrUpdatePin,
  removePin,
  removePassword,
  generateAndSaveRecoveryKey,
  recoverAndResetCredentials,
  toggleAppLock,
  setLockMethod,
  isAppLocked,
  setAppLockedState,
} from "./securityManager";

console.log("[BOOT-01] Electron process started");

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

// Enforce single-instance lock across both dev and production
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  console.log("[Main] Another instance is already running. Quitting.");
  app.quit();
  process.exit(0);
}

app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  } else {
    createWindow().catch((e) => console.error("[Main] second-instance createWindow error:", e));
  }
});

async function waitForHttpServer(targetUrl: string, retries = 30, delayMs = 500): Promise<boolean> {
  const checkUrl = targetUrl.replace("localhost", "127.0.0.1");
  console.log(`[Main] Waiting for HTTP server at ${checkUrl}...`);
  for (let i = 0; i < retries; i++) {
    try {
      const isReady = await new Promise<boolean>((resolve) => {
        const req = http.get(checkUrl, (res) => {
          res.resume(); // Ensure stream is consumed
          resolve((res.statusCode || 500) < 500);
        });
        req.on("error", () => resolve(false));
        req.setTimeout(4000, () => {
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
  if (prodServer) {
    const address = prodServer.address();
    if (typeof address === "object" && address !== null) {
      return `http://127.0.0.1:${address.port}`;
    }
  }

  const appPath = app.getAppPath();
  console.log(`[BOOT-09] Next.js server initialization (root dir: ${appPath})`);

  try {
    const nextApp = next({ dev: false, dir: appPath });
    const handle = nextApp.getRequestHandler();

    // Bound nextApp.prepare() with a timeout
    await Promise.race([
      nextApp.prepare(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Next.js app.prepare() timed out after 30 seconds")), 30000)
      ),
    ]);

    return await new Promise<string>((resolve, reject) => {
      const server = http.createServer((req, res) => {
        handle(req, res).catch((hErr) => {
          console.error(`[Main HTTP] Request error for ${req.url}:`, hErr);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.end("Server Error");
          }
        });
      });

      const timeout = setTimeout(() => {
        reject(new Error("Production Next.js HTTP server.listen timed out after 30 seconds"));
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
        console.error("[Main] Production Next.js server error event:", err);
        reject(err);
      });

      server.on("close", () => {
        console.log("[Main] Production Next.js HTTP server close event fired.");
      });
    });
  } catch (err: any) {
    console.error("[Main] Production Next.js server startup failure:", {
      name: err?.name,
      message: err?.message,
      stack: err?.stack,
      appPath,
      isPackaged: app.isPackaged,
      resourcesPath: process.resourcesPath,
    });
    throw err;
  }
}

export function getAppServerUrl(): string {
  if (prodServer) {
    const address = prodServer.address();
    if (typeof address === "object" && address !== null) {
      return `http://127.0.0.1:${address.port}`;
    }
  }
  return NEXT_DEV_URL;
}

async function createWindow() {
  console.log("[BOOT-04] BrowserWindow creation");
  let targetUrl = NEXT_DEV_URL;

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: true, // Reveal immediately on launch matching v1.0.2 behavior
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

  mainWindow.webContents.on("did-finish-load", () => {
    console.log("[BOOT-11] renderer finished loading");
  });

  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    console.error(`[Main] Window failed to load: ${errorDescription} (${errorCode}) at ${validatedURL} (isMainFrame: ${isMainFrame})`);
    if (errorCode !== -3 && mainWindow && !mainWindow.isDestroyed() && isMainFrame) {
      console.log("[Main] Retrying window load in 1.5s...");
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.loadURL(targetUrl).catch(() => { });
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

  if (app.isPackaged === false) {
    console.log("[Main] Development Mode (app.isPackaged === false)");
    targetUrl = `${NEXT_DEV_URL}/dashboard`;

    // Instantly reveal window with dark loading placeholder
    mainWindow.loadURL(
      `data:text/html,<html><head><title>AI Prompt Library</title></head><body style="background:%23090d16;color:%236366f1;font-family:system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;"><div style="font-size:24px;font-weight:bold;margin-bottom:8px;">AI Prompt Library</div><div style="font-size:13px;color:%2394a3b8;">Initializing local development server...</div></body></html>`
    ).catch(() => { });

    // Poll dev server in background and navigate when ready
    waitForHttpServer(`${NEXT_DEV_URL}/dashboard`, 60, 500).then((ready) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        if (ready) {
          console.log(`[BOOT-10] BrowserWindow loadURL: ${targetUrl}`);
          mainWindow.loadURL(targetUrl).catch((err) => {
            console.error("[Main] Dev window loadURL error:", err);
          });
        } else {
          console.error("[Main] Dev server failed to respond within timeout.");
        }
      }
    });
  } else {
    console.log("[Main] Production Mode (app.isPackaged === true)");
    // Show dark loading placeholder while Next.js prepares
    mainWindow.loadURL(
      `data:text/html,<html><head><title>AI Prompt Library</title></head><body style="background:%23090d16;color:%236366f1;font-family:system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;"><div style="font-size:24px;font-weight:bold;margin-bottom:8px;">AI Prompt Library</div><div style="font-size:13px;color:%2394a3b8;">Starting local engine...</div></body></html>`
    ).catch(() => { });

    try {
      const baseUrl = await startProductionServer();
      targetUrl = `${baseUrl}/dashboard`;
      console.log(`[BOOT-10] BrowserWindow loadURL: ${targetUrl}`);
      await mainWindow.loadURL(targetUrl);
    } catch (err: any) {
      console.error("[Main] Failed to start production server:", err);
      if (mainWindow && !mainWindow.isDestroyed()) {
        const errorMsg = err?.message || "Unknown production server error";
        const errorHtml = `data:text/html,<html><head><title>AI Prompt Library - Startup Error</title></head><body style="background:%23090d16;color:%23ef4444;font-family:system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;padding:24px;text-align:center;"><h1 style="font-size:22px;margin-bottom:8px;color:%23f87171;">Application Failed to Start</h1><p style="font-size:14px;color:%2394a3b8;max-width:500px;line-height:1.5;">The local application server could not be started. Please try restarting the application or reinstalling if the issue persists.</p><pre style="background:%231e293b;color:%23e2e8f0;padding:12px;border-radius:8px;font-size:12px;max-width:600px;overflow:auto;margin-top:16px;text-align:left;">${encodeURIComponent(errorMsg)}</pre></body></html>`;
        mainWindow.loadURL(errorHtml).catch(() => { });
      }
      dialog.showErrorBox(
        "AI Prompt Library Startup Error",
        `Failed to start local application server:\n\n${err?.message || "Unknown error"}\n\nPlease restart the application or report this issue.`
      );
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
ipcMain.handle("security:removePin", (_, pinOrPassword: string) => removePin(pinOrPassword));
ipcMain.handle("security:removePassword", (_, currentPassword: string) => removePassword(currentPassword));
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
  console.log("[BOOT-02] app.whenReady entered");

  try {
    console.log("[BOOT-03] security initialization");
    const status = getSecurityStatus();
    if (status.enabled && status.requireStartup) {
      setAppLockedState(true);
    }
  } catch (secErr) {
    console.error("[Main] Failed to read security status during startup:", secErr);
  }

  try {
    console.log("[BOOT-05] updater initialization");
    initializeUpdater(() => mainWindow);
  } catch (updErr) {
    console.error("[Main] Failed to initialize updater:", updErr);
  }

  try {
    console.log("[BOOT-07] license initialization");
    initializeLicenseManager();
  } catch (licErr) {
    console.error("[Main] Failed to initialize license manager:", licErr);
  }

  try {
    await createWindow();
  } catch (winErr) {
    console.error("[Main] Failed to create main window:", winErr);
  }

  try {
    console.log("[BOOT-06] tray initialization");
    setupSystemTray(() => mainWindow);
  } catch (trayErr) {
    console.error("[Main] Failed to initialize system tray:", trayErr);
  }

  try {
    console.log("[BOOT-08] backup scheduler initialization");
    startBackupScheduler(() => getAppServerUrl());
  } catch (schedErr) {
    console.error("[Main] Failed to initialize backup scheduler:", schedErr);
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow().catch((e) => console.error("[Main] Activate createWindow error:", e));
    }
  });
});

app.on("window-all-closed", () => {
  console.log("[Main] App event: window-all-closed");
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  console.log("[Main] App event: before-quit");
});

app.on("will-quit", () => {
  console.log("[Main] App event: will-quit");
  stopBackupScheduler();
  destroySystemTray();
  if (prodServer) {
    console.log("[Main] Closing production Next.js HTTP server...");
    prodServer.close();
    prodServer = null;
  }
});

app.on("quit", (_e, exitCode) => {
  console.log("[Main] App event: quit with code:", exitCode);
});

process.on("exit", (code) => {
  console.log("[Main] Process event: exit with code:", code);
});
