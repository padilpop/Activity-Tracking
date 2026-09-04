/**
 * Activity Tracker — Activity Timeline Feed Component
 * Handles rendering the chronological activity list, category filtering, search, and inline undo delete.
 */

import { activityService } from '../services/activityService.js';
import {
  getTodayDateString,
  formatTime24h,
  formatDurationHuman
} from '../utils/dateUtils.js';

export class ActivityListComponent {
  constructor(containerId = 'feedSection') {
    this.container = document.getElementById(containerId);
    this.modal = null;
    this.currentDate = getTodayDateString();
    this.activeCategory = 'all';
    this.searchQuery = '';
    this.categories = [];
    this.activities = [];
    this.pendingDeletes = new Map(); // id -> { timeoutId, activity }
  }

  /**
   * Initializes the activity list component.
   * @param {Object} modal ModalComponent instance for edit action
   */
  async init(modal = null) {
    if (!this.container) return;
    this.modal = modal;
    this.categories = await activityService.getCategories();

    await this.loadData();
    this.render();
    this.bindEvents();

    // Listen for global data updates (from live timer or modal)
    document.addEventListener('activity-updated', async () => {
      await this.loadData();
      this.render();
    });
  }

  /**
   * Loads activities from service for the active date.
   */
  async loadData() {
    this.activities = await activityService.getActivities({ date: this.currentDate });
  }

  /**
   * Renders the complete feed component.
   */
  render() {
    // 1. Calculate count per category for filter pills
    const categoryCounts = { all: this.activities.length };
    this.categories.forEach((cat) => {
      categoryCounts[cat.id] = this.activities.filter((act) => act.categoryId === cat.id).length;
    });

    // 2. Filter activities based on active category & search query
    let filtered = [...this.activities];
    if (this.activeCategory !== 'all') {
      filtered = filtered.filter((act) => act.categoryId === this.activeCategory);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (act) =>
          act.title.toLowerCase().includes(q) ||
          (act.notes && act.notes.toLowerCase().includes(q))
      );
    }

    // 3. Category Map for quick metadata lookup
    const catMap = {};
    this.categories.forEach((cat) => {
      catMap[cat.id] = cat;
    });

    // 4. Build Filter Pills HTML
    const pillsHtml = `
      <button class="filter-pill ${this.activeCategory === 'all' ? 'active' : ''}" data-cat="all" type="button">
        <span>Semua</span>
        <span class="pill-count">(${categoryCounts.all || 0})</span>
      </button>
      ${this.categories
        .map(
          (cat) => `
          <button class="filter-pill ${this.activeCategory === cat.id ? 'active' : ''}" data-cat="${cat.id}" type="button">
            <span class="pill-dot" style="background-color: ${cat.color};"></span>
            <span>${cat.name}</span>
            <span class="pill-count">(${categoryCounts[cat.id] || 0})</span>
          </button>
        `
        )
        .join('')}
    `;

