// Browser API Service for desktop app
import browser from '@/utils/browser-polyfill';

export default class BrowserAPIService {
  static storage = browser.storage;
  static runtime = browser.runtime;
  static tabs = browser.tabs;
  static windows = browser.windows;
  static permissions = browser.permissions;
  static notifications = browser.notifications;
  static downloads = browser.downloads;
  static scripting = browser.scripting;
  static cookies = browser.cookies;
  static debugger = browser.debugger;
  static webRequest = browser.webRequest;
  static extension = browser.extension; // Add extension API

  static async executeScript() { return null; }
  static async sendMessage() { return null; }
  static async getActiveTab() {
    const tabs = await browser.tabs.query({ active: true });
    return tabs[0] || { id: 1, url: 'about:blank' };
  }
} 
