/**
 * Activity Tracker — Main Application Entry Point
 * Handles application lifecycle, theme toggle, and component initialization.
 */

import { storage } from './services/storage.js';
import { activityService } from './services/activityService.js';
import { TimerComponent } from './components/timer.js';
import { ModalComponent } from './components/modal.js';
import { ActivityListComponent } from './components/activityList.js';
import { STORAGE_KEYS } from './config.js';

/**
 * Initialize theme based on user's saved preference or system default.
 */
function initTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
  const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'dark'); // Default to dark per Design.md

  applyTheme(initialTheme);

  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }
}

/**
 * Apply the selected theme to the document root and meta tags.
 * @param {'dark' | 'light'} theme 
 */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  
  // Update browser mobile header color
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme === 'dark' ? '#0b0f19' : '#f8fafc');
  }

  // Persist preference
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
}

/**
 * Toggle between dark and light themes.
 */
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
}

/**
 * Update the header with the current formatted date in Indonesian.
 */
function initDateDisplay() {
  const dateElement = document.getElementById('currentDate');
  if (!dateElement) return;

  const now = new Date();
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  
  try {
    const formattedDate = new Intl.DateTimeFormat('id-ID', options).format(now);
    dateElement.textContent = formattedDate;
  } catch (e) {
    // Fallback if locale is not supported
    dateElement.textContent = now.toDateString();
  }
}

/**
 * Connects header manual log button to the modal component.
 * @param {ModalComponent} modal 
 */
function initHeaderActions(modal) {
  const manualBtn = document.getElementById('openManualModalBtn');
  if (manualBtn && modal) {
    manualBtn.addEventListener('click', () => {
      modal.openCreate();
    });
  }
}

/**
 * Bootstraps the entire application.
 */
async function bootstrap() {
  console.log('%c🚀 Activity Tracker Initializing (TASK005: Activity Feed & Undo Ready)', 'color: #6366f1; font-weight: bold; font-size: 14px;');
  
  // 1. Initialize persistent storage & default categories
  storage.init();

  // 2. Initialize UI theme & date
  initTheme();
  initDateDisplay();

  // 3. Initialize Hero Live Timer Component
  const timer = new TimerComponent('timerSection');
  await timer.init();

  // 4. Initialize Manual Log & Edit Modal Component
  const modal = new ModalComponent('modalContainer');
  await modal.init();
  initHeaderActions(modal);

  // 5. Initialize Activity Timeline Feed Component
  const activityList = new ActivityListComponent('feedSection');
  await activityList.init(modal);

  // Expose services globally for debugging & testing
  window.activityTracker = {
    storage,
    activityService,
    timer,
    modal,
    activityList
  };
}

// Execute when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}

export { applyTheme, toggleTheme, storage, activityService };
