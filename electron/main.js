import { app, BrowserWindow, ipcMain, session, dialog, Menu, screen, safeStorage } from 'electron';
import updater from 'electron-updater';
import Store from 'electron-store';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import crypto from 'node:crypto';
import { createHmac } from 'node:crypto';

const { autoUpdater } = updater;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Generate or retrieve encryption key using OS keychain via safeStorage
// Falls back to file-based storage in development mode when OS encryption unavailable
function getEncryptionKey() {
  const keyStorePath = path.join(app.getPath('userData'), '.encryption-key');
  const devKeyPath = path.join(app.getPath('userData'), '.dev-encryption-key');
  const isProduction = app.isPackaged;

  try {
    // Try OS-encrypted key first (production mode)
    if (fsSync.existsSync(keyStorePath)) {
      if (safeStorage.isEncryptionAvailable()) {
        const encryptedKey = fsSync.readFileSync(keyStorePath);
        const decryptedKey = safeStorage.decryptString(encryptedKey);
        console.log('[Security] ✅ Loaded encryption key from OS keychain');
        return decryptedKey;
      }
    }

    // Check for development key (fallback)
    if (fsSync.existsSync(devKeyPath)) {
      const devKey = fsSync.readFileSync(devKeyPath, 'utf8');
      if (!isProduction) {
        console.warn('[Security] ⚠️ Using development encryption key (not OS-protected)');
      }
      return devKey;
    }

    // Generate a new random encryption key (256-bit)
    const newKey = crypto.randomBytes(32).toString('hex');

    // Try to use OS keychain (production)
    if (safeStorage.isEncryptionAvailable()) {
      const encryptedKey = safeStorage.encryptString(newKey);
      fsSync.writeFileSync(keyStorePath, encryptedKey);

      // Secure the key file permissions (Unix only)
      if (process.platform !== 'win32') {
        fsSync.chmodSync(keyStorePath, 0o600); // Owner read/write only
      }

      console.log('[Security] ✅ Generated new encryption key in OS keychain');
      return newKey;
    } else {
      // Fallback for development mode
      if (!isProduction) {
        console.warn('[Security] ⚠️ OS encryption not available - using development fallback');
        console.warn('[Security] ⚠️ This is ONLY acceptable in development mode');

        fsSync.writeFileSync(devKeyPath, newKey, 'utf8');

        // Secure the key file permissions (Unix only)
        if (process.platform !== 'win32') {
          fsSync.chmodSync(devKeyPath, 0o600);
        }

        return newKey;
      } else {
        throw new Error('OS encryption not available in production build');
      }
    }
  } catch (error) {
    console.error('[Security] ❌ Failed to get encryption key:', error.message);
    throw error;
  }
}

// HMAC integrity verification functions
// Provides tamper detection for stored data
const HMAC_KEY_FILE = '.hmac-key';
const DEV_HMAC_KEY_FILE = '.dev-hmac-key';

function getHmacKey() {
  const hmacKeyPath = path.join(app.getPath('userData'), HMAC_KEY_FILE);
  const devHmacKeyPath = path.join(app.getPath('userData'), DEV_HMAC_KEY_FILE);
  const isProduction = app.isPackaged;

  try {
    // Try OS-encrypted HMAC key first (production mode)
    if (fsSync.existsSync(hmacKeyPath)) {
      if (safeStorage.isEncryptionAvailable()) {
        const encryptedHmacKey = fsSync.readFileSync(hmacKeyPath);
        return safeStorage.decryptString(encryptedHmacKey);
      }
    }

    // Check for development HMAC key (fallback)
    if (fsSync.existsSync(devHmacKeyPath)) {
      const devHmacKey = fsSync.readFileSync(devHmacKeyPath, 'utf8');
      return devHmacKey;
    }

    // Generate new HMAC key (256-bit)
    const newHmacKey = crypto.randomBytes(32).toString('hex');

    // Try to use OS keychain (production)
    if (safeStorage.isEncryptionAvailable()) {
      const encryptedHmacKey = safeStorage.encryptString(newHmacKey);
      fsSync.writeFileSync(hmacKeyPath, encryptedHmacKey);

      if (process.platform !== 'win32') {
        fsSync.chmodSync(hmacKeyPath, 0o600);
      }

      return newHmacKey;
    } else {
      // Fallback for development mode
      if (!isProduction) {
        fsSync.writeFileSync(devHmacKeyPath, newHmacKey, 'utf8');

        if (process.platform !== 'win32') {
          fsSync.chmodSync(devHmacKeyPath, 0o600);
        }

        return newHmacKey;
      } else {
        throw new Error('OS encryption not available in production build');
      }
    }
  } catch (error) {
    console.error('[Security] ❌ Failed to get HMAC key:', error.message);
    throw error;
  }
}

