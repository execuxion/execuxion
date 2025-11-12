/**
 * Browser Extension Polyfill for Electron
 *
 * Provides a drop-in replacement for webextension-polyfill that bridges
 * browser extension APIs to Electron's IPC system. This allows the existing
 * browser extension code to work seamlessly in the Electron environment.
 *
 * Key features:
 * - Full browser.storage.local API compatibility
 * - Storage change event listeners
 * - Automatic fallback to localStorage for web environments
 * - Performance optimization with caching
 */

// Environment detection
const isElectron = typeof window !== 'undefined' && window.electron;

/**
 * Storage Area Implementation
 * Mimics browser.storage.local / browser.storage.sync API
 */
class StorageArea {
  constructor(areaName) {
    this.areaName = areaName;
    this.changeListeners = new Set();
    this._cache = null;
    this._cachePromise = null;
  }

  /**
   * Get cached data or fetch from storage
   * @private
   */
  async _getCache() {
    if (this._cache !== null) {
      return this._cache;
    }

    if (this._cachePromise) {
      return this._cachePromise;
    }

    if (isElectron) {
      this._cachePromise = window.electron.storage.get()
        .then(data => {
          this._cache = data || {};
          this._cachePromise = null;
          return this._cache;
        })
        .catch(error => {
          console.error('[StorageArea] Failed to load cache:', error);
          this._cache = {};
          this._cachePromise = null;
          return this._cache;
        });
      return this._cachePromise;
    }

    // Fallback to localStorage for non-Electron environments
    try {
      const stored = localStorage.getItem(`automa-${this.areaName}`);
      this._cache = stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('[StorageArea] Failed to parse localStorage:', error);
      this._cache = {};
    }

    return this._cache;
  }

  /**
   * Update cache with new values
   * @private
   */
  _updateCache(updates) {
    if (this._cache !== null && updates) {
      Object.assign(this._cache, updates);
    }
  }

  /**
   * Invalidate cache
   * @private
   */
  _invalidateCache() {
    this._cache = null;
  }

  /**
   * Get items from storage
   * @param {string|string[]|Object|null} keys - Key(s) to retrieve
   * @returns {Promise<Object>} Object with key-value pairs
   */
  async get(keys) {
    const allData = await this._getCache();

    // No keys - return all data
    if (keys === null || keys === undefined) {
      return { ...allData };
    }

    // Single key as string
    if (typeof keys === 'string') {
      return { [keys]: allData[keys] };
    }

    // Array of keys
    if (Array.isArray(keys)) {
      const result = {};
      keys.forEach(key => {
        if (key in allData) {
          result[key] = allData[key];
        }
      });
      return result;
    }

    // Object with default values
    if (typeof keys === 'object') {
      const result = {};
      Object.keys(keys).forEach(key => {
        result[key] = (key in allData) ? allData[key] : keys[key];
      });
      return result;
    }

    return {};
  }

  /**
   * Set items in storage
   * @param {Object} items - Key-value pairs to store
   * @returns {Promise<void>}
   */
  async set(items) {
    if (!items || typeof items !== 'object' || Array.isArray(items)) {
      return Promise.resolve();
    }

    const oldData = await this._getCache();
    const oldValues = { ...oldData };

    if (isElectron) {
      // Use Electron IPC
      await window.electron.storage.set(items);
      this._updateCache(items);

      // Changes are emitted via IPC from main process
      // No need to manually emit here
    } else {
      // Fallback to localStorage
      Object.assign(oldData, items);
      try {
        localStorage.setItem(`automa-${this.areaName}`, JSON.stringify(oldData));
      } catch (error) {
        console.error('[StorageArea] Failed to save to localStorage:', error);
      }
      this._updateCache(items);

      // Manually emit changes for localStorage
      this._emitChanges(oldValues, oldData);
    }

    return Promise.resolve();
  }

