import { autoUpdater } from "electron-updater";

export function initializeUpdater() {
  // Configure logging & updater options
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("checking-for-update", () => {
    console.log("[Updater] Checking for updates on GitHub Releases...");
  });

  autoUpdater.on("update-available", (info) => {
    console.log(`[Updater] Update available: v${info.version}`);
  });

  autoUpdater.on("update-not-available", (info) => {
    console.log(`[Updater] Up to date (current: v${info.version})`);
  });

  autoUpdater.on("error", (err) => {
    console.error("[Updater] Update error:", err ? err.message : err);
  });

  autoUpdater.on("download-progress", (progress) => {
    console.log(`[Updater] Download speed: ${progress.bytesPerSecond} - Downloaded ${progress.percent.toFixed(1)}%`);
  });

  autoUpdater.on("update-downloaded", (info) => {
    console.log(`[Updater] Update downloaded: v${info.version}. Will install on restart.`);
  });

  // Perform check in production builds
  if (process.env.NODE_ENV !== "development") {
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      console.error("[Updater] Failed initial update check:", err);
    });
  }
}

export function checkForUpdatesManually() {
  return autoUpdater.checkForUpdatesAndNotify();
}
