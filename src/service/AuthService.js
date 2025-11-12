// Authentication Service for Electron Desktop App
// Manages user authentication using API keys from Execuxion API

import browser from '@/utils/browser-polyfill';

class AuthService {
  constructor() {
    this.API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.execuxion.com';
    this.AUTH_STORAGE_KEY = 'execuxion_auth';
    this.user = null;
    this.apiKey = null;
    this.isAuthenticated = false;
  }

  /**
   * Initialize auth service - check for stored credentials
   */
  async init() {
    try {
      const stored = await browser.storage.local.get(this.AUTH_STORAGE_KEY);

      // Handle case where storage returns undefined or null
      if (!stored || typeof stored !== 'object') {
        console.warn('⚠️ Storage returned invalid data:', stored);
        this.isAuthenticated = false;
        return false;
      }

      if (stored[this.AUTH_STORAGE_KEY]) {
        const authData = stored[this.AUTH_STORAGE_KEY];
        this.apiKey = authData.apiKey;

        // Verify the API key is still valid
        const isValid = await this.verifyApiKey(this.apiKey);
        if (isValid) {
          this.user = authData.user;
          this.isAuthenticated = true;
          // Security: Don't log client identifiers in production
          // console.log('✅ Auth restored from storage:', this.user?.clientId);
          return true;
        } else {
          // Invalid key - clear storage
          await this.logout();
          return false;
        }
      }

      this.isAuthenticated = false;
      return false;
    } catch (error) {
      console.error('❌ Auth init error:', error);
      this.isAuthenticated = false;
      return false;
    }
  }

  /**
   * Login with API key
   * @param {string} apiKey - Execuxion API key (format: ex_uuid_suffix)
   */
  async login(apiKey) {
    try {
      if (!apiKey || !apiKey.startsWith('ex_')) {
        throw new Error('Invalid API key format. Key must start with ex_');
      }

      // Verify API key by calling client.get_info endpoint
      const response = await fetch(`${this.API_BASE_URL}/twitter/v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          op: 'client.get_info',
          args: {}
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Invalid API key');
      }

      const data = await response.json();

      if (!data.ok || !data.data) {
        throw new Error('Failed to fetch user information');
      }

      // Store auth data
      this.apiKey = apiKey;
      this.user = data.data;
      this.isAuthenticated = true;

      // Persist to storage
      await browser.storage.local.set({
        [this.AUTH_STORAGE_KEY]: {
          apiKey,
          user: this.user,
          timestamp: Date.now()
        }
      });

      // Security: Don't log client identifiers in production
      // console.log('✅ Login successful:', this.user.clientId);
      return {
        success: true,
        user: this.user
      };
    } catch (error) {
      console.error('❌ Login error:', error);
      this.apiKey = null;
      this.user = null;
      this.isAuthenticated = false;

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify if an API key is valid
   * @param {string} apiKey
   */
  async verifyApiKey(apiKey) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/twitter/v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          op: 'client.get_info',
          args: {}
        })
      });

      return response.ok;
    } catch (error) {
      console.error('❌ API key verification error:', error);
      return false;
    }
  }

  /**
   * Logout - clear all auth data
   */
  async logout() {
    this.apiKey = null;
    this.user = null;
    this.isAuthenticated = false;

    await browser.storage.local.remove(this.AUTH_STORAGE_KEY);
    console.log('✅ Logged out successfully');
  }

  /**
   * Get current user info
   */
  getUser() {
    return this.user;
  }

  /**
   * Get API key for authenticated requests
   */
  getApiKey() {
    return this.apiKey;
  }

  /**
   * Check if user is authenticated
   */
  isLoggedIn() {
    return this.isAuthenticated && !!this.apiKey;
  }

  /**
   * Refresh user data from API
   */
  async refreshUserData() {
    if (!this.apiKey) {
      return false;
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/twitter/v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          op: 'client.get_info',
          args: {}
        })
      });

      if (!response.ok) {
        throw new Error('Failed to refresh user data');
      }

      const data = await response.json();
      if (data.ok && data.data) {
        this.user = data.data;

        // Update storage
        await browser.storage.local.set({
          [this.AUTH_STORAGE_KEY]: {
            apiKey: this.apiKey,
            user: this.user,
            timestamp: Date.now()
          }
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Refresh user data error:', error);
      return false;
    }
  }

  /**
   * Make authenticated API request
   * @param {string} op - Operation name
   * @param {object} args - Operation arguments
   */
  async makeApiRequest(op, args = {}) {
    if (!this.isLoggedIn()) {
      throw new Error('Not authenticated. Please login first.');
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/twitter/v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          op,
          args
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error(`❌ API request error (${op}):`, error);
      throw error;
    }
  }
}

// Export singleton instance
export default new AuthService();
