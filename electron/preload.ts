import { contextBridge, ipcRenderer } from "electron";

// Whitelisted IPC endpoints for secure renderer-main communication
contextBridge.exposeInMainWorld("electronAPI", {
  getAppInfo: () => ipcRenderer.invoke("app:getAppInfo"),
  openExternal: (url: string) => ipcRenderer.invoke("app:openExternal", url),
  checkForUpdates: () => ipcRenderer.invoke("app:checkForUpdates"),
});
