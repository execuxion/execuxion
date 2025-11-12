import { app, BrowserWindow, ipcMain, session, dialog, Menu, screen } from 'electron';
import updater from 'electron-updater';
import Store from 'electron-store';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';

const { autoUpdater } = updater;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize electron-store with encryption
const store = new Store({
  name: 'execuxion-data',
  encryptionKey: 'execuxion-secure-storage-key',
  defaults: {
    workflows: {},
    settings: {
      theme: 'dark',
      language: 'en'
    },
    auth: {
      apiKey: null,
      clientId: null
    }
  }
});

// Environment detection
const isDev = process.env.NODE_ENV === 'development';
const isProduction = !isDev;

// Enable remote debugging for development
if (isDev || process.env.ELECTRON_DEBUG) {
  app.commandLine.appendSwitch('remote-debugging-port', '9222');
}

// Disable hardware acceleration for better compatibility
app.disableHardwareAcceleration();

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

// Windows management
let mainWindow = null;

// Auto-updater configuration
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// Create main window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    show: false,
    backgroundColor: '#111827', // Dark mode gray-900
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false, // Allow HTTP requests without CORS restrictions
      allowRunningInsecureContent: false,
    },
    frame: false, // Frameless window for custom title bar
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
  });

  // Load URL
  if (isDev) {
    mainWindow.loadURL('http://localhost:3001');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Set default zoom level to -1 (one level zoomed out from Electron's default)
  mainWindow.webContents.setZoomLevel(-1);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    // Ensure window respects taskbar on all platforms
    const primaryDisplay = screen.getPrimaryDisplay();
    const { workArea, bounds } = primaryDisplay;

    // Get current window bounds
    const windowBounds = mainWindow.getBounds();

    // Adjust window to fit within work area (excludes taskbar)
    const newBounds = {
      x: Math.max(workArea.x, windowBounds.x),
      y: Math.max(workArea.y, windowBounds.y),
      width: Math.min(workArea.width, windowBounds.width),
      height: Math.min(workArea.height, windowBounds.height)
    };

    mainWindow.setBounds(newBounds);
    mainWindow.show();

    // Check for updates in production
    if (isProduction) {
      autoUpdater.checkForUpdates();
    }
  });

  // Handle maximize to respect taskbar on all platforms
  mainWindow.on('maximize', () => {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { workArea } = primaryDisplay;

    // Set bounds to work area (respects taskbar)
    mainWindow.setBounds({
      x: workArea.x,
      y: workArea.y,
      width: workArea.width,
      height: workArea.height
    });
  });

  // Window state management
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      require('electron').shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });
}

// App lifecycle events
app.whenReady().then(() => {
  // Security headers
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["script-src 'self' 'unsafe-inline' 'unsafe-eval'"],
      },
    });
  });

  // Create menu with zoom shortcuts
  const template = [
    {
      label: 'View',
      submenu: [
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+=',
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (win) {
              const currentZoom = win.webContents.getZoomLevel();
              win.webContents.setZoomLevel(currentZoom + 1);
            }
          }
        },
        {
          label: 'Zoom In (Plus)',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (win) {
              const currentZoom = win.webContents.getZoomLevel();
              win.webContents.setZoomLevel(currentZoom + 1);
            }
          }
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (win) {
              const currentZoom = win.webContents.getZoomLevel();
              win.webContents.setZoomLevel(currentZoom - 1);
            }
          }
        },
        {
          label: 'Reset Zoom',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (win) {
              win.webContents.setZoomLevel(0);
            }
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// Auto-updater events
autoUpdater.on('update-available', (info) => {
  mainWindow?.webContents.send('update-available', info);
});

autoUpdater.on('update-downloaded', (info) => {
  mainWindow?.webContents.send('update-downloaded', info);
});

autoUpdater.on('error', (err) => {
  mainWindow?.webContents.send('update-error', err);
});

autoUpdater.on('download-progress', (progressObj) => {
  mainWindow?.webContents.send('download-progress', progressObj);
});

// IPC handlers
ipcMain.handle('app:getVersion', () => {
  return app.getVersion();
});

ipcMain.handle('app:getPlatform', () => {
  return process.platform;
});

ipcMain.handle('updater:check', async () => {
  if (isProduction) {
    const result = await autoUpdater.checkForUpdates();
    return result?.updateInfo || null;
  }
  return null;
});

ipcMain.handle('updater:download', () => {
  if (isProduction) {
    autoUpdater.downloadUpdate();
  }
});

ipcMain.handle('updater:install', () => {
  if (isProduction) {
    autoUpdater.quitAndInstall(false, true);
  }
});

// Storage IPC handlers using electron-store
// These handlers provide a browser.storage.local compatible API

ipcMain.handle('storage:get', async (event, keys) => {
  try {
    // Get all data if no keys specified
    if (!keys) {
      // electron-store returns an object with null prototype
      // Convert to plain object to ensure proper IPC serialization
      const storeData = store.store;
      const allData = JSON.parse(JSON.stringify(storeData || {}));
      console.log('[IPC storage:get] Returning all data, keys:', Object.keys(allData).length);
      return allData;
    }

    // Single key as string
    if (typeof keys === 'string') {
      const value = store.get(keys);
      console.log(`[IPC storage:get] Key "${keys}":`, value !== undefined ? 'found' : 'not found');
      return { [keys]: value };
    }

    // Array of keys
    if (Array.isArray(keys)) {
      const result = {};
      keys.forEach(key => {
        const value = store.get(key);
        if (value !== undefined) {
          result[key] = value;
        }
      });
      console.log('[IPC storage:get] Array keys:', keys, 'Found:', Object.keys(result));
      return result;
    }

    // Object with default values
    if (typeof keys === 'object') {
      const result = {};
      Object.keys(keys).forEach(key => {
        const value = store.get(key);
        result[key] = value !== undefined ? value : keys[key];
      });
      console.log('[IPC storage:get] Object keys with defaults');
      return result;
    }

    console.log('[IPC storage:get] Fallback: returning empty object');
    return {};
  } catch (error) {
    console.error('[IPC storage:get] Error:', error);
    return {};
  }
});

ipcMain.handle('storage:set', async (event, items) => {
  try {
    if (!items || typeof items !== 'object') {
      return false;
    }

    // Get old values for change detection
    const changes = {};
    const oldStore = { ...store.store };

    // Set all items
    Object.entries(items).forEach(([key, value]) => {
      const oldValue = store.get(key);
      store.set(key, value);

      // Track changes
      if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
        changes[key] = {
          oldValue,
          newValue: value
        };
      }
    });

    // Notify renderer of changes if any
    if (Object.keys(changes).length > 0 && mainWindow) {
      mainWindow.webContents.send('storage:changed', changes);
    }

    return true;
  } catch (error) {
    console.error('Storage set error:', error);
    return false;
  }
});

