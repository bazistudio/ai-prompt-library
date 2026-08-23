import { contextBridge, ipcRenderer } from "electron";

console.log("[PRELOAD] Minimal Electron Preload initialized.");

const api = {
  getAppInfo: () => ipcRenderer.invoke("app:getAppInfo"),
};

contextBridge.exposeInMainWorld("electronAPI", api);
contextBridge.exposeInMainWorld("electron", api);
