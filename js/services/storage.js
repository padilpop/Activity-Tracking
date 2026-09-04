/**
 * Activity Tracker — Storage Adapter
 * Encapsulates LocalStorage operations with error handling, schema versioning, and auto-seeding.
 */

import { STORAGE_KEYS, DEFAULT_CATEGORIES, DEFAULT_SETTINGS, APP_SCHEMA_VERSION } from '../config.js';

class StorageAdapter {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initializes the storage with default categories and schema versioning.
   */
  init() {
    if (this.initialized) return;

    try {
      // 1. Seed Categories if empty
      const existingCategories = this.getItem(STORAGE_KEYS.CATEGORIES);
      if (!existingCategories || !Array.isArray(existingCategories) || existingCategories.length === 0) {
        this.setItem(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
      }

      // 2. Initialize Activities array if not present
      const existingActivities = this.getItem(STORAGE_KEYS.ACTIVITIES);
      if (!existingActivities || !Array.isArray(existingActivities)) {
        this.setItem(STORAGE_KEYS.ACTIVITIES, []);
      }

      // 3. Initialize Settings & verify schema version
      const existingSettings = this.getItem(STORAGE_KEYS.SETTINGS);
      if (!existingSettings) {
        this.setItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
      } else if (existingSettings.schemaVersion < APP_SCHEMA_VERSION) {
        this.migrateSchema(existingSettings.schemaVersion, APP_SCHEMA_VERSION);
      }

      this.initialized = true;
    } catch (error) {
      console.error('[StorageAdapter] Failed to initialize storage:', error);
    }
  }

  /**
   * Migrates storage from an older schema version to the target version.
   * @param {number} fromVersion 
   * @param {number} toVersion 
   */
  migrateSchema(fromVersion, toVersion) {
    console.info(`[StorageAdapter] Migrating schema from v${fromVersion} to v${toVersion}`);
    const settings = this.getSettings();
    settings.schemaVersion = toVersion;
    this.saveSettings(settings);
  }

  /**
   * Safe getter with JSON deserialization.
   * @param {string} key 
   * @returns {any | null}
   */
  getItem(key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch (error) {
      console.error(`[StorageAdapter] Error reading key "${key}":`, error);
      return null;
    }
  }

  /**
   * Safe setter with JSON serialization and quota detection.
   * @param {string} key 
   * @param {any} value 
   * @returns {boolean} success
   */
  setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError' || error.code === 22) {
        console.error('[StorageAdapter] LocalStorage quota exceeded!');
      } else {
        console.error(`[StorageAdapter] Error writing key "${key}":`, error);
      }
      return false;
    }
  }

  // --- Activities CRUD Low-Level Operations ---

  /**
   * Retrieves all activities array.
   * @returns {Array<Object>}
   */
  getActivities() {
    this.init();
    return this.getItem(STORAGE_KEYS.ACTIVITIES) || [];
  }

  /**
   * Saves all activities array.
   * @param {Array<Object>} activities 
   * @returns {boolean}
   */
  saveActivities(activities) {
    this.init();
    return this.setItem(STORAGE_KEYS.ACTIVITIES, activities);
  }

  // --- Categories Low-Level Operations ---

  /**
   * Retrieves all categories array.
   * @returns {Array<Object>}
   */
  getCategories() {
    this.init();
    return this.getItem(STORAGE_KEYS.CATEGORIES) || DEFAULT_CATEGORIES;
  }

  /**
   * Saves categories array.
   * @param {Array<Object>} categories 
   * @returns {boolean}
   */
  saveCategories(categories) {
    this.init();
    return this.setItem(STORAGE_KEYS.CATEGORIES, categories);
  }

  // --- Settings & Preferences ---

  /**
   * Retrieves user settings object.
   * @returns {Object}
   */
  getSettings() {
    this.init();
    return this.getItem(STORAGE_KEYS.SETTINGS) || DEFAULT_SETTINGS;
  }

  /**
   * Saves user settings object.
   * @param {Object} settings 
   * @returns {boolean}
   */
  saveSettings(settings) {
    this.init();
    return this.setItem(STORAGE_KEYS.SETTINGS, settings);
  }

  /**
   * Updates partial settings.
   * @param {Object} partial 
   * @returns {Object} updated settings
   */
  updateSettings(partial) {
    const current = this.getSettings();
    const updated = { ...current, ...partial };
    this.saveSettings(updated);
    return updated;
  }

  // --- Backup & Restore Utilities ---

  /**
   * Exports full application data as a JSON string.
   * @returns {string}
   */
  exportBackup() {
    const data = {
      version: APP_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      categories: this.getCategories(),
      activities: this.getActivities(),
      settings: this.getSettings()
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Imports application data from a JSON string.
   * @param {string} jsonString 
   * @returns {boolean}
   */
  importBackup(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.categories)) {
        this.saveCategories(data.categories);
      }
      if (Array.isArray(data.activities)) {
        this.saveActivities(data.activities);
      }
      if (data.settings && typeof data.settings === 'object') {
        this.saveSettings(data.settings);
      }
      return true;
    } catch (error) {
      console.error('[StorageAdapter] Failed to import backup:', error);
      return false;
    }
  }
}

// Export singleton instance
export const storage = new StorageAdapter();
