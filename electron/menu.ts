import { Menu, BrowserWindow, app } from "electron";
import { checkForUpdatesManually } from "./updater";

export function setupApplicationMenu(mainWindow: BrowserWindow) {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: "File",
      submenu: [
        {
          label: "New Prompt",
          accelerator: "CmdOrCtrl+N",
          click: () => mainWindow.webContents.send("menu:navigate", "/prompts/new"),
        },
        {
          label: "New Category",
          accelerator: "CmdOrCtrl+Shift+N",
          click: () => mainWindow.webContents.send("menu:navigate", "/categories"),
        },
        { type: "separator" },
        {
          label: "Open Library Folder",
          click: () => mainWindow.webContents.send("menu:openLibraryFolder"),
        },
        {
          label: "Change Storage Location",
          click: () => mainWindow.webContents.send("menu:navigate", "/settings"),
        },
        { type: "separator" },
        {
          label: "Exit",
          accelerator: "CmdOrCtrl+Q",
          click: () => app.quit(),
        },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        {
          label: "Dashboard",
          click: () => mainWindow.webContents.send("menu:navigate", "/dashboard"),
        },
        {
          label: "Prompt Library",
          click: () => mainWindow.webContents.send("menu:navigate", "/prompts"),
        },
        {
          label: "Categories",
          click: () => mainWindow.webContents.send("menu:navigate", "/categories"),
        },
        {
          label: "Settings",
          click: () => mainWindow.webContents.send("menu:navigate", "/settings"),
        },
        { type: "separator" },
        { role: "reload" },
      ],
    },
    {
      label: "Tools",
      submenu: [
        {
          label: "Backup Library",
          click: () => mainWindow.webContents.send("menu:navigate", "/settings"),
        },
        {
          label: "Restore Library",
          click: () => mainWindow.webContents.send("menu:navigate", "/settings"),
        },
        { type: "separator" },
        {
          label: "Check for Updates",
          click: () => checkForUpdatesManually(),
        },
        {
          label: "Application Security",
          click: () => mainWindow.webContents.send("menu:navigate", "/settings?tab=account"),
        },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "Keyboard Shortcuts",
          click: () => mainWindow.webContents.send("menu:navigate", "/settings"),
        },
        { type: "separator" },
        {
          label: "About AI Prompt Library",
          click: () => mainWindow.webContents.send("menu:openAboutDialog"),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
