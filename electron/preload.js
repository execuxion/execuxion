import { contextBridge, ipcRenderer } from 'electron';

// Exposed API to renderer process
const api = {
  // App info
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    getPlatform: () => ipcRenderer.invoke('app:getPlatform'),
  },

  // Auto-updater
  updater: {
    check: () => ipcRenderer.invoke('updater:check'),
    download: () => ipcRenderer.invoke('updater:download'),
    install: () => ipcRenderer.invoke('updater:install'),
    onUpdateAvailable: (callback) => {
      ipcRenderer.on('update-available', (event, info) => callback(info));
    },
    onUpdateDownloaded: (callback) => {
      ipcRenderer.on('update-downloaded', (event, info) => callback(info));
    },
    onDownloadProgress: (callback) => {
      ipcRenderer.on('download-progress', (event, progress) => callback(progress));
    },
    onUpdateError: (callback) => {
      ipcRenderer.on('update-error', (event, error) => callback(error));
    },
  },

  // Storage (replaces browser.storage with browser-compatible API)
  storage: {
    get: (keys) => ipcRenderer.invoke('storage:get', keys),
    set: (items) => ipcRenderer.invoke('storage:set', items),
    remove: (keys) => ipcRenderer.invoke('storage:remove', keys),
    clear: () => ipcRenderer.invoke('storage:clear'),
    has: (key) => ipcRenderer.invoke('storage:has', key),
    keys: () => ipcRenderer.invoke('storage:keys'),
    onChanged: (callback) => {
      const listener = (event, changes) => callback(changes, 'local');
      ipcRenderer.on('storage:changed', listener);
      return () => ipcRenderer.removeListener('storage:changed', listener);
    },
  },

  // File system operations
  fs: {
    readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
    writeFile: (filePath, content) => ipcRenderer.invoke('fs:writeFile', filePath, content),
    deleteFile: (filePath) => ipcRenderer.invoke('fs:deleteFile', filePath),
    selectFile: (options) => ipcRenderer.invoke('fs:selectFile', options),
    selectDirectory: (options) => ipcRenderer.invoke('fs:selectDirectory', options),
  },

  // Execuxion API integration
  execuxion: {
    setApiKey: (apiKey) => ipcRenderer.invoke('execuxion:setApiKey', apiKey),
    getApiKey: () => ipcRenderer.invoke('execuxion:getApiKey'),
    clearApiKey: () => ipcRenderer.invoke('execuxion:clearApiKey'),
    getClientInfo: () => ipcRenderer.invoke('execuxion:getClientInfo'),
    makeRequest: (operation, args) => ipcRenderer.invoke('execuxion:makeRequest', operation, args),
  },

  // Window controls for custom title bar
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  },

  // Platform detection
  isElectron: true,
  platform: process.platform,
};

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('electron', api);

// Also expose as 'execuxion' for app-specific access
contextBridge.exposeInMainWorld('execuxion', {
  isDesktop: true,
  platform: process.platform,
  api: api.execuxion,
});

console.log('Preload script loaded successfully');