    // 5. Build Cards or Empty State HTML
    let listContentHtml = '';
    if (filtered.length === 0) {
      if (this.activities.length === 0) {
        // Pure empty state for today
        listContentHtml = `
          <div class="empty-state">
            <div class="empty-state-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h4 class="empty-state-title">Belum Ada Aktivitas Hari Ini</h4>
            <p class="empty-state-subtitle">Mulai stopwatch di atas atau klik tombol <strong>Log Manual</strong> untuk mencatat aktivitas pertamamu!</p>
          </div>
        `;
      } else {
        // Filter/search empty state
        listContentHtml = `
          <div class="empty-state" style="padding: var(--space-8);">
            <h4 class="empty-state-title">Tidak Ada Hasil</h4>
            <p class="empty-state-subtitle">Tidak ada aktivitas yang sesuai dengan filter atau kata kunci pencarian.</p>
          </div>
        `;
      }
    } else {
      listContentHtml = `
        <div class="activity-list" id="activityCardsContainer">
          ${filtered
            .map((act) => {
              const cat = catMap[act.categoryId] || { name: 'Personal', color: '#6366f1', bgColor: 'rgba(99,102,241,0.15)' };
              const timeStart = formatTime24h(act.startTime);
              const timeEnd = formatTime24h(act.endTime);
              const durationFormatted = formatDurationHuman(act.durationSeconds);

              return `
                <div class="card-activity" data-id="${act.id}" style="--cat-color: ${cat.color};">
                  <div class="activity-main-info">
                    <div class="activity-title-row">
                      <span class="activity-title">${this.escapeHtml(act.title)}</span>
                      <span class="badge-category" style="color: ${cat.color}; background: ${cat.bgColor};">
                        <span class="badge-dot" style="background-color: ${cat.color};"></span>
                        ${cat.name}
                      </span>
                    </div>

                    <div class="activity-time-row">
                      <span>${timeStart} &ndash; ${timeEnd}</span>
                      <span>&bull;</span>
                      <span class="activity-duration">${durationFormatted}</span>
                    </div>

                    ${
                      act.notes
                        ? `<p class="activity-notes">${this.escapeHtml(act.notes)}</p>`
                        : ''
                    }
                  </div>

                  <div class="activity-actions">
                    <button class="btn-action btn-action-edit" data-action="edit" data-id="${act.id}" title="Edit Aktivitas" aria-label="Edit aktivitas ${this.escapeHtml(act.title)}">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>

                    <button class="btn-action btn-action-delete" data-action="delete" data-id="${act.id}" title="Hapus Aktivitas" aria-label="Hapus aktivitas ${this.escapeHtml(act.title)}">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>
      `;
    }

    // 6. Assemble complete feed container
    this.container.innerHTML = `
      <div class="feed-container">
        <!-- Feed Header -->
        <div class="feed-header">
          <div class="feed-title-wrap">
            <h3 class="feed-title">Riwayat Aktivitas</h3>
            <span class="feed-count-badge">${this.activities.length} sesi</span>
          </div>

          <!-- Search Box -->
          <div class="search-box">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="search" 
              id="feedSearchInput" 
              class="search-input" 
              placeholder="Cari aktivitas atau catatan..." 
              value="${this.escapeHtml(this.searchQuery)}"
              autocomplete="off"
            />
          </div>
        </div>

        <!-- Category Filter Pills -->
        <div class="filter-pills-row" id="filterPillsRow">
          ${pillsHtml}
        </div>

        <!-- Activity Feed List -->
        ${listContentHtml}
      </div>
    `;
  }

  /**
   * Binds DOM event listeners for search, filter, and action buttons.
   */
  bindEvents() {
    this.container.addEventListener('input', (e) => {
      if (e.target.id === 'feedSearchInput') {
        this.searchQuery = e.target.value;
        this.render();
        // Restore cursor focus after re-render
        const searchInput = document.getElementById('feedSearchInput');
        if (searchInput) {
          searchInput.focus();
          searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
        }
      }
    });

    this.container.addEventListener('click', async (e) => {
      // Category Pill Click
      const pill = e.target.closest('.filter-pill');
      if (pill) {
        this.activeCategory = pill.dataset.cat;
        this.render();
        return;
      }

      // Action Button Click
      const actionBtn = e.target.closest('.btn-action');
      if (actionBtn) {
        const action = actionBtn.dataset.action;
        const id = actionBtn.dataset.id;

        if (action === 'edit') {
          this.handleEdit(id);
        } else if (action === 'delete') {
          this.handleDelete(id);
        }
      }
    });
  }

  /**
   * Triggers the edit modal for an activity.
   * @param {string} id 
   */
  async handleEdit(id) {
    if (!this.modal) return;
    const activity = await activityService.getActivityById(id);
    if (activity) {
      this.modal.openEdit(activity);
    }
  }

  /**
   * Handles frictionless inline deletion with a 5-second Undo toast.
   * @param {string} id 
   */
  async handleDelete(id) {
    const cardEl = this.container.querySelector(`.card-activity[data-id="${id}"]`);
    const activityToDelete = this.activities.find((act) => act.id === id);
    if (!activityToDelete) return;

    // 1. Immediately remove visually from DOM with smooth animation
    if (cardEl) {
      cardEl.classList.add('deleting');
      setTimeout(() => {
        if (cardEl.parentNode) cardEl.remove();
      }, 300);
    }

    // 2. Temporarily remove from local array so counts update
    this.activities = this.activities.filter((act) => act.id !== id);

    // 3. Set 5-second timeout for permanent database deletion
    const timeoutId = setTimeout(async () => {
      this.pendingDeletes.delete(id);
      try {
        await activityService.deleteActivity(id);
        document.dispatchEvent(new CustomEvent('activity-updated'));
      } catch (err) {
        console.error('[ActivityList] Error deleting activity:', err);
      }
    }, 5000);

    this.pendingDeletes.set(id, { timeoutId, activity: activityToDelete });

    // 4. Show Inline Undo Toast
    this.showUndoToast(activityToDelete.title, () => {
      // Undo callback
      const pending = this.pendingDeletes.get(id);
      if (pending) {
        clearTimeout(pending.timeoutId);
        this.pendingDeletes.delete(id);
        this.activities.unshift(pending.activity);
        this.render();
      }
    });
  }

  /**
   * Displays an Undo snackbar/toast at the bottom of the screen.
   * @param {string} title 
   * @param {Function} undoCallback 
   */
  showUndoToast(title, undoCallback) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast-undo-box';
    toast.innerHTML = `
      <span class="toast-message">Aktivitas "${this.escapeHtml(title)}" dihapus</span>
      <button class="btn-undo" type="button">Batalkan (Undo)</button>
    `;

    const undoBtn = toast.querySelector('.btn-undo');
    undoBtn.addEventListener('click', () => {
      undoCallback();
      toast.remove();
    });

    container.appendChild(toast);

    // Auto remove toast after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 5000);
  }

  /**
   * Helper to escape HTML characters.
   * @param {string} str 
   * @returns {string}
   */
  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
