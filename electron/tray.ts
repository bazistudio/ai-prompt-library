import { app, Tray, Menu, BrowserWindow, globalShortcut, nativeImage } from "electron";
import path from "path";
import fs from "fs";

let tray: Tray | null = null;

/**
 * Creates a minimal 16x16 / 32x32 transparent PNG buffer with an indigo terminal square
 * for the system tray icon fallback if no asset file is found on disk.
 */
function createDefaultTrayIcon(): Electron.NativeImage {
  // Try standard icon locations
  const possiblePaths = [
    path.join(__dirname, "../public/icon.png"),
    path.join(__dirname, "../public/favicon.ico"),
    path.join(app.getAppPath(), "public/icon.png"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const img = nativeImage.createFromPath(p);
        if (!img.isEmpty()) {
          return img.resize({ width: 16, height: 16 });
        }
      } catch {
        // Continue to fallback
      }
    }
  }

  // Generate 16x16 standard native image
  const img = nativeImage.createEmpty();
  return img;
}

export function setupSystemTray(
  getMainWindow: () => BrowserWindow | null,
  onQuickCaptureTrigger?: () => void
): Tray | null {
  if (tray) {
    return tray;
  }

  try {
    const icon = createDefaultTrayIcon();
    tray = new Tray(icon);
    tray.setToolTip("AI Prompt Library - Offline Studio");

    const updateContextMenu = () => {
      const mainWindow = getMainWindow();
      const isVisible = mainWindow ? mainWindow.isVisible() : false;

      const contextMenu = Menu.buildFromTemplate([
        {
          label: isVisible ? "Hide to Tray" : "Show AI Prompt Library",
          click: () => {
            const win = getMainWindow();
            if (win) {
              if (win.isVisible()) {
                win.hide();
              } else {
                win.show();
                win.focus();
              }
            }
          },
        },
        {
          label: "⚡ Quick Capture Prompt",
          accelerator: "CommandOrControl+Shift+N",
          click: () => {
            const win = getMainWindow();
            if (win) {
              if (!win.isVisible()) win.show();
              win.focus();
              win.webContents.send("quick-capture:open");
            }
            onQuickCaptureTrigger?.();
          },
        },
        { type: "separator" },
        {
          label: "New Prompt",
          click: () => {
            const win = getMainWindow();
            if (win) {
              if (!win.isVisible()) win.show();
              win.focus();
              win.webContents.send("menu:navigate", "/prompts/new");
            }
          },
        },
        {
          label: "My Library",
          click: () => {
            const win = getMainWindow();
            if (win) {
              if (!win.isVisible()) win.show();
              win.focus();
              win.webContents.send("menu:navigate", "/prompts");
            }
          },
        },
        {
          label: "Settings",
          click: () => {
            const win = getMainWindow();
            if (win) {
              if (!win.isVisible()) win.show();
              win.focus();
              win.webContents.send("menu:navigate", "/settings");
            }
          },
        },
        { type: "separator" },
        {
          label: "Quit AI Prompt Library",
          click: () => {
            app.quit();
          },
        },
      ]);

      tray?.setContextMenu(contextMenu);
    };

    updateContextMenu();

    tray.on("click", () => {
      const win = getMainWindow();
      if (win) {
        if (win.isVisible()) {
          win.focus();
        } else {
          win.show();
          win.focus();
        }
      }
    });

    // Register Global Shortcut for Quick Capture (Ctrl/Cmd + Shift + N)
    try {
      const registered = globalShortcut.register("CommandOrControl+Shift+N", () => {
        const win = getMainWindow();
        if (win) {
          if (!win.isVisible()) win.show();
          win.focus();
          win.webContents.send("quick-capture:open");
        }
        onQuickCaptureTrigger?.();
      });
      if (registered) {
        console.log("[Tray] Global shortcut CommandOrControl+Shift+N registered successfully.");
      }
    } catch (scErr) {
      console.warn("[Tray] Could not register global shortcut:", scErr);
    }

    return tray;
  } catch (err) {
    console.error("[Tray] Failed to setup system tray:", err);
    return null;
  }
}

export function destroySystemTray() {
  if (tray) {
    tray.destroy();
    tray = null;
  }
  globalShortcut.unregisterAll();
}
