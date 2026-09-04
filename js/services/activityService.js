/**
 * Activity Tracker — Activity Service Layer
 * Encapsulates business logic, data validation, and asynchronous REST-like API contracts.
 */

import { storage } from './storage.js';
import { calculateDurationSeconds, getTodayDateString } from '../utils/dateUtils.js';

class ActivityService {
  /**
   * Generates a unique, prefixed activity identifier.
   * @private
   * @returns {string} e.g. "act_1725450000123_a9b2c"
   */
  _generateId() {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    return `act_${timestamp}_${randomSuffix}`;
  }

  /**
   * Fetches all activities with optional filters.
   * @param {Object} [filter={}] 
   * @param {string} [filter.date] Format 'YYYY-MM-DD'
   * @param {string} [filter.categoryId]
   * @param {string} [filter.search]
   * @returns {Promise<Array<Object>>}
   */
  async getActivities(filter = {}) {
    return new Promise((resolve) => {
      let activities = storage.getActivities();

      // Filter by exact date
      if (filter.date) {
        activities = activities.filter((act) => act.date === filter.date);
      }

      // Filter by category
      if (filter.categoryId && filter.categoryId !== 'all') {
        activities = activities.filter((act) => act.categoryId === filter.categoryId);
      }

      // Filter by search query (title or notes)
      if (filter.search && filter.search.trim()) {
        const query = filter.search.toLowerCase().trim();
        activities = activities.filter(
          (act) =>
            act.title.toLowerCase().includes(query) ||
            (act.notes && act.notes.toLowerCase().includes(query))
        );
      }

      // Sort chronological descending (newest first)
      activities.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

      resolve(activities);
    });
  }

  /**
   * Fetches an activity by its unique ID.
   * @param {string} id 
   * @returns {Promise<Object | null>}
   */
  async getActivityById(id) {
    return new Promise((resolve) => {
      const activities = storage.getActivities();
      const activity = activities.find((act) => act.id === id) || null;
      resolve(activity);
    });
  }

  /**
   * Creates and persists a new activity with business rule validation.
   * @param {Object} activityData 
   * @returns {Promise<Object>} Created activity
   */
  async createActivity(activityData) {
    return new Promise((resolve, reject) => {
      // 1. Validation: Title
      const title = activityData.title ? activityData.title.trim() : '';
      if (!title) {
        return reject(new Error('Nama aktivitas wajib diisi.'));
      }

      // 2. Validation: Category
      const categoryId = activityData.categoryId || 'cat_personal';

      // 3. Validation: Timestamps & BR001
      const startTime = activityData.startTime;
      const endTime = activityData.endTime;
      if (!startTime || !endTime) {
        return reject(new Error('Waktu mulai dan selesai wajib diisi.'));
      }

      const durationSeconds = calculateDurationSeconds(startTime, endTime);
      if (durationSeconds < 0) {
        return reject(new Error('Waktu selesai tidak boleh lebih awal dari waktu mulai (BR001).'));
      }
      if (durationSeconds === 0) {
        return reject(new Error('Durasi aktivitas minimal 1 detik.'));
      }

      // 4. Derive date
      const date = activityData.date || getTodayDateString(new Date(startTime));

      // 5. Build entity
      const nowIso = new Date().toISOString();
      const newActivity = {
        id: this._generateId(),
        title,
        categoryId,
        date,
        startTime,
        endTime,
        durationSeconds,
        notes: activityData.notes ? activityData.notes.trim() : '',
        createdAt: nowIso,
        updatedAt: nowIso
      };

      // 6. Persist to storage
      const activities = storage.getActivities();
      activities.unshift(newActivity);
      storage.saveActivities(activities);

      resolve(newActivity);
    });
  }

  /**
   * Updates an existing activity.
   * @param {string} id 
   * @param {Object} updates 
   * @returns {Promise<Object>} Updated activity
   */
  async updateActivity(id, updates) {
    return new Promise((resolve, reject) => {
      const activities = storage.getActivities();
      const index = activities.findIndex((act) => act.id === id);
      if (index === -1) {
        return reject(new Error(`Aktivitas dengan ID "${id}" tidak ditemukan.`));
      }

      const current = activities[index];

      // Validate title if provided
      if (updates.title !== undefined) {
        const title = updates.title.trim();
        if (!title) {
          return reject(new Error('Nama aktivitas tidak boleh kosong.'));
        }
        current.title = title;
      }

      if (updates.categoryId) {
        current.categoryId = updates.categoryId;
      }

      if (updates.notes !== undefined) {
        current.notes = updates.notes.trim();
      }

      // If time changed, re-validate duration
      const startTime = updates.startTime || current.startTime;
      const endTime = updates.endTime || current.endTime;
      if (updates.startTime || updates.endTime) {
        const duration = calculateDurationSeconds(startTime, endTime);
        if (duration <= 0) {
          return reject(new Error('Waktu selesai harus lebih besar dari waktu mulai.'));
        }
        current.startTime = startTime;
        current.endTime = endTime;
        current.durationSeconds = duration;
      }

      if (updates.date) {
        current.date = updates.date;
      }

      current.updatedAt = new Date().toISOString();
      activities[index] = current;
      storage.saveActivities(activities);

      resolve(current);
    });
  }

  /**
   * Deletes an activity by ID.
   * @param {string} id 
   * @returns {Promise<Object>} Deleted activity
   */
  async deleteActivity(id) {
    return new Promise((resolve, reject) => {
      const activities = storage.getActivities();
      const index = activities.findIndex((act) => act.id === id);
      if (index === -1) {
        return reject(new Error(`Aktivitas dengan ID "${id}" tidak ditemukan.`));
      }

      const [deleted] = activities.splice(index, 1);
      storage.saveActivities(activities);
      resolve(deleted);
    });
  }

  /**
   * Retrieves all available categories.
   * @returns {Promise<Array<Object>>}
   */
  async getCategories() {
    return new Promise((resolve) => {
      resolve(storage.getCategories());
    });
  }

  /**
   * Computes daily summary metrics for a given date.
   * @param {string} [dateString=getTodayDateString()]
   * @returns {Promise<Object>}
   */
  async getDailySummary(dateString = getTodayDateString()) {
    return new Promise((resolve) => {
      const activities = storage.getActivities().filter((act) => act.date === dateString);
      const categories = storage.getCategories();

      const totalActivities = activities.length;
      let totalDurationSeconds = 0;

      // Group by category
      const categoryMap = {};
      categories.forEach((cat) => {
        categoryMap[cat.id] = {
          categoryId: cat.id,
          name: cat.name,
          color: cat.color,
          bgColor: cat.bgColor,
          icon: cat.icon,
          totalSeconds: 0,
          count: 0
        };
      });

      activities.forEach((act) => {
        totalDurationSeconds += act.durationSeconds;
        if (categoryMap[act.categoryId]) {
          categoryMap[act.categoryId].totalSeconds += act.durationSeconds;
          categoryMap[act.categoryId].count += 1;
        }
      });

      // Find dominant category
      let dominantCategory = null;
      let maxSeconds = 0;
      Object.values(categoryMap).forEach((item) => {
        if (item.totalSeconds > maxSeconds) {
          maxSeconds = item.totalSeconds;
          dominantCategory = item;
        }
      });

      resolve({
        date: dateString,
        totalActivities,
        totalDurationSeconds,
        dominantCategory,
        byCategory: categoryMap
      });
    });
  }
}

// Export singleton instance
export const activityService = new ActivityService();
