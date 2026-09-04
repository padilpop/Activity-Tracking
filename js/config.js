/**
 * Activity Tracker — Configuration & Constants
 * Contains default categories, storage namespace keys, and app constants.
 */

export const APP_SCHEMA_VERSION = 1;

export const STORAGE_KEYS = {
  ACTIVITIES: 'activity_tracker_activities',
  CATEGORIES: 'activity_tracker_categories',
  SETTINGS: 'activity_tracker_settings',
  THEME: 'activity_tracker_theme'
};

/**
 * 5 Pre-defined categories per Schema.md and Design.md
 */
export const DEFAULT_CATEGORIES = [
  {
    id: 'cat_work',
    name: 'Work',
    color: '#6366F1',
    bgColor: 'rgba(99, 102, 241, 0.15)',
    icon: 'briefcase',
    isDefault: true,
    createdAt: '2026-09-04T00:00:00.000Z'
  },
  {
    id: 'cat_study',
    name: 'Study',
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.15)',
    icon: 'book-open',
    isDefault: true,
    createdAt: '2026-09-04T00:00:00.000Z'
  },
  {
    id: 'cat_fitness',
    name: 'Fitness',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    icon: 'activity',
    isDefault: true,
    createdAt: '2026-09-04T00:00:00.000Z'
  },
  {
    id: 'cat_habit',
    name: 'Habit',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    icon: 'check-circle',
    isDefault: true,
    createdAt: '2026-09-04T00:00:00.000Z'
  },
  {
    id: 'cat_personal',
    name: 'Personal',
    color: '#F43F5E',
    bgColor: 'rgba(244, 63, 94, 0.15)',
    icon: 'user',
    isDefault: true,
    createdAt: '2026-09-04T00:00:00.000Z'
  }
];

export const DEFAULT_SETTINGS = {
  theme: 'dark',
  activeTimer: null,
  schemaVersion: APP_SCHEMA_VERSION
};