  /**
   * Remove items from storage
   * @param {string|string[]} keys - Key(s) to remove
   * @returns {Promise<void>}
   */
  async remove(keys) {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    const oldData = await this._getCache();
    const oldValues = {};

    keysArray.forEach(key => {
      oldValues[key] = oldData[key];
    });

    if (isElectron) {
      await window.electron.storage.remove(keysArray);

      // Update cache
      if (this._cache) {
        keysArray.forEach(key => {
          delete this._cache[key];
        });
      }
    } else {
      // Fallback to localStorage
      keysArray.forEach(key => {
        delete oldData[key];
      });

      try {
        localStorage.setItem(`automa-${this.areaName}`, JSON.stringify(oldData));
      } catch (error) {
        console.error('[StorageArea] Failed to save to localStorage:', error);
      }

      this._invalidateCache();

      // Manually emit changes
      const newData = await this._getCache();
      this._emitChanges(oldValues, newData);
    }

    return Promise.resolve();
  }

  /**
   * Clear all items from storage
   * @returns {Promise<void>}
   */
  async clear() {
    const oldData = await this._getCache();

    if (isElectron) {
      await window.electron.storage.clear();
    } else {
      localStorage.removeItem(`automa-${this.areaName}`);
    }

    this._invalidateCache();

    // Emit changes for all cleared items
    this._emitChanges(oldData, {});

    return Promise.resolve();
  }

  /**
   * Emit storage change events
   * @private
   */
  _emitChanges(oldValues, newValues) {
    const changes = {};
    const allKeys = new Set([
      ...Object.keys(oldValues || {}),
      ...Object.keys(newValues || {})
    ]);

    allKeys.forEach(key => {
      const oldValue = oldValues?.[key];
      const newValue = newValues?.[key];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes[key] = {
          oldValue,
          newValue
        };
      }
    });

    if (Object.keys(changes).length > 0) {
      this.changeListeners.forEach(callback => {
        try {
          callback(changes, this.areaName);
        } catch (error) {
          console.error('[StorageArea] Change listener error:', error);
        }
      });
    }
  }

  /**
   * Storage change event listeners
   */
  get onChanged() {
    return {
      addListener: (callback) => {
        if (typeof callback === 'function') {
          this.changeListeners.add(callback);

          // For Electron, also setup IPC listener
          if (isElectron && this.changeListeners.size === 1) {
            // Setup listener from main process
            const removeListener = window.electron.storage.onChanged((changes) => {
              this._emitChanges(
                Object.fromEntries(
                  Object.entries(changes).map(([k, v]) => [k, v.oldValue])
                ),
                Object.fromEntries(
                  Object.entries(changes).map(([k, v]) => [k, v.newValue])
                )
              );
            });

            // Store cleanup function
            this._ipcCleanup = removeListener;
          }
        }
      },

      removeListener: (callback) => {
        this.changeListeners.delete(callback);

        // Clean up IPC listener if no more listeners
        if (isElectron && this.changeListeners.size === 0 && this._ipcCleanup) {
          this._ipcCleanup();
          this._ipcCleanup = null;
        }
      },

      hasListener: (callback) => {
        return this.changeListeners.has(callback);
      }
    };
  }
}

/**
 * Browser API Polyfill
 */
