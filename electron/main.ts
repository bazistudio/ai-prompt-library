import { app, BrowserWindow, ipcMain, shell, dialog } from "electron";
import path from "path";
import http from "http";
import next from "next";

console.log("[BOOT-01] Electron process started");

process.env.IS_ELECTRON = "true";
process.env.NEXT_PUBLIC_IS_ELECTRON = "true";

let mainWindow: BrowserWindow | null = null;
let prodServer: http.Server | null = null;
const NEXT_DEV_URL = process.env.NEXT_DEV_URL || "http://127.0.0.1:3000";

// Diagnostic Process Handlers
process.on("uncaughtException", (err) => {
  console.error("[Main] Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("[Main] Unhandled Rejection:", reason);
});

app.on("child-process-gone", (_event, details) => {
  console.error("[DIAGNOSTIC] APP CHILD PROCESS GONE:", JSON.stringify(details));
});

// Enforce separate single-instance locks and data directory for dev vs production
if (!app.isPackaged) {
  const devDataPath = path.join(app.getPath("appData"), "ai-prompt-library-dev");
  app.setPath("userData", devDataPath);
}

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
  }
});

/** Helper: Wait for HTTP dev server to respond */
async function waitForHttpServer(targetUrl: string, retries = 30, delayMs = 500): Promise<boolean> {
  const checkUrl = targetUrl.replace("localhost", "127.0.0.1");
  console.log(`[Main] Waiting for HTTP server at ${checkUrl}...`);
  for (let i = 0; i < retries; i++) {
    try {
      const isReady = await new Promise<boolean>((resolve) => {
        const req = http.get(checkUrl, (res) => {
          res.resume();
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
      // Retry loop
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return false;
}

/** Starts Next.js HTTP production server dynamically on a dynamic 127.0.0.1 port */
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
    });
  } catch (err: any) {
    console.error("[Main] Production Next.js server startup failure:", err);
    throw err;
  }
}

async function createWindow() {
  console.log("[BOOT-04] BrowserWindow creation");
  let targetUrl = NEXT_DEV_URL;

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: true,
    title: "AI Prompt Library",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    console.error("[DIAGNOSTIC] RENDER PROCESS GONE on mainWindow:", JSON.stringify(details));
  });

  mainWindow.webContents.on("did-finish-load", () => {
    console.log("[BOOT-11] renderer finished loading. Current URL:", mainWindow?.webContents.getURL());
  });

  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    console.error(`[DIAGNOSTIC] Window failed to load: ${errorDescription} (${errorCode}) at ${validatedURL} (isMainFrame: ${isMainFrame})`);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http:") || url.startsWith("https:")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  if (app.isPackaged === false && process.env.FORCE_PROD_SERVER !== "true") {
    console.log("[Main] Development Mode (app.isPackaged === false)");
    targetUrl = `${NEXT_DEV_URL}/test-sqlite`;

    mainWindow.loadURL(
      `data:text/html,<html><head><title>AI Prompt Library</title></head><body style="background:%23090d16;color:%236366f1;font-family:system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;"><div style="font-size:24px;font-weight:bold;margin-bottom:8px;">AI Prompt Library</div><div style="font-size:13px;color:%2394a3b8;">Initializing local development server...</div></body></html>`
    ).catch(() => {});

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
    mainWindow.loadURL(
      `data:text/html,<html><head><title>AI Prompt Library</title></head><body style="background:%23090d16;color:%236366f1;font-family:system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;"><div style="font-size:24px;font-weight:bold;margin-bottom:8px;">AI Prompt Library</div><div style="font-size:13px;color:%2394a3b8;">Starting local engine...</div></body></html>`
    ).catch(() => {});

    try {
      const baseUrl = await startProductionServer();
      targetUrl = `${baseUrl}/test-sqlite`;
      console.log(`[BOOT-10] BrowserWindow loadURL: ${targetUrl}`);
      await mainWindow.loadURL(targetUrl);
    } catch (err: any) {
      console.error("[Main] Failed to start production server:", err);
      if (mainWindow && !mainWindow.isDestroyed()) {
        const errorMsg = err?.message || "Unknown production server error";
        const errorHtml = `data:text/html,<html><head><title>AI Prompt Library - Startup Error</title></head><body style="background:%23090d16;color:%23ef4444;font-family:system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;padding:24px;text-align:center;"><h1 style="font-size:22px;margin-bottom:8px;color:%23f87171;">Application Failed to Start</h1><p style="font-size:14px;color:%2394a3b8;max-width:500px;line-height:1.5;">The local application server could not be started.</p><pre style="background:%231e293b;color:%23e2e8f0;padding:12px;border-radius:8px;font-size:12px;max-width:600px;overflow:auto;margin-top:16px;text-align:left;">${encodeURIComponent(errorMsg)}</pre></body></html>`;
        mainWindow.loadURL(errorHtml).catch(() => {});
      }
      dialog.showErrorBox(
        "AI Prompt Library Startup Error",
        `Failed to start local application server:\n\n${err?.message || "Unknown error"}`
      );
    }
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle("app:getAppInfo", () => {
  return {
    version: app.getVersion(),
    platform: process.platform,
    arch: process.arch,
  };
});

// App Lifecycle
app.whenReady().then(async () => {
  console.log("[BOOT-02] app.whenReady entered");
  try {
    await createWindow();
  } catch (winErr) {
    console.error("[Main] Failed to create main window:", winErr);
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

app.on("will-quit", () => {
  console.log("[Main] App event: will-quit");
  if (prodServer) {
    console.log("[Main] Closing production Next.js HTTP server...");
    prodServer.close();
    prodServer = null;
  }
});
