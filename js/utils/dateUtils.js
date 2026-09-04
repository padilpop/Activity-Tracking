/**
 * Activity Tracker — Date and Time Utilities
 * Provides functions for calculating durations, formatting timestamps, and handling local dates.
 */

/**
 * Formats a duration in seconds into digital stopwatch format "HH:MM:SS" or "MM:SS".
 * @param {number} totalSeconds 
 * @returns {string} e.g. "01:25:40"
 */
export function formatDigitalTimer(totalSeconds) {
  const sec = Math.max(0, Math.floor(totalSeconds || 0));
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;

  const pad = (num) => String(num).padStart(2, '0');

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Formats a duration in seconds into human-readable Indonesian format.
 * @param {number} totalSeconds 
 * @returns {string} e.g. "1j 30m", "45m", "15d"
 */
export function formatDurationHuman(totalSeconds) {
  const sec = Math.max(0, Math.floor(totalSeconds || 0));
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours}j ${minutes}m` : `${hours}j`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}d`;
}

/**
 * Returns today's date in 'YYYY-MM-DD' format according to local time.
 * @param {Date} [d=new Date()]
 * @returns {string}
 */
export function getTodayDateString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats an ISO string or Date object to 24-hour time "HH:mm".
 * @param {string | Date} dateOrIso 
 * @returns {string} e.g. "14:30"
 */
export function formatTime24h(dateOrIso) {
  if (!dateOrIso) return '--:--';
  const d = typeof dateOrIso === 'string' ? new Date(dateOrIso) : dateOrIso;
  if (isNaN(d.getTime())) return '--:--';

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Calculates duration in whole seconds between two ISO timestamps.
 * @param {string} startTimeIso 
 * @param {string} endTimeIso 
 * @returns {number} duration in seconds (can be negative if endTime < startTime)
 */
export function calculateDurationSeconds(startTimeIso, endTimeIso) {
  const start = new Date(startTimeIso).getTime();
  const end = new Date(endTimeIso).getTime();
  if (isNaN(start) || isNaN(end)) return 0;
  return Math.round((end - start) / 1000);
}

/**
 * Combines a 'YYYY-MM-DD' date string and 'HH:mm' time string into an ISO UTC string.
 * @param {string} dateStr 'YYYY-MM-DD'
 * @param {string} timeStr 'HH:mm'
 * @returns {string} ISO 8601 string
 */
export function combineDateAndTime(dateStr, timeStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return date.toISOString();
}

/**
 * Formats a 'YYYY-MM-DD' date string into a localized display date.
 * @param {string} dateStr 'YYYY-MM-DD'
 * @param {string} [locale='id-ID']
 * @returns {string} e.g. "Jumat, 4 September 2026"
 */
export function formatDisplayDate(dateStr, locale = 'id-ID') {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}
