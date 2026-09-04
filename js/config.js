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

/**
 * Returns SVG markup for a given category icon name.
 * @param {string} iconName 
 * @param {number} [size=18] 
 * @returns {string} SVG HTML string
 */
export function getCategoryIconSvg(iconName, size = 18) {
  switch (iconName) {
    case 'briefcase':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`;
    case 'book-open':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`;
    case 'activity':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>`;
    case 'check-circle':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    case 'user':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
    default:
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
  }
}