const browser = {
  storage: {
    local: new StorageArea('local'),
    sync: new StorageArea('sync')
  },

  runtime: {
    sendMessage: (message) => {
      console.log('[BrowserPolyfill] sendMessage:', message);
      return Promise.resolve(null);
    },

    getURL: (path) => {
      if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
        return chrome.runtime.getURL(path);
      }
      return path;
    },

    getManifest: () => ({
      version: '1.0.0',
      name: 'Execuxion Desktop',
      manifest_version: 3
    }),

    onMessage: {
      addListener: () => {},
      removeListener: () => {},
      hasListener: () => false
    },

    onConnect: {
      addListener: () => {},
      removeListener: () => {},
      hasListener: () => false
    },

    id: isElectron ? 'electron-app' : 'web-app'
  },

  tabs: {
    query: () => Promise.resolve([
      { id: 1, windowId: 1, url: 'about:blank', active: true }
    ]),
    get: (tabId) => Promise.resolve({
      id: tabId,
      windowId: 1,
      url: 'about:blank'
    }),
    create: () => Promise.resolve({ id: Date.now(), windowId: 1 }),
    update: (tabId, updateProps) => Promise.resolve({ id: tabId, ...updateProps }),
    remove: () => Promise.resolve(),
    reload: () => Promise.resolve(),
    sendMessage: () => Promise.resolve(null),
    onRemoved: {
      addListener: () => {},
      removeListener: () => {},
      hasListener: () => false
    },
    onUpdated: {
      addListener: () => {},
      removeListener: () => {},
      hasListener: () => false
    },
    onCreated: {
      addListener: () => {},
      removeListener: () => {},
      hasListener: () => false
    }
  },

  action: {
    setBadgeText: () => Promise.resolve(),
    setBadgeBackgroundColor: () => Promise.resolve()
  },

  permissions: {
    request: () => Promise.resolve(true),
    contains: () => Promise.resolve(true),
    remove: () => Promise.resolve(true)
  },

  scripting: {
    executeScript: () => Promise.resolve([])
  },

  downloads: {
    download: (options) => {
      console.log('[BrowserPolyfill] download:', options);
      return Promise.resolve(Date.now());
    }
  },

  windows: {
    getCurrent: () => Promise.resolve({ type: 'normal', id: 1 }),
    create: () => Promise.resolve({ id: Date.now() }),
    update: (windowId, updateInfo) => Promise.resolve({ id: windowId, ...updateInfo }),
    remove: () => Promise.resolve()
  },

  notifications: {
    create: (id, options) => {
      console.log('[BrowserPolyfill] notification:', id, options);
      return Promise.resolve(id || `notif-${Date.now()}`);
    },
    clear: () => Promise.resolve(true),
    getAll: () => Promise.resolve({})
  },

  webRequest: {
    onBeforeSendHeaders: {
      addListener: () => {},
      removeListener: () => {},
      hasListener: () => false
    },
    onHeadersReceived: {
      addListener: () => {},
      removeListener: () => {},
      hasListener: () => false
    }
  },

  cookies: {
    get: () => Promise.resolve(null),
    getAll: () => Promise.resolve([]),
    set: () => Promise.resolve({}),
    remove: () => Promise.resolve({})
  },

  debugger: {
    attach: () => Promise.resolve(),
    detach: () => Promise.resolve(),
    sendCommand: () => Promise.resolve({}),
    onEvent: {
      addListener: () => {},
      removeListener: () => {},
      hasListener: () => false
    }
  },

  contextMenus: {
    create: () => 'menu-' + Date.now(),
    remove: () => Promise.resolve(),
    removeAll: () => Promise.resolve()
  },

  // Extension API - for browser extension compatibility
  extension: {
    isAllowedFileSchemeAccess: () => {
      // In Electron, we always have file system access
      if (isElectron) {
        return Promise.resolve(true);
      }
      // In web/browser extension mode, check if it exists
      if (typeof chrome !== 'undefined' && chrome.extension?.isAllowedFileSchemeAccess) {
        return new Promise((resolve) => {
          chrome.extension.isAllowedFileSchemeAccess(resolve);
        });
      }
      // Default to false for web environments
      return Promise.resolve(false);
    },
    isAllowedIncognitoAccess: () => {
      // In Electron, incognito mode is not applicable (desktop app)
      if (isElectron) {
        return Promise.resolve(true);
      }
      // In web/browser extension mode, check if it exists
      if (typeof chrome !== 'undefined' && chrome.extension?.isAllowedIncognitoAccess) {
        return new Promise((resolve) => {
          chrome.extension.isAllowedIncognitoAccess(resolve);
        });
      }
      // Default to false for web environments
      return Promise.resolve(false);
    },
    getURL: (path) => {
      if (typeof chrome !== 'undefined' && chrome.extension?.getURL) {
        return chrome.extension.getURL(path);
      }
      return path;
    },
    getBackgroundPage: () => {
      return Promise.resolve(null);
    },
    getViews: () => {
      return [];
    },
    inIncognitoContext: false
  }
};

// Log initialization
if (isElectron) {
  console.log('[BrowserPolyfill] Initialized in Electron environment');
} else {
  console.log('[BrowserPolyfill] Initialized with localStorage fallback');
}

export default browser;
