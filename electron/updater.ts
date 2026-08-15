import { app, ipcMain, BrowserWindow } from "electron";
import { autoUpdater } from "electron-updater";

export interface UpdateStatusPayload {
  status: "idle" | "checking" | "available" | "not-available" | "downloading" | "downloaded" | "error";
  version?: string;
  percent?: number;
  bytesPerSecond?: number;
  error?: string;
}

let mainWindowGetter: () => BrowserWindow | null = () => null;
let currentStatus: UpdateStatusPayload = { status: "idle" };

function sendStatusToWindow(payload: UpdateStatusPayload) {
  currentStatus = payload;
  const win = mainWindowGetter();
  if (win && !win.isDestroyed()) {
    win.webContents.send("updater:status", payload);
  }
}

export function initializeUpdater(getWin: () => BrowserWindow | null) {
  mainWindowGetter = getWin;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("checking-for-update", () => {
    console.log("[Updater] Checking for updates on GitHub Releases...");
    sendStatusToWindow({ status: "checking" });
  });

  autoUpdater.on("update-available", (info) => {
    console.log(`[Updater] Update available: v${info.version}`);
    sendStatusToWindow({ status: "available", version: info.version });
  });

  autoUpdater.on("update-not-available", (info) => {
    console.log(`[Updater] Up to date (current: v${info.version || app.getVersion()})`);
    sendStatusToWindow({ status: "not-available", version: info.version || app.getVersion() });
  });

  autoUpdater.on("error", (err) => {
    console.error("[Updater] Update error:", err ? err.message : err);
    // If in dev mode or checking fails, show not-available rather than sticking in error
    if (app.isPackaged === false) {
      sendStatusToWindow({ status: "not-available", version: app.getVersion() });
    } else {
      sendStatusToWindow({ status: "error", error: err ? err.message : String(err) });
    }
  });

  autoUpdater.on("download-progress", (progress) => {
    console.log(`[Updater] Download speed: ${progress.bytesPerSecond} - Downloaded ${progress.percent.toFixed(1)}%`);
    sendStatusToWindow({
      status: "downloading",
      percent: progress.percent,
      bytesPerSecond: progress.bytesPerSecond,
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    console.log(`[Updater] Update downloaded: v${info.version}. Ready to install.`);
    sendStatusToWindow({ status: "downloaded", version: info.version });
  });

  // Handle IPC request to install update immediately
  ipcMain.handle("app:installUpdateNow", () => {
    console.log("[Updater] User requested immediate update installation. Quitting and installing silently...");
    sendStatusToWindow({ status: "idle" });
    autoUpdater.quitAndInstall(true, true);
  });

  // Handle IPC request for current update status
  ipcMain.handle("app:getUpdateStatus", () => {
    return currentStatus;
  });

  // Perform check ONLY in packaged production builds on startup
  if (app.isPackaged === true) {
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      console.error("[Updater] Failed initial update check:", err);
      sendStatusToWindow({ status: "error", error: err?.message || String(err) });
    });
  }
}

export function checkForUpdatesManually() {
  try {
    console.log("[Updater] Manual check for updates initiated...");
    sendStatusToWindow({ status: "checking" });

    // Safety timeout: if check stays in 'checking' for > 10 seconds without event, set to not-available
    const timeoutId = setTimeout(() => {
      if (currentStatus.status === "checking") {
        console.log("[Updater] Manual check timeout reached. Setting status to up-to-date.");
        sendStatusToWindow({ status: "not-available", version: app.getVersion() });
      }
    }, 10000);

    return autoUpdater.checkForUpdatesAndNotify()
      .then((res) => {
        clearTimeout(timeoutId);
        if (res && res.updateInfo) {
          const latestVer = res.updateInfo.version;
          if (latestVer === app.getVersion() || app.isPackaged === false) {
            sendStatusToWindow({ status: "not-available", version: app.getVersion() });
          }
        } else {
          sendStatusToWindow({ status: "not-available", version: app.getVersion() });
        }
        return res;
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        console.error("[Updater] Manual check error:", err);
        sendStatusToWindow({ status: "not-available", version: app.getVersion() });
        return null;
      });
  } catch (err: any) {
    console.error("[Updater] Manual check exception:", err);
    sendStatusToWindow({ status: "not-available", version: app.getVersion() });
    return Promise.resolve(null);
  }
}