function calculateHmac(data, hmacKey) {
  const dataString = typeof data === 'string' ? data : JSON.stringify(data);
  return createHmac('sha256', hmacKey).update(dataString).digest('hex');
}

function verifyHmac(data, expectedHmac, hmacKey) {
  const calculatedHmac = calculateHmac(data, hmacKey);
  return calculatedHmac === expectedHmac;
}

// Initialize electron-store with encryption and corruption recovery
let store;
let hmacKey;
try {
  const encryptionKey = getEncryptionKey();
  hmacKey = getHmacKey();

  store = new Store({
    name: 'execuxion-data',
    encryptionKey,
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

  // Generate HMAC signatures for all existing data that doesn't have them
  // This handles default values and any data created outside of IPC handlers
  const allKeys = Object.keys(store.store);
  let hmacGenerated = 0;

  allKeys.forEach(key => {
    // Skip HMAC keys themselves
    if (key.startsWith('__hmac__')) return;

    // Check if this key already has an HMAC
    const hmacStorageKey = `__hmac__${key}`;
    if (!store.has(hmacStorageKey)) {
      // Generate HMAC for this key
      const value = store.get(key);
      const hmac = calculateHmac(value, hmacKey);  // Use the HMAC key from initialization
      store.set(hmacStorageKey, hmac);
      hmacGenerated++;
    }
  });

  if (hmacGenerated > 0) {
    console.log(`[Security] ✅ Generated HMAC signatures for ${hmacGenerated} existing keys`);
  }

} catch (error) {
  console.error('[Storage] ❌ Initialization failed:', error.message);

  // If storage is corrupted, delete it and recreate
  if (error.message?.includes('not valid JSON') || error.name === 'SyntaxError') {
    console.warn('⚠️ Detected corrupted storage file, attempting recovery...');

    try {
      // Get the config file path (electron-store uses name + .json directly in userData)
      const configPath = path.join(app.getPath('userData'), 'execuxion-data.json');
      const backupPath = path.join(app.getPath('userData'), 'execuxion-data.json.corrupted');

      console.log(`🔍 Looking for corrupted file at: ${configPath}`);

      // Check if file exists
      if (fsSync.existsSync(configPath)) {
        // Backup corrupted file before deletion (synchronous)
        try {
          fsSync.copyFileSync(configPath, backupPath);
          console.log(`📦 Backed up corrupted file to: ${backupPath}`);
        } catch (copyError) {
          console.warn('⚠️ Could not backup corrupted file:', copyError.message);
        }

        // Delete corrupted file (synchronous)
        try {
          fsSync.unlinkSync(configPath);
          console.log('🗑️ Deleted corrupted storage file');
        } catch (unlinkError) {
          console.warn('⚠️ Could not delete corrupted file:', unlinkError.message);
        }
      } else {
        console.log('ℹ️ Corrupted file does not exist, will create fresh storage');
      }

      // Recreate store with fresh data (will generate new encryption key)
      const newEncryptionKey = getEncryptionKey();

      store = new Store({
        name: 'execuxion-data',
        encryptionKey: newEncryptionKey,
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

      console.log('[Storage] ✅ Storage recreated successfully');

      // Notify user about data loss
      dialog.showMessageBox({
        type: 'warning',
        title: 'Storage Recovered',
        message: 'The storage file was corrupted and has been reset.',
        detail: 'Your workflows and settings have been reset to defaults. A backup of the corrupted file was saved for recovery attempts.',
        buttons: ['OK']
      });

    } catch (recoveryError) {
      console.error('❌ Failed to recover from corruption:', recoveryError);
      dialog.showErrorBox(
        'Fatal Error',
        'Failed to initialize storage. Please contact support.\n\nError: ' + recoveryError.message
      );
      app.quit();
    }
  } else {
    // Unknown error, can't recover
    dialog.showErrorBox(
      'Fatal Error',
      'Failed to initialize storage. Please contact support.\n\nError: ' + error.message
    );
    app.quit();
  }
}

// Environment detection
const isDev = process.env.NODE_ENV === 'development';
const isProduction = !isDev;

// Enable remote debugging ONLY in development mode
// Security: Do not enable in production as it allows localhost debugging access
if (isDev) {
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
      webSecurity: isProduction, // Enable in production, disable in dev for localhost CORS
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
    // Helper to verify HMAC for a key
    const getWithHmacVerify = (key) => {
      const value = store.get(key);
      if (value === undefined) return undefined;

      // Check HMAC integrity
      const hmacStorageKey = `__hmac__${key}`;
      const storedHmac = store.get(hmacStorageKey);

      if (storedHmac) {
        // Use the global hmacKey (the actual secret key), not the storage key name
        const isValid = verifyHmac(value, storedHmac, hmacKey);
        if (!isValid) {
          console.error('[Security] HMAC verification failed for key:', key);
          // Return undefined to indicate corrupted data
          return undefined;
        }
      }

      return value;
    };

    // Get all data if no keys specified
    if (!keys) {
      const storeData = store.store;
      const allData = {};

      // Filter out HMAC keys and verify data
      Object.keys(storeData).forEach(key => {
        if (!key.startsWith('__hmac__')) {
          const verifiedValue = getWithHmacVerify(key);
          if (verifiedValue !== undefined) {
            allData[key] = verifiedValue;
          }
        }
      });

      return allData;
    }

    // Single key as string
    if (typeof keys === 'string') {
      const value = getWithHmacVerify(keys);
      return { [keys]: value };
    }

    // Array of keys
    if (Array.isArray(keys)) {
      const result = {};
      keys.forEach(key => {
        const value = getWithHmacVerify(key);
        if (value !== undefined) {
          result[key] = value;
        }
      });
      return result;
    }

    // Object with default values
    if (typeof keys === 'object') {
      const result = {};
      Object.keys(keys).forEach(key => {
        const value = getWithHmacVerify(key);
        result[key] = value !== undefined ? value : keys[key];
      });
      return result;
    }

    return {};
  } catch (error) {
    console.error('[Storage] Get error:', error.message);
    return {};
  }
});

ipcMain.handle('storage:set', async (event, items) => {
  try {
    if (!items || typeof items !== 'object') {
      return false;
    }

    // Enforce storage quota
    const MAX_STORAGE_SIZE = 100 * 1024 * 1024; // 100 MB
    const proposedData = JSON.stringify(items);
    const proposedSize = proposedData.length;
    const currentStoreData = JSON.stringify(store.store);
    const currentSize = currentStoreData.length;
    const newTotalSize = currentSize + proposedSize;

    if (newTotalSize > MAX_STORAGE_SIZE) {
      console.error('[Storage] Quota exceeded');

      // Send error to renderer
      if (mainWindow) {
        mainWindow.webContents.send('storage:quota-exceeded', {
          currentSize,
          proposedSize,
          limit: MAX_STORAGE_SIZE
        });
      }

      return false;
    }

    // Get old values for change detection
    const changes = {};
    const oldStore = { ...store.store };

    // Set all items with verification and HMAC
    Object.entries(items).forEach(([key, value]) => {
      const oldValue = store.get(key);
      store.set(key, value);

      // Verify write succeeded
      const written = store.get(key);
      if (JSON.stringify(written) !== JSON.stringify(value)) {
        throw new Error(`Write verification failed for ${key}`);
      }

      // Generate and store HMAC for integrity verification
      const hmac = calculateHmac(value, hmacKey);
      store.set(`__hmac__${key}`, hmac);

      // Track changes
      if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
        changes[key] = {
          oldValue,
          newValue: value
        };
      }
    });

    // Force sync to disk
    await new Promise(resolve => setImmediate(resolve));

    // Notify renderer of changes
    if (Object.keys(changes).length > 0 && mainWindow) {
      mainWindow.webContents.send('storage:changed', changes);
    }

    return true;

  } catch (error) {
    console.error('[Storage] Write error:', error.message);
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
        // Also remove HMAC
        store.delete(`__hmac__${key}`);
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
    console.error('[Storage] Remove error:', error.message);
    return false;
  }
});

ipcMain.handle('storage:clear', async () => {
  try {
    const oldStore = { ...store.store };
    store.clear();

    // Notify renderer of all cleared items (excluding HMAC keys)
    const changes = {};
    Object.keys(oldStore).forEach(key => {
      if (!key.startsWith('__hmac__')) {
        changes[key] = {
          oldValue: oldStore[key],
          newValue: undefined
        };
      }
    });

    if (Object.keys(changes).length > 0 && mainWindow) {
      mainWindow.webContents.send('storage:changed', changes);
    }

    return true;
  } catch (error) {
    console.error('[Storage] Clear error:', error.message);
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
