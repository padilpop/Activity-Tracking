/**
 * Activity Tracker — Dashboard & Analytics Component
 * Handles daily metrics stat cards and Chart.js category time distribution donut.
 */

import { activityService } from '../services/activityService.js';
import { formatDurationHuman } from '../utils/dateUtils.js';
import { getCategoryIconSvg } from '../config.js';

export class DashboardComponent {
  constructor() {
    this.statsSection = document.getElementById('statsSection');
    this.analyticsSection = document.getElementById('analyticsSection');
    this.chartInstance = null;
    this.themeObserver = null;
  }

  /**
   * Initializes the dashboard component.
   */
  async init() {
    if (!this.statsSection || !this.analyticsSection) {
      console.warn('DashboardComponent: Target DOM sections not found.');
      return;
    }

    // Listen to global activity updates (timer stop, log created/updated/deleted)
    document.addEventListener('activity-updated', () => {
      this.render();
    });

    // Listen for theme toggle to adjust Chart.js text & border styles
    this._observeThemeChange();

    // Initial render
    await this.render();
  }

  /**
   * Watches for data-theme changes on documentElement to update chart colors
   */
  _observeThemeChange() {
    if (typeof MutationObserver === 'undefined') return;
    this.themeObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          if (this.chartInstance) {
            this._updateChartTheme();
          }
        }
      });
    });

    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }

  /**
   * Renders both stats cards and analytics chart.
   */
  async render() {
    try {
      const summary = await activityService.getDailySummary();
      this.renderStats(summary);
      this.renderAnalytics(summary);
    } catch (err) {
      console.error('Error rendering dashboard:', err);
    }
  }

  /**
   * Renders the 3 overview stat cards.
   * @param {Object} summary 
   */
  renderStats(summary) {
    const { totalActivities, totalDurationSeconds, dominantCategory } = summary;

    // Card 1: Total Duration
    const durationText = totalDurationSeconds > 0 
      ? formatDurationHuman(totalDurationSeconds)
      : '0 menit';
    
    const durationSubtext = totalDurationSeconds > 0
      ? 'Waktu terlacak hari ini'
      : 'Mulai timer untuk mencatat aktivitas';

    // Card 2: Dominant Category
    let dominantName = 'Belum Ada';
    let dominantSubtext = 'Aktivitas belum tercatat';
    let dominantColor = 'var(--color-primary)';
    let dominantIconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>`;

    if (dominantCategory && dominantCategory.totalSeconds > 0) {
      dominantName = dominantCategory.name;
      const dominantPercent = Math.round((dominantCategory.totalSeconds / totalDurationSeconds) * 100);
      dominantSubtext = `${formatDurationHuman(dominantCategory.totalSeconds)} (${dominantPercent}% dari hari ini)`;
      dominantColor = dominantCategory.color;
      dominantIconSvg = getCategoryIconSvg(dominantCategory.icon || 'check-circle', 20);
    }

    // Card 3: Total Sessions & Average
    const sessionsText = `${totalActivities} ${totalActivities === 1 ? 'Aktivitas' : 'Aktivitas'}`;
    let avgSubtext = '0 m / sesi';
    if (totalActivities > 0 && totalDurationSeconds > 0) {
      const avgSeconds = Math.round(totalDurationSeconds / totalActivities);
      avgSubtext = `Rata-rata ~${formatDurationHuman(avgSeconds)} per sesi`;
    } else {
      avgSubtext = 'Belum ada sesi hari ini';
    }

    this.statsSection.innerHTML = `
      <div class="stats-grid">
        <!-- Metric Card 1: Total Waktu -->
        <article class="stat-card" data-stat="duration">
          <div class="stat-card-header">
            <span class="stat-label">Total Waktu Produktif</span>
            <div class="stat-icon-wrapper stat-icon-primary" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
          </div>
          <div class="stat-value font-digital">${durationText}</div>
          <p class="stat-subtext">${durationSubtext}</p>
        </article>

        <!-- Metric Card 2: Kategori Dominan -->
        <article class="stat-card" data-stat="dominant">
          <div class="stat-card-header">
            <span class="stat-label">Kategori Dominan</span>
            <div class="stat-icon-wrapper stat-icon-accent" style="background: ${dominantColor}1a; color: ${dominantColor};" aria-hidden="true">
              ${dominantIconSvg}
            </div>
          </div>
          <div class="stat-value" style="color: ${dominantCategory ? dominantColor : 'inherit'};">${dominantName}</div>
          <p class="stat-subtext">${dominantSubtext}</p>
        </article>

        <!-- Metric Card 3: Total Sesi -->
        <article class="stat-card" data-stat="sessions">
          <div class="stat-card-header">
            <span class="stat-label">Total Sesi Aktivitas</span>
            <div class="stat-icon-wrapper stat-icon-success" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
          </div>
          <div class="stat-value font-digital">${sessionsText}</div>
          <p class="stat-subtext">${avgSubtext}</p>
        </article>
      </div>
    `;
  }

  /**
   * Renders the Analytics section (Chart.js donut or empty state).
   * @param {Object} summary 
   */
  renderAnalytics(summary) {
    const { totalActivities, totalDurationSeconds, byCategory } = summary;

    // Filter active categories that have logged duration
    const activeCategories = Object.values(byCategory).filter((cat) => cat.totalSeconds > 0);

    // If no activities logged yet today, render friendly empty state
    if (totalActivities === 0 || activeCategories.length === 0) {
      if (this.chartInstance) {
        this.chartInstance.destroy();
        this.chartInstance = null;
      }

      this.analyticsSection.innerHTML = `
        <div class="analytics-card">
          <div class="analytics-header">
            <div class="analytics-title-group">
              <h2 class="analytics-title">Distribusi Waktu Kategori</h2>
              <p class="analytics-subtitle">Alokasi waktu aktivitas hari ini</p>
            </div>
            <span class="badge badge-neutral">Hari Ini</span>
          </div>

          <div class="analytics-empty-state">
            <div class="analytics-empty-icon" aria-hidden="true">
              <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
              </svg>
            </div>
            <h3 class="analytics-empty-title">Belum Ada Data Grafik</h3>
            <p class="analytics-empty-desc">
              Grafik donat distribusi waktu akan terbentuk otomatis setelah kamu merekam atau mencatat aktivitas hari ini.
            </p>
          </div>
        </div>
      `;
      return;
    }

    // If there is data, render canvas and category breakdown list
    this.analyticsSection.innerHTML = `
      <div class="analytics-card">
        <div class="analytics-header">
          <div class="analytics-title-group">
            <h2 class="analytics-title">Distribusi Waktu Kategori</h2>
            <p class="analytics-subtitle">Alokasi waktu aktivitas hari ini</p>
          </div>
          <span class="badge badge-primary">${formatDurationHuman(totalDurationSeconds)}</span>
        </div>

        <div class="analytics-body">
          <div class="chart-wrapper">
            <div class="chart-canvas-box">
              <canvas id="categoryDonutChart" width="220" height="220" aria-label="Diagram Donat Distribusi Waktu Kategori" role="img"></canvas>
              <div class="chart-center-metric">
                <span class="chart-center-value font-digital">${activeCategories.length}</span>
                <span class="chart-center-label">Kategori</span>
              </div>
            </div>
          </div>

          <!-- Breakdown Legend List -->
          <div class="analytics-breakdown-list">
            ${activeCategories.map((cat) => {
              const percent = totalDurationSeconds > 0 
                ? Math.round((cat.totalSeconds / totalDurationSeconds) * 100)
                : 0;
              return `
                <div class="breakdown-item">
                  <div class="breakdown-info">
                    <div class="breakdown-cat-header">
                      <span class="breakdown-color-dot" style="background-color: ${cat.color};"></span>
                      <span class="breakdown-cat-name">${getCategoryIconSvg(cat.icon, 14)} ${cat.name}</span>
                    </div>
                    <span class="breakdown-duration">${formatDurationHuman(cat.totalSeconds)}</span>
                  </div>
                  <div class="breakdown-bar-track">
                    <div class="breakdown-bar-fill" style="width: ${percent}%; background-color: ${cat.color};"></div>
                  </div>
                  <div class="breakdown-meta">
                    <span class="breakdown-count">${cat.count} sesi</span>
                    <span class="breakdown-percent">${percent}%</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    // Initialize Chart.js
    this._initChart(activeCategories, totalDurationSeconds);
  }

  /**
   * Builds the Chart.js instance with elegant styling and tooltips.
   * @param {Array<Object>} categories 
   * @param {number} totalDurationSeconds 
   */
  _initChart(categories, totalDurationSeconds) {
    const canvas = document.getElementById('categoryDonutChart');
    if (!canvas) return;

    if (typeof Chart === 'undefined') {
      console.warn('Chart.js is not loaded yet or blocked by network.');
      return;
    }

    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const borderColor = isDark ? '#161e2e' : '#ffffff';

    const labels = categories.map((cat) => cat.name);
    const dataSeconds = categories.map((cat) => cat.totalSeconds);
    const backgroundColors = categories.map((cat) => cat.color);

    const ctx = canvas.getContext('2d');
    this.chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: dataSeconds,
          backgroundColor: backgroundColors,
          borderColor: borderColor,
          borderWidth: 3,
          hoverOffset: 6,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 750,
          easing: 'easeOutQuart'
        },
        plugins: {
          legend: {
            display: false // We use our custom styled breakdown list
          },
          tooltip: {
            backgroundColor: isDark ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            titleColor: isDark ? '#f9fafb' : '#111827',
            bodyColor: isDark ? '#9ca3af' : '#4b5563',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            borderWidth: 1,
            padding: 12,
            boxPadding: 6,
            usePointStyle: true,
            callbacks: {
              label: (context) => {
                const valueSeconds = context.parsed;
                const formatted = formatDurationHuman(valueSeconds);
                const percent = totalDurationSeconds > 0
                  ? Math.round((valueSeconds / totalDurationSeconds) * 100)
                  : 0;
                return ` ${formatted} (${percent}%)`;
              }
            }
          }
        }
      }
    });
  }

  /**
   * Updates Chart.js colors on theme change
   */
  _updateChartTheme() {
    if (!this.chartInstance) return;

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const borderColor = isDark ? '#161e2e' : '#ffffff';

    this.chartInstance.data.datasets.forEach((dataset) => {
      dataset.borderColor = borderColor;
    });

    if (this.chartInstance.options.plugins.tooltip) {
      this.chartInstance.options.plugins.tooltip.backgroundColor = isDark
        ? 'rgba(17, 24, 39, 0.95)'
        : 'rgba(255, 255, 255, 0.95)';
      this.chartInstance.options.plugins.tooltip.titleColor = isDark ? '#f9fafb' : '#111827';
      this.chartInstance.options.plugins.tooltip.bodyColor = isDark ? '#9ca3af' : '#4b5563';
      this.chartInstance.options.plugins.tooltip.borderColor = isDark
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(0, 0, 0, 0.1)';
    }

    this.chartInstance.update('none');
  }
}
