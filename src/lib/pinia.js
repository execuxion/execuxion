import { markRaw } from 'vue';
import { createPinia } from 'pinia';
import browser from '@/utils/browser-polyfill';

/**
 * Pinia Storage Plugin
 *
 * Provides saveToStorage() method for Pinia stores that integrates with
 * browser.storage.local API (which in turn uses Electron storage or localStorage).
 *
 * This allows existing store code to work seamlessly in both browser and Electron.
 */
function saveToStoragePlugin({ store, options }) {
  /**
   * Save store state to persistent storage
   * @param {string} key - The store state key to save
   * @returns {Promise<void>}
   */
  store.saveToStorage = async (key) => {
    // Check if store has storageMap configuration
    if (!options.storageMap || !options.storageMap[key]) {
      console.warn(`[Pinia] No storageMap defined for key "${key}" in store "${store.$id}"`);
      return Promise.resolve();
    }

    // Don't save if store hasn't been retrieved yet
    if (!store.retrieved) {
      console.warn(`[Pinia] Store "${store.$id}" not yet retrieved, skipping save for key "${key}"`);
      return Promise.resolve();
    }

    const storageKey = options.storageMap[key];

    try {
      // Deep clone to avoid reference issues
      const value = JSON.parse(JSON.stringify(store[key]));

      // Save to browser.storage.local (which uses Electron or localStorage)
      await browser.storage.local.set({
        [storageKey]: value
      });

      console.log(`[Pinia] Saved ${store.$id}.${key} to storage as "${storageKey}"`);
    } catch (error) {
      console.error(`[Pinia] Failed to save ${store.$id}.${key}:`, error);
      throw error;
    }

    return Promise.resolve();
  };

  /**
   * Load store state from persistent storage
   * @param {string} key - The store state key to load
   * @returns {Promise<any>}
   */
  store.loadFromStorage = async (key) => {
    if (!options.storageMap || !options.storageMap[key]) {
      console.warn(`[Pinia] No storageMap defined for key "${key}" in store "${store.$id}"`);
      return null;
    }

    const storageKey = options.storageMap[key];

    try {
      const result = await browser.storage.local.get(storageKey);
      const value = result[storageKey];

      if (value !== undefined) {
        console.log(`[Pinia] Loaded ${store.$id}.${key} from storage "${storageKey}"`);
        return value;
      }

      return null;
    } catch (error) {
      console.error(`[Pinia] Failed to load ${store.$id}.${key}:`, error);
      return null;
    }
  };
}

const pinia = createPinia();
pinia.use(saveToStoragePlugin);

export default pinia;
