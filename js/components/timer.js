/**
 * Activity Tracker — Hero Live Stopwatch Timer Component
 * Handles live stopwatch tracking, category selection, reload recovery, and activity creation.
 */

import { activityService } from '../services/activityService.js';
import { storage } from '../services/storage.js';
import { formatDigitalTimer, formatDurationHuman } from '../utils/dateUtils.js';

export class TimerComponent {
  constructor(containerId = 'timerSection') {
    this.container = document.getElementById(containerId);
    this.status = 'IDLE'; // 'IDLE' | 'RUNNING' | 'PAUSED'
    this.elapsedSeconds = 0;
    this.startTime = null;
    this.intervalId = null;
    this.title = '';
    this.categoryId = 'cat_work';
    this.categories = [];
  }

  /**
   * Initializes and renders the timer component.
   */
  async init() {
    if (!this.container) return;
    this.categories = await activityService.getCategories();
    this.render();
    this.bindEvents();
    this.recoverActiveTimer();
  }

  /**
   * Renders the timer HTML structure into the container.
   */
  render() {
    const categoryOptions = this.categories
      .map(
        (cat) =>
          `<option value="${cat.id}" ${cat.id === this.categoryId ? 'selected' : ''}>
            ${cat.name}
          </option>`
      )
      .join('');

    this.container.innerHTML = `
      <div class="hero-timer-card">
        <div class="timer-card-header">
          <div class="timer-title-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Live Stopwatch</span>
          </div>

          <div class="timer-status-badge" id="timerStatusBadge">
            <span class="status-dot"></span>
            <span id="timerStatusText">Siap Dimulai</span>
          </div>
        </div>

        <div class="timer-display-container">
          <div class="timer-display" id="timerDisplay">00:00:00</div>
        </div>

        <div class="timer-inputs-row">
          <input 
            type="text" 
            id="timerTitleInput" 
            class="form-input" 
            placeholder="Apa yang sedang kamu kerjakan saat ini? (Contoh: Belajar JavaScript)" 
            maxlength="120"
            autocomplete="off"
          />

          <select id="timerCategorySelect" class="form-select" aria-label="Pilih Kategori">
            ${categoryOptions}
          </select>
        </div>

        <div class="timer-controls-row" id="timerControls">
          <!-- Dynamically populated controls based on status -->
          <button id="btnStartTimer" class="btn btn-timer btn-start" type="button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            <span>Mulai Track</span>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Binds DOM event listeners.
   */
  bindEvents() {
    this.titleInput = document.getElementById('timerTitleInput');
    this.categorySelect = document.getElementById('timerCategorySelect');
    this.displayEl = document.getElementById('timerDisplay');
    this.statusBadgeEl = document.getElementById('timerStatusBadge');
    this.statusTextEl = document.getElementById('timerStatusText');
    this.controlsRow = document.getElementById('timerControls');

    if (this.titleInput) {
      this.titleInput.addEventListener('input', (e) => {
        this.title = e.target.value;
        this.syncStorageState();
      });
    }

    if (this.categorySelect) {
      this.categorySelect.addEventListener('change', (e) => {
        this.categoryId = e.target.value;
        this.syncStorageState();
      });
    }

    this.container.addEventListener('click', (e) => {
      const target = e.target.closest('button');
      if (!target) return;

      if (target.id === 'btnStartTimer') {
        this.start();
      } else if (target.id === 'btnPauseTimer') {
        this.pause();
      } else if (target.id === 'btnResumeTimer') {
        this.resume();
      } else if (target.id === 'btnStopTimer') {
        this.stop();
      }
    });
  }

  /**
   * Checks if an active timer was running before a page refresh/close and restores it.
   */
  recoverActiveTimer() {
    const settings = storage.getSettings();
    const active = settings.activeTimer;
    if (!active) return;

    this.title = active.title || '';
    this.categoryId = active.categoryId || 'cat_work';

    if (this.titleInput) this.titleInput.value = this.title;
    if (this.categorySelect) this.categorySelect.value = this.categoryId;

    if (active.isRunning && active.startTime) {
      const now = Date.now();
      const started = new Date(active.startTime).getTime();
      const elapsedSinceStart = Math.max(0, Math.floor((now - started) / 1000));
      this.elapsedSeconds = elapsedSinceStart + (active.elapsedBeforePause || 0);
      this.startTime = active.startTime;
      this.status = 'RUNNING';

      this.updateDisplay();
      this.startTick();
      this.updateUI();
    } else if (!active.isRunning && active.elapsedBeforePause > 0) {
      this.elapsedSeconds = active.elapsedBeforePause;
      this.status = 'PAUSED';
      this.updateDisplay();
      this.updateUI();
    }
  }

  /**
   * Starts the live timer.
   */
  start() {
    if (this.status === 'RUNNING') return;

    this.status = 'RUNNING';
    this.startTime = new Date().toISOString();
    this.elapsedSeconds = 0;
    this.title = this.titleInput.value.trim() || 'Aktivitas Tanpa Judul';

    this.updateDisplay();
    this.startTick();
    this.updateUI();
    this.syncStorageState();
  }

  /**
   * Pauses the live timer.
   */
  pause() {
    if (this.status !== 'RUNNING') return;

    clearInterval(this.intervalId);
    this.intervalId = null;
    this.status = 'PAUSED';

    this.updateUI();
    this.syncStorageState();
  }

  /**
   * Resumes a paused timer.
   */
  resume() {
    if (this.status !== 'PAUSED') return;

    this.status = 'RUNNING';
    this.startTime = new Date().toISOString(); // anchor new start time for remaining ticks

    this.startTick();
    this.updateUI();
    this.syncStorageState();
  }

  /**
   * Stops the timer and commits the activity to storage via activityService.
   */
  async stop() {
    if (this.status === 'IDLE') return;

    clearInterval(this.intervalId);
    this.intervalId = null;

    const finalDuration = this.elapsedSeconds;
    if (finalDuration < 1) {
      this.showToast('Aktivitas terlalu singkat untuk disimpan (< 1 detik).', 'error');
      this.reset();
      return;
    }

    const activityTitle = this.titleInput.value.trim() || 'Aktivitas Tanpa Judul';
    const endTimeIso = new Date().toISOString();
    const startTimeIso = new Date(Date.now() - finalDuration * 1000).toISOString();

    try {
      const created = await activityService.createActivity({
        title: activityTitle,
        categoryId: this.categoryId,
        startTime: startTimeIso,
        endTime: endTimeIso,
        notes: ''
      });

      this.showToast(
        `Berhasil dicatat: "${created.title}" (${formatDurationHuman(finalDuration)})`,
        'success'
      );

      // Reset timer UI and storage
      this.reset();

      // Dispatch global event for other components to re-render
      document.dispatchEvent(new CustomEvent('activity-updated', { detail: { created } }));
    } catch (error) {
      console.error('[TimerComponent] Failed to save activity:', error);
      this.showToast(error.message || 'Gagal menyimpan aktivitas.', 'error');
    }
  }

  /**
   * Resets timer back to idle state.
   */
  reset() {
    this.status = 'IDLE';
    this.elapsedSeconds = 0;
    this.startTime = null;
    if (this.titleInput) this.titleInput.value = '';
    this.title = '';
    this.updateDisplay();
    this.updateUI();
    storage.updateSettings({ activeTimer: null });
  }

  /**
   * Starts the 1-second interval counter.
   */
  startTick() {
    clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      this.elapsedSeconds += 1;
      this.updateDisplay();
    }, 1000);
  }

  /**
   * Updates the digital time text display.
   */
  updateDisplay() {
    if (this.displayEl) {
      this.displayEl.textContent = formatDigitalTimer(this.elapsedSeconds);
      if (this.status === 'RUNNING') {
        this.displayEl.classList.add('active');
      } else {
        this.displayEl.classList.remove('active');
      }
    }
  }

  /**
   * Updates control buttons and status badge indicator according to timer state.
   */
  updateUI() {
    if (!this.controlsRow || !this.statusBadgeEl) return;

    // Reset status badge classes
    this.statusBadgeEl.className = 'timer-status-badge';

    if (this.status === 'RUNNING') {
      this.statusBadgeEl.classList.add('status-running');
      this.statusTextEl.textContent = 'Sedang Berjalan...';

      this.controlsRow.innerHTML = `
        <button id="btnPauseTimer" class="btn btn-timer btn-pause" type="button">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
          </svg>
          <span>Jeda (Pause)</span>
        </button>

        <button id="btnStopTimer" class="btn btn-timer btn-stop" type="button">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <rect x="5" y="5" width="14" height="14" rx="2"></rect>
          </svg>
          <span>Selesai & Simpan</span>
        </button>
      `;
    } else if (this.status === 'PAUSED') {
      this.statusBadgeEl.classList.add('status-paused');
      this.statusTextEl.textContent = 'Dijeda';

      this.controlsRow.innerHTML = `
        <button id="btnResumeTimer" class="btn btn-timer btn-resume" type="button">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          <span>Lanjutkan</span>
        </button>

        <button id="btnStopTimer" class="btn btn-timer btn-stop" type="button">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <rect x="5" y="5" width="14" height="14" rx="2"></rect>
          </svg>
          <span>Selesai & Simpan</span>
        </button>
      `;
    } else {
      // IDLE
      this.statusTextEl.textContent = 'Siap Dimulai';

      this.controlsRow.innerHTML = `
        <button id="btnStartTimer" class="btn btn-timer btn-start" type="button">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          <span>Mulai Track</span>
        </button>
      `;
    }
  }

  /**
   * Persists the current timer state to storage for reload recovery.
   */
  syncStorageState() {
    if (this.status === 'IDLE') {
      storage.updateSettings({ activeTimer: null });
      return;
    }

    const activeTimerData = {
      isRunning: this.status === 'RUNNING',
      startTime: this.startTime,
      title: this.titleInput ? this.titleInput.value : this.title,
      categoryId: this.categoryId,
      elapsedBeforePause: this.status === 'PAUSED' ? this.elapsedSeconds : 0
    };

    storage.updateSettings({ activeTimer: activeTimerData });
  }

  /**
   * Displays a floating toast notification.
   * @param {string} message 
   * @param {'success' | 'error'} type 
   */
  showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-message">${message}</span>
      <button class="toast-close" aria-label="Tutup notifikasi">&times;</button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.remove();
    });

    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 4500);
  }
}
