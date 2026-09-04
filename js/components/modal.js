/**
 * Activity Tracker — Manual Activity Log & Edit Modal Component
 * Provides modal dialog for creating retrospective logs and editing existing activities.
 */

import { activityService } from '../services/activityService.js';
import {
  getTodayDateString,
  formatTime24h,
  combineDateAndTime,
  calculateDurationSeconds,
  formatDurationHuman
} from '../utils/dateUtils.js';

export class ModalComponent {
  constructor(containerId = 'modalContainer') {
    this.container = document.getElementById(containerId);
    this.mode = 'CREATE'; // 'CREATE' | 'EDIT'
    this.editingId = null;
    this.categories = [];
    this.isOpen = false;
  }

  /**
   * Initializes the modal component and renders markup.
   */
  async init() {
    if (!this.container) return;
    this.categories = await activityService.getCategories();
    this.render();
    this.bindEvents();
  }

  /**
   * Renders the modal HTML structure.
   */
  render() {
    const categoryOptions = this.categories
      .map((cat) => `<option value="${cat.id}">${cat.name}</option>`)
      .join('');

    this.container.innerHTML = `
      <div class="modal-backdrop" id="activityModalBackdrop">
        <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="modalDialogTitle">
          <div class="modal-content">
            <!-- Modal Header -->
            <div class="modal-header">
              <div class="modal-title-wrap">
                <div class="modal-icon-badge" id="modalIconBadge">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </div>
                <h3 class="modal-title" id="modalDialogTitle">Catat Aktivitas Manual</h3>
              </div>
              <button class="btn-close-modal" id="modalCloseBtn" type="button" aria-label="Tutup modal">&times;</button>
            </div>

            <!-- Modal Body Form -->
            <form id="activityForm">
              <div class="modal-body">
                <!-- Title Field -->
                <div class="form-group">
                  <label class="form-label" for="modalTitle">
                    <span>Nama Aktivitas <span class="required">*</span></span>
                  </label>
                  <input 
                    type="text" 
                    id="modalTitle" 
                    class="form-input" 
                    placeholder="Contoh: Belajar Algoritma & Struktur Data" 
                    required 
                    maxlength="120"
                    autocomplete="off"
                  />
                </div>

                <!-- Category Field -->
                <div class="form-group">
                  <label class="form-label" for="modalCategory">
                    <span>Kategori <span class="required">*</span></span>
                  </label>
                  <select id="modalCategory" class="form-select">
                    ${categoryOptions}
                  </select>
                </div>

                <!-- Date Field -->
                <div class="form-group">
                  <label class="form-label" for="modalDate">
                    <span>Tanggal Aktivitas <span class="required">*</span></span>
                  </label>
                  <input type="date" id="modalDate" class="form-input" required />
                </div>

                <!-- Start & End Time Grid -->
                <div class="time-inputs-grid">
                  <div class="form-group">
                    <label class="form-label" for="modalStartTime">
                      <span>Jam Mulai <span class="required">*</span></span>
                    </label>
                    <input type="time" id="modalStartTime" class="form-input" required />
                  </div>

                  <div class="form-group">
                    <label class="form-label" for="modalEndTime">
                      <span>Jam Selesai <span class="required">*</span></span>
                    </label>
                    <input type="time" id="modalEndTime" class="form-input" required />
                  </div>
                </div>

                <!-- Dynamic Duration Preview Badge -->
                <div class="duration-preview-card valid" id="durationPreviewBadge">
                  <span>Kalkulasi Durasi:</span>
                  <span id="durationPreviewText">1j 0m</span>
                </div>

                <!-- Notes Field -->
                <div class="form-group">
                  <label class="form-label" for="modalNotes">
                    <span>Catatan (Opsional)</span>
                  </label>
                  <textarea 
                    id="modalNotes" 
                    class="form-input" 
                    rows="2" 
                    placeholder="Tuliskan catatan atau detail ringkas aktivitas..."
                    maxlength="500"
                    style="resize: vertical;"
                  ></textarea>
                </div>
              </div>

              <!-- Modal Footer -->
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" id="modalCancelBtn">Batal</button>
                <button type="submit" class="btn btn-primary" id="modalSubmitBtn">
                  <span>Simpan Aktivitas</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Binds DOM event handlers.
   */
  bindEvents() {
    this.backdrop = document.getElementById('activityModalBackdrop');
    this.closeBtn = document.getElementById('modalCloseBtn');
    this.cancelBtn = document.getElementById('modalCancelBtn');
    this.form = document.getElementById('activityForm');

    this.titleInput = document.getElementById('modalTitle');
    this.categorySelect = document.getElementById('modalCategory');
    this.dateInput = document.getElementById('modalDate');
    this.startTimeInput = document.getElementById('modalStartTime');
    this.endTimeInput = document.getElementById('modalEndTime');
    this.notesInput = document.getElementById('modalNotes');
    this.durationBadge = document.getElementById('durationPreviewBadge');
    this.durationText = document.getElementById('durationPreviewText');
    this.submitBtn = document.getElementById('modalSubmitBtn');
    this.modalTitle = document.getElementById('modalDialogTitle');

    // Close actions
    this.closeBtn.addEventListener('click', () => this.close());
    this.cancelBtn.addEventListener('click', () => this.close());
    this.backdrop.addEventListener('click', (e) => {
      if (e.target === this.backdrop) this.close();
    });

    // Keyboard ESC to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Live duration calculation on time or date input change
    ['input', 'change'].forEach((evt) => {
      this.startTimeInput.addEventListener(evt, () => this.calculateDuration());
      this.endTimeInput.addEventListener(evt, () => this.calculateDuration());
      this.dateInput.addEventListener(evt, () => this.calculateDuration());
    });

    // Form submit
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  /**
   * Opens the modal in CREATE mode with pre-filled default timestamps.
   */
  openCreate() {
    this.mode = 'CREATE';
    this.editingId = null;
    this.isOpen = true;

    this.modalTitle.textContent = 'Catat Aktivitas Manual';
    this.submitBtn.innerHTML = '<span>Simpan Aktivitas</span>';

    // Defaults: today, 1 hour ago until now
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    this.titleInput.value = '';
    this.dateInput.value = getTodayDateString(now);
    this.startTimeInput.value = formatTime24h(oneHourAgo);
    this.endTimeInput.value = formatTime24h(now);
    this.notesInput.value = '';
    this.categorySelect.selectedIndex = 0;

    this.calculateDuration();
    this.backdrop.classList.add('active');
    setTimeout(() => this.titleInput.focus(), 150);
  }

  /**
   * Opens the modal in EDIT mode pre-filled with existing activity data.
   * @param {Object} activity 
   */
  openEdit(activity) {
    this.mode = 'EDIT';
    this.editingId = activity.id;
    this.isOpen = true;

    this.modalTitle.textContent = 'Edit Aktivitas';
    this.submitBtn.innerHTML = '<span>Simpan Perubahan</span>';

    this.titleInput.value = activity.title;
    this.categorySelect.value = activity.categoryId;
    this.dateInput.value = activity.date;
    this.startTimeInput.value = formatTime24h(activity.startTime);
    this.endTimeInput.value = formatTime24h(activity.endTime);
    this.notesInput.value = activity.notes || '';

    this.calculateDuration();
    this.backdrop.classList.add('active');
    setTimeout(() => this.titleInput.focus(), 150);
  }

  /**
   * Closes the modal.
   */
  close() {
    this.backdrop.classList.remove('active');
    this.isOpen = false;
  }

  /**
   * Calculates duration and performs real-time BR001 validation.
   * @returns {number} duration in seconds
   */
  calculateDuration() {
    const dateStr = this.dateInput.value;
    const startStr = this.startTimeInput.value;
    const endStr = this.endTimeInput.value;

    if (!dateStr || !startStr || !endStr) {
      this.durationBadge.className = 'duration-preview-card';
      this.durationText.textContent = 'Lengkapi jam mulai & selesai';
      this.submitBtn.disabled = true;
      return 0;
    }

    const startIso = combineDateAndTime(dateStr, startStr);
    const endIso = combineDateAndTime(dateStr, endStr);
    const durationSeconds = calculateDurationSeconds(startIso, endIso);

    if (durationSeconds < 0) {
      // BR001 violation
      this.durationBadge.className = 'duration-preview-card invalid';
      this.durationText.textContent = 'Waktu selesai tidak boleh lebih awal dari waktu mulai!';
      this.submitBtn.disabled = true;
      return durationSeconds;
    } else if (durationSeconds === 0) {
      this.durationBadge.className = 'duration-preview-card invalid';
      this.durationText.textContent = 'Durasi aktivitas minimal 1 menit.';
      this.submitBtn.disabled = true;
      return 0;
    } else {
      this.durationBadge.className = 'duration-preview-card valid';
      this.durationText.textContent = formatDurationHuman(durationSeconds);
      this.submitBtn.disabled = false;
      return durationSeconds;
    }
  }

  /**
   * Handles form submission for creating or updating an activity.
   * @param {Event} e 
   */
  async handleSubmit(e) {
    e.preventDefault();

    const title = this.titleInput.value.trim();
    if (!title) {
      this.titleInput.focus();
      return;
    }

    const duration = this.calculateDuration();
    if (duration <= 0) return;

    const dateStr = this.dateInput.value;
    const startIso = combineDateAndTime(dateStr, this.startTimeInput.value);
    const endIso = combineDateAndTime(dateStr, this.endTimeInput.value);
    const categoryId = this.categorySelect.value;
    const notes = this.notesInput.value.trim();

    try {
      this.submitBtn.disabled = true;

      if (this.mode === 'CREATE') {
        const created = await activityService.createActivity({
          title,
          categoryId,
          date: dateStr,
          startTime: startIso,
          endTime: endIso,
          notes
        });

        this.showToast(`Aktivitas "${created.title}" berhasil dicatat!`, 'success');
      } else {
        const updated = await activityService.updateActivity(this.editingId, {
          title,
          categoryId,
          date: dateStr,
          startTime: startIso,
          endTime: endIso,
          notes
        });

        this.showToast(`Aktivitas "${updated.title}" berhasil diperbarui!`, 'success');
      }

      this.close();
      document.dispatchEvent(new CustomEvent('activity-updated'));
    } catch (error) {
      console.error('[ModalComponent] Error saving activity:', error);
      this.showToast(error.message || 'Gagal menyimpan aktivitas.', 'error');
    } finally {
      this.submitBtn.disabled = false;
    }
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