ipcMain.handle('storage:remove', async (event, keys) => {
  try {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    const changes = {};

    keysArray.forEach(key => {
      const oldValue = store.get(key);
      if (oldValue !== undefined) {
        store.delete(key);
        changes[key] = {
          oldValue,
          newValue: undefined
        };
      }
    });

    // Notify renderer of changes
    if (Object.keys(changes).length > 0 && mainWindow) {
      mainWindow.webContents.send('storage:changed', changes);
    }

    return true;
  } catch (error) {
    console.error('Storage remove error:', error);
    return false;
  }
});

ipcMain.handle('storage:clear', async () => {
  try {
    const oldStore = { ...store.store };
    store.clear();

    // Notify renderer of all cleared items
    const changes = {};
    Object.keys(oldStore).forEach(key => {
      changes[key] = {
        oldValue: oldStore[key],
        newValue: undefined
      };
    });

    if (Object.keys(changes).length > 0 && mainWindow) {
      mainWindow.webContents.send('storage:changed', changes);
    }

    return true;
  } catch (error) {
    console.error('Storage clear error:', error);
    return false;
  }
});

ipcMain.handle('storage:has', async (event, key) => {
  try {
    return store.has(key);
  } catch (error) {
    console.error('Storage has error:', error);
    return false;
  }
});

ipcMain.handle('storage:keys', async () => {
  try {
    return Object.keys(store.store);
  } catch (error) {
    console.error('Storage keys error:', error);
    return [];
  }
});

// File system IPC handlers
ipcMain.handle('fs:readFile', async (event, filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fs:writeFile', async (event, filePath, content) => {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fs:deleteFile', async (event, filePath) => {
  try {
    await fs.unlink(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fs:selectFile', async (event, options = {}) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: options.filters || [],
      ...options
    });
    if (result.canceled) {
      return { success: false, canceled: true };
    }
    return { success: true, filePaths: result.filePaths };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fs:selectDirectory', async (event, options = {}) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      ...options
    });
    if (result.canceled) {
      return { success: false, canceled: true };
    }
    return { success: true, filePaths: result.filePaths };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fs:saveDialog', async (event, options = {}) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: options.filters || [],
      defaultPath: options.defaultPath || '',
      ...options
    });
    if (result.canceled) {
      return { success: false, canceled: true };
    }
    return { success: true, filePath: result.filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Execuxion API integration handlers
ipcMain.handle('execuxion:setApiKey', async (event, apiKey) => {
  try {
    store.set('auth.apiKey', apiKey);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('execuxion:getApiKey', async () => {
  try {
    const apiKey = store.get('auth.apiKey');
    return { success: true, apiKey };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('execuxion:clearApiKey', async () => {
  try {
    store.delete('auth.apiKey');
    store.delete('auth.clientId');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('execuxion:getClientInfo', async () => {
  try {
    const apiKey = store.get('auth.apiKey');
    if (!apiKey) {
      return { success: false, error: 'No API key set' };
    }
    // This will be implemented to call the actual Execuxion API
    return { success: true, clientInfo: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('execuxion:makeRequest', async (event, operation, args) => {
  try {
    const apiKey = store.get('auth.apiKey');
    if (!apiKey) {
      return { success: false, error: 'No API key set. Please login first.' };
    }
    // This will be implemented to call the actual Execuxion API
    // For now, return a placeholder
    return { success: false, error: 'API integration not yet implemented' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Window control IPC handlers for custom title bar
ipcMain.handle('window:minimize', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle('window:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('window:close', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

ipcMain.handle('window:isMaximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});
