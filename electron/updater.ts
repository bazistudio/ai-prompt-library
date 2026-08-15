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
    console.log(`[Updater] Up to date (current: v${info.version})`);
    sendStatusToWindow({ status: "not-available", version: info.version });
  });

  autoUpdater.on("error", (err) => {
    console.error("[Updater] Update error:", err ? err.message : err);
    sendStatusToWindow({ status: "error", error: err ? err.message : String(err) });
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

  // Perform check ONLY in packaged production builds
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
    return autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      console.error("[Updater] Manual update check error:", err);
      sendStatusToWindow({ status: "error", error: err?.message || String(err) });
      return null;
    });
  } catch (err: any) {
    console.error("[Updater] Manual update check exception:", err);
    sendStatusToWindow({ status: "error", error: err?.message || String(err) });
    return Promise.resolve(null);
  }
}
