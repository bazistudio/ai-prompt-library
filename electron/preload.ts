import { contextBridge, ipcRenderer } from "electron";

const api = {
  getAppInfo: () => ipcRenderer.invoke("app:getAppInfo"),
  openExternal: (url: string) => ipcRenderer.invoke("app:openExternal", url),
  checkForUpdates: () => ipcRenderer.invoke("app:checkForUpdates"),

  storage: {
    selectFolder: () => ipcRenderer.invoke("storage:selectFolder"),
    openFolder: (targetPath?: string) => ipcRenderer.invoke("storage:openStorageFolder", targetPath),
  },

  db: {
    selectFolder: () => ipcRenderer.invoke("storage:selectFolder"),
    openFolder: (targetPath?: string) => ipcRenderer.invoke("storage:openStorageFolder", targetPath),
  },
};

// Whitelisted IPC endpoints for secure renderer-main communication
contextBridge.exposeInMainWorld("electronAPI", api);
contextBridge.exposeInMainWorld("electron", api);
