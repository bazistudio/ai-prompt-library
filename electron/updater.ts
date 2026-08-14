import { autoUpdater } from "electron-updater";
import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { logger } from "./logger";
import { syncEngine } from "./services/syncEngine";
import { closeDb } from "./db";

let isUpdaterInitialized = false;

function performGracefulQuitAndInstall() {
  app.removeAllListeners("window-all-closed");
  const windows = BrowserWindow.getAllWindows();
  windows.forEach((win) => {
    if (!win.isDestroyed()) {
      win.close();
    }
  });
  try {
    syncEngine.stop();
    closeDb();
  } catch (err) {
    logger.error('Error shutting down resources for auto-update:', err);
  }
  autoUpdater.quitAndInstall(false, true);
}

export function setupUpdater(mainWindow: BrowserWindow) {
  // Bind electron-log logger to autoUpdater for detailed logs
  autoUpdater.logger = logger;

  // We want full control over the download and install process
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  // Configure GitHub Releases provider for official auto-updates
  autoUpdater.setFeedURL({
    provider: "github",
    owner: "bazistudio",
    repo: "ai-prompt-library"
  });

  if (!isUpdaterInitialized) {
    isUpdaterInitialized = true;

    autoUpdater.on('checking-for-update', () => {
      logger.info('Updater: Checking for updates...');
    });

    autoUpdater.on('update-available', (info) => {
      logger.info(`Updater: Update available: version ${info.version}`);
    });

    autoUpdater.on('update-not-available', () => {
      logger.info('Updater: App is up to date.');
    });

    autoUpdater.on('error', (err) => {
      logger.error(`Updater Error (App version: ${app.getVersion()}): ${err.message}`);
      if (err.stack) {
        logger.error(`Updater Stack Trace: ${err.stack}`);
      }
    });

    autoUpdater.on('download-progress', (progressObj) => {
      const percent = Math.round(progressObj.percent);
      logger.info(`Updater: Downloading update... ${percent}%`);
    });

    autoUpdater.on('update-downloaded', (info) => {
      logger.info(`Updater: Update downloaded: version ${info.version}`);
      
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'AI Prompt Library Update Ready',
        message: `A new version (${info.version}) of AI Prompt Library has been downloaded and is ready to install.`,
        buttons: ['Install Now', 'Later'],
        defaultId: 0,
        cancelId: 1
      }).then(({ response }) => {
        if (response === 0) {
          performGracefulQuitAndInstall();
        }
      });
    });
  }

  // Handle IPC calls from renderer safely (re-bind to prevent collisions)
  if (ipcMain.listenerCount('updater:check') > 0) {
    ipcMain.removeHandler('updater:check');
  }
  ipcMain.handle('updater:check', () => {
    logger.info('Updater: Manual update check requested via IPC');
    return autoUpdater.checkForUpdatesAndNotify();
  });

  if (ipcMain.listenerCount('updater:install') > 0) {
    ipcMain.removeHandler('updater:install');
  }
  ipcMain.handle('updater:install', () => {
    logger.info('Updater: Manual update installation requested via IPC');
    performGracefulQuitAndInstall();
  });
}

