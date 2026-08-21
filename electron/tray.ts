import { app, Tray, Menu, BrowserWindow, globalShortcut, nativeImage } from "electron";
import path from "path";
import fs from "fs";

let tray: Tray | null = null;

/**
 * Creates a minimal 16x16 / 32x32 transparent PNG buffer with an indigo terminal square
 * for the system tray icon fallback if no asset file is found on disk.
 */
function createDefaultTrayIcon(): Electron.NativeImage {
  // Try standard icon locations in development and packaged production
  const possiblePaths = [
    path.join(process.resourcesPath || "", "build/icon.ico"),
    path.join(process.resourcesPath || "", "build/icon.png"),
    path.join(__dirname, "../build/icon.ico"),
    path.join(__dirname, "../build/icon.png"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const img = nativeImage.createFromPath(p);
        if (!img.isEmpty()) {
          return img.resize({ width: 16, height: 16 });
        }
      } catch {
        // Continue to next path
      }
    }
  }

  // 16x16 Indigo base64 PNG icon that works directly in memory without disk access
  const fallbackBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVR42mNk+M9QzwADjEwMDAwsDAwM/xmIAyMGjBowGgZgGf7//0+sE0Z145AGAPQ4GkE5yGjUAAAAAElFTkSuQmCC";
  return nativeImage.createFromDataURL(fallbackBase64);
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
    if (icon.isEmpty()) {
      console.warn("[Tray] No valid icon asset found on disk. Skipping system tray setup to prevent OS shell crash.");
      return null;
    }
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
