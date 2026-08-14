"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/electron/index.js
var require_electron = __commonJS({
  "node_modules/electron/index.js"(exports2, module2) {
    "use strict";
    var fs = require("fs");
    var path = require("path");
    var pathFile = path.join(__dirname, "path.txt");
    function getElectronPath() {
      let executablePath;
      if (fs.existsSync(pathFile)) {
        executablePath = fs.readFileSync(pathFile, "utf-8");
      }
      if (process.env.ELECTRON_OVERRIDE_DIST_PATH) {
        return path.join(process.env.ELECTRON_OVERRIDE_DIST_PATH, executablePath || "electron");
      }
      if (executablePath) {
        return path.join(__dirname, "dist", executablePath);
      } else {
        throw new Error("Electron failed to install correctly, please delete node_modules/electron and try installing again");
      }
    }
    module2.exports = getElectronPath();
  }
});

// electron/preload.ts
var preload_exports = {};
module.exports = __toCommonJS(preload_exports);
var import_electron = __toESM(require_electron());
var ALLOWED_CHANNELS = [
  "app:notification",
  "app:updateAvailable",
  "updater:status",
  "updater:available",
  "updater:error",
  "updater:progress",
  "updater:downloaded"
];
function isAllowedChannel(channel) {
  return ALLOWED_CHANNELS.includes(channel);
}
var electronAPI = {
  getAppInfo: () => import_electron.ipcRenderer.invoke("app:getInfo"),
  getSystemInfo: () => import_electron.ipcRenderer.invoke("app:getSystemInfo"),
  quit: () => import_electron.ipcRenderer.invoke("app:quit"),
  minimize: () => import_electron.ipcRenderer.invoke("app:minimize"),
  maximize: () => import_electron.ipcRenderer.invoke("app:maximize"),
  close: () => import_electron.ipcRenderer.invoke("app:close"),
  openExternal: (url) => import_electron.ipcRenderer.invoke("app:openExternal", url),
  relaunch: () => import_electron.ipcRenderer.invoke("app:relaunch"),
  openLogs: () => import_electron.ipcRenderer.invoke("app:openLogs"),
  on: (channel, listener) => {
    if (!isAllowedChannel(channel)) {
      console.warn(`[preload] Blocked subscription to unknown channel: ${channel}`);
      return;
    }
    import_electron.ipcRenderer.on(channel, listener);
  },
  off: (channel, listener) => {
    if (!isAllowedChannel(channel)) return;
    import_electron.ipcRenderer.off(channel, listener);
  },
  db: {
    mutate: (entityType, operation, payload) => import_electron.ipcRenderer.invoke("db:mutate", entityType, operation, payload),
    query: (entityType, id) => import_electron.ipcRenderer.invoke("db:query", entityType, id),
    queryAll: (entityType) => import_electron.ipcRenderer.invoke("db:queryAll", entityType),
    backup: () => import_electron.ipcRenderer.invoke("db:backup"),
    restore: (backupFilePath) => import_electron.ipcRenderer.invoke("db:restore", backupFilePath),
    getBackupStatus: () => import_electron.ipcRenderer.invoke("db:get-backup-status"),
    setBackupPath: (path) => import_electron.ipcRenderer.invoke("db:set-backup-path", path)
  },
  auth: {
    setToken: (key, token) => import_electron.ipcRenderer.invoke("auth:setToken", key, token),
    getToken: (key) => import_electron.ipcRenderer.invoke("auth:getToken", key),
    clearToken: (key) => import_electron.ipcRenderer.invoke("auth:clearToken", key)
  },
  updater: {
    checkForUpdates: () => import_electron.ipcRenderer.invoke("updater:check"),
    installUpdate: () => import_electron.ipcRenderer.invoke("updater:install")
  },
  prompts: {
    create: (payload) => import_electron.ipcRenderer.invoke("prompts:create", payload),
    getAll: (options) => import_electron.ipcRenderer.invoke("prompts:getAll", options),
    getById: (id) => import_electron.ipcRenderer.invoke("prompts:getById", id),
    addVersion: (payload) => import_electron.ipcRenderer.invoke("prompts:addVersion", payload),
    updateMeta: (payload) => import_electron.ipcRenderer.invoke("prompts:updateMeta", payload),
    toggleFavorite: (id) => import_electron.ipcRenderer.invoke("prompts:toggleFavorite", id),
    delete: (id) => import_electron.ipcRenderer.invoke("prompts:delete", id)
  }
};
import_electron.contextBridge.exposeInMainWorld("electron", electronAPI);
