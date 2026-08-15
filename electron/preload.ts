import { contextBridge, ipcRenderer } from "electron";

const api = {
  getAppInfo: () => ipcRenderer.invoke("app:getAppInfo"),
  openExternal: (url: string) => ipcRenderer.invoke("app:openExternal", url),
  checkForUpdates: () => ipcRenderer.invoke("app:checkForUpdates"),

  updater: {
    getUpdateStatus: () => ipcRenderer.invoke("app:getUpdateStatus"),
    installNow: () => ipcRenderer.invoke("app:installUpdateNow"),
    onStatus: (callback: (data: any) => void) => {
      const subscription = (_event: any, value: any) => callback(value);
      ipcRenderer.on("updater:status", subscription);
      return () => {
        ipcRenderer.removeListener("updater:status", subscription);
      };
    },
  },

  security: {
    getStatus: () => ipcRenderer.invoke("security:getStatus"),
    unlock: (input: string) => ipcRenderer.invoke("security:unlock", input),
    changePassword: (currentPassword?: string, newPassword?: string) => ipcRenderer.invoke("security:changePassword", currentPassword, newPassword),
    setupPin: (password: string, pin: string) => ipcRenderer.invoke("security:setupPin", password, pin),
    generateRecoveryKey: () => ipcRenderer.invoke("security:generateRecoveryKey"),
    recoverAccess: (recoveryInput: string, newPassword: string, method: "key" | "questions") => ipcRenderer.invoke("security:recoverAccess", recoveryInput, newPassword, method),
    toggleLock: (enabled: boolean) => ipcRenderer.invoke("security:toggleLock", enabled),
    setLockMethod: (method: "password" | "pin") => ipcRenderer.invoke("security:setLockMethod", method),
  },

  storage: {
    selectFolder: () => ipcRenderer.invoke("storage:selectFolder"),
    openFolder: (targetPath?: string) => ipcRenderer.invoke("storage:openStorageFolder", targetPath),
  },

  onMenuNavigate: (callback: (path: string) => void) => {
    const sub = (_event: any, path: string) => callback(path);
    ipcRenderer.on("menu:navigate", sub);
    return () => {
      ipcRenderer.removeListener("menu:navigate", sub);
    };
  },
  onOpenLibraryFolder: (callback: () => void) => {
    const sub = () => callback();
    ipcRenderer.on("menu:openLibraryFolder", sub);
    return () => {
      ipcRenderer.removeListener("menu:openLibraryFolder", sub);
    };
  },
  onOpenAboutDialog: (callback: () => void) => {
    const sub = () => callback();
    ipcRenderer.on("menu:openAboutDialog", sub);
    return () => {
      ipcRenderer.removeListener("menu:openAboutDialog", sub);
    };
  },
};

// Whitelisted IPC endpoints for secure renderer-main communication
contextBridge.exposeInMainWorld("electronAPI", api);
contextBridge.exposeInMainWorld("electron", api);
