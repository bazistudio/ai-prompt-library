import { app, BrowserWindow, ipcMain, shell, net } from "electron";
import path from "path";
import { initializeUpdater, checkForUpdatesManually } from "./updater";

let mainWindow: BrowserWindow | null = null;
const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;
const NEXT_DEV_URL = process.env.NEXT_DEV_URL || "http://localhost:3000";

// Enforce single-instance lock
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  console.log("[Main] Another instance is already running. Quitting.");
  app.quit();
  process.exit(0);
}

app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

async function waitForDevServer(url: string, retries = 30, delayMs = 1000): Promise<boolean> {
  console.log(`[Main] Waiting for development server at ${url}...`);
  for (let i = 0; i < retries; i++) {
    try {
      const response = await net.fetch(url);
      if (response.ok || response.status < 500) {
        console.log(`[Main] Development server ready at ${url}`);
        return true;
      }
    } catch {
      // Server not accepting connections yet
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return false;
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
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

  // Reveal window cleanly when ready to render
  mainWindow.once("ready-to-show", () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // External link navigation security: open in default OS browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http:") || url.startsWith("https:")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  if (isDev) {
    const isReady = await waitForDevServer(NEXT_DEV_URL);
    if (isReady && mainWindow) {
      await mainWindow.loadURL(NEXT_DEV_URL);
    } else if (mainWindow) {
      console.error("[Main] Could not connect to Next.js dev server.");
      await mainWindow.loadURL(NEXT_DEV_URL);
    }
  } else {
    // Production: Load Next.js production build from localhost server
    await mainWindow.loadURL(NEXT_DEV_URL);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Register secure IPC Handlers
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

// App Lifecycle
app.whenReady().then(async () => {
  console.log("[Main] Electron application starting...");
  await createWindow();
  initializeUpdater();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
