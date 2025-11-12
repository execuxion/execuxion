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

import { logger } from './logger';

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
    this._heartbeatInterval = null;
    this._lastMainProcessTimestamp = Date.now();

    // Setup cache coherency mechanisms for Electron
    if (isElectron) {
      this._setupCacheCoherency();
    }
  }

  /**
   * Setup cache coherency mechanisms to detect main process restarts
   * Uses two approaches:
   * 1. Main process ready event (for explicit restarts)
   * 2. Heartbeat checks (for detecting unresponsive main process)
   * @private
   */
  _setupCacheCoherency() {
    // Approach 1: Listen for main process ready events
    if (window.electron?.storage?.onMainProcessReady) {
      logger.debug('[StorageArea]', 'Setting up main process ready listener for cache coherency');

      window.electron.storage.onMainProcessReady((data) => {
        logger.debug('[StorageArea]', 'Main process ready event received', data);

        // If timestamp is newer than last known, main process restarted
        if (data.timestamp > this._lastMainProcessTimestamp) {
          logger.warn('[StorageArea]', 'Main process restarted - invalidating cache for data consistency');
          this._invalidateCache();
          this._lastMainProcessTimestamp = data.timestamp;
        }
      });
    }

    // Approach 2: Heartbeat to detect main process crashes
    // Check every 5 seconds if main process is still responsive
    this._heartbeatInterval = setInterval(() => {
      this._checkMainProcessHealth();
    }, 5000);

    logger.debug('[StorageArea]', 'Cache coherency mechanisms initialized');
  }

  /**
   * Check if main process is still responding
   * If not responsive, invalidate cache to prevent stale data
   * @private
   */
  async _checkMainProcessHealth() {
    if (!isElectron || !window.electron?.storage) {
      return;
    }

    try {
      // Simple ping by reading a lightweight key
      // If main process is unresponsive, this will timeout or throw
      const startTime = Date.now();
      await window.electron.storage.get('__healthcheck__');
      const duration = Date.now() - startTime;

      // If response took too long (>2 seconds), main process may have restarted
      if (duration > 2000) {
        logger.warn('[StorageArea]', 'Main process response slow - invalidating cache');
        this._invalidateCache();
      }
    } catch (error) {
      logger.error('[StorageArea]', 'Main process health check failed - invalidating cache', error);
      this._invalidateCache();
    }
  }

  /**
   * Clean up resources (intervals, listeners)
   * Called when StorageArea is no longer needed
   * @public
   */
  destroy() {
    if (this._heartbeatInterval) {
      clearInterval(this._heartbeatInterval);
      this._heartbeatInterval = null;
      logger.debug('[StorageArea]', 'Heartbeat interval cleared');
    }

    // Clear listeners
    this.changeListeners.clear();
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
          logger.error('[StorageArea] Failed to load cache', error);
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
      logger.error('[StorageArea] Failed to parse localStorage', error);
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
   * Invalidate cache (private internal use)
   * @private
   */
  _invalidateCache() {
    this._cache = null;
    this._cachePromise = null;
  }

  /**
   * Invalidate cache (public API for app startup)
   * Forces next read to fetch fresh data from disk
   * @public
   */
  invalidateCache() {
    logger.debug('[StorageArea]', 'Cache invalidated - next read will fetch from disk');
    this._invalidateCache();
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
   *
   * CRITICAL FIX: Cache updates ONLY AFTER confirmed write to prevent cache poisoning
   */
  async set(items) {
    if (!items || typeof items !== 'object' || Array.isArray(items)) {
      return Promise.resolve();
    }

    const oldData = await this._getCache();
    const oldValues = { ...oldData };

    if (isElectron) {
      // CRITICAL: Wait for IPC confirmation BEFORE updating cache
      try {
        const startTime = Date.now();
        const success = await window.electron.storage.set(items);
        const duration = Date.now() - startTime;

        if (!success) {
          logger.error('[StorageArea] Write failed, cache NOT updated', new Error('Storage write returned false'));
          throw new Error('Storage write returned false');
        }

        // ONLY update cache AFTER successful write confirmation
        this._updateCache(items);
        logger.storage('write', Object.keys(items).join(', '), `confirmed in ${duration}ms`);

        // Changes are emitted via IPC from main process
        // No need to manually emit here

      } catch (error) {
        logger.error('[StorageArea] Write failed, cache NOT updated', error);
        // CRITICAL: Do NOT update cache on error
        throw error; // Propagate error to caller
      }
    } else {
      // Fallback to localStorage
      try {
        Object.assign(oldData, items);

        // Validate JSON serializability before writing
        const serialized = JSON.stringify(oldData);

        // Check localStorage quota
        try {
          localStorage.setItem(`automa-${this.areaName}`, serialized);
        } catch (quotaError) {
          if (quotaError.name === 'QuotaExceededError') {
            logger.error('[StorageArea] localStorage quota exceeded', quotaError);
            throw new Error('Storage quota exceeded. Please free up space.');
          }
          throw quotaError;
        }

        // Only update cache after successful write
        this._updateCache(items);
        logger.storage('write', Object.keys(items).join(', '), 'localStorage confirmed');

        // Manually emit changes for localStorage
        this._emitChanges(oldValues, oldData);

      } catch (error) {
        logger.error('[StorageArea] localStorage write failed, cache NOT updated', error);
        throw error;
      }
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
        logger.error('[StorageArea] Failed to save to localStorage', error);
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
          logger.error('[StorageArea] Change listener error', error);
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
              // CRITICAL: Update cache BEFORE emitting changes for cache coherency
              // This ensures components reading storage get fresh data immediately
              if (this._cache) {
                Object.entries(changes).forEach(([key, { newValue }]) => {
                  if (newValue === undefined) {
                    // Key was deleted
                    delete this._cache[key];
                  } else {
                    // Key was added or updated
                    this._cache[key] = newValue;
                  }
                });
                logger.debug('[StorageArea]', 'Cache updated from main process changes', Object.keys(changes));
              }

              // Then emit changes to registered listeners
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
    sync: new StorageArea('sync'),

    /**
     * Session storage API
     * Used by: src/workflowEngine/blocksHandler-removed/handlerHandleDownload.js:13,27
     *
     * Browser extension session storage is temporary and cleared when the browser closes.
     * In Electron, we map this to local storage since there's no concept of browser sessions.
     * Data persists across app restarts but uses the same interface as browser.storage.local.
     */
    session: new StorageArea('session')
  },

  runtime: {
    sendMessage: (message) => {
      // Stub: No cross-extension messaging in Electron
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

    /**
     * Execute script in tab (Manifest V2 API)
     * Used by: src/workflowEngine/injectContentScript.js:34
     *
     * In browser extensions, this injects content scripts into web pages.
     * In Electron, content scripts don't work the same way (no isolated world context).
     *
     * Stub implementation returns empty array to prevent crashes when workflow
     * engine tries to inject scripts. For Electron, use browser.scripting.executeScript instead.
     *
     * @param {number} tabId - Tab ID to inject into
     * @param {Object} details - Script details (file, code, allFrames, etc.)
     * @returns {Promise<Array>} Empty array (no execution result)
     */
    executeScript: (tabId, details) => {
      // Stub implementation: Electron doesn't support browser-style content script injection
      // Return empty array to indicate no script execution
      return Promise.resolve([]);
    },

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
      // Stub: Return fake download ID
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
      // Stub: Return notification ID without showing system notification
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
  },

  // Web Navigation API - for workflow engine frame tracking
  webNavigation: {
    /**
     * Get all frames in a tab
     * Used by: src/workflowEngine/helper.js:71
     *
     * Electron doesn't have multi-frame tab architecture like browsers,
     * so we return a fake single-frame structure to prevent crashes.
     *
     * The workflow engine expects: frames.reduce((acc, { frameId, url }) => ...)
     * where url === 'about:blank' is handled specially (line 75 of helper.js)
     *
     * @param {Object} params - { tabId: number }
     * @returns {Promise<Array<{frameId: number, parentFrameId: number, url: string}>>}
     */
    getAllFrames: ({ tabId }) => {
      // Return single main frame structure that workflow engine expects
      // This prevents crashes and allows workflows to run in Electron context
      return Promise.resolve([
        {
          frameId: 0,           // Main frame always has ID 0
          parentFrameId: -1,    // -1 indicates no parent (top-level frame)
          url: 'about:blank',   // Default URL (actual URL not tracked in Electron)
          errorOccurred: false
        }
      ]);
    },

    /**
     * Event fired when navigation error occurs
     * Used by: src/workflowEngine/helper.js:128,143
     *
     * Stub implementation - Electron doesn't provide navigation error events
     * in the same way browsers do. Returns empty listener interface to prevent crashes.
     */
    onErrorOccurred: {
      addListener: (callback) => {
        // Stub: Electron doesn't track navigation errors like browsers
        // Callback stored but never fired
      },
      removeListener: (callback) => {
        // Stub: No-op for Electron
      },
      hasListener: (callback) => false
    },

    /**
     * Event fired when navigation creates a new target (e.g., popup, new tab)
     * Used by: src/workflowEngine/blocksHandler-removed/handlerBrowserEvent.js:95,99
     *
     * Stub implementation - Electron doesn't track navigation targets like browsers
     */
    onCreatedNavigationTarget: {
      addListener: (callback) => {
        // Stub: Electron doesn't track navigation targets
      },
      removeListener: (callback) => {
        // Stub: No-op for Electron
      },
      hasListener: (callback) => false
    }
  }
};

// Log initialization
if (isElectron) {
  logger.info('[BrowserPolyfill] Initialized in Electron environment');
} else {
  logger.info('[BrowserPolyfill] Initialized with localStorage fallback');
}

export default browser;
