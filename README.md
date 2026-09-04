# Activity Tracker

> **Personal Productivity & Life Logger** — Aplikasi pelacak aktivitas dan alokasi waktu harian personal yang modern, cepat, dan intuitif.

---

## 🌟 Fitur Utama

- ⏱️ **Dual-Mode Tracking**: Mendukung *Live Stopwatch Timer* waktu nyata dan pencatatan *Manual Log* retrospektif.
- 🏷️ **Kategori & Warna**: Pengelompokan aktivitas (*Work, Study, Fitness, Habit, Personal*) dengan warna pembeda yang konsisten.
- 📊 **Dashboard Analitik Harian**: Ringkasan akumulasi waktu produktif dan visualisasi diagram alokasi waktu per kategori (Chart.js).
- 🌓 **Dual Theme**: *Sleek Dark Mode* (default) dan *Clean Light Mode* dengan transisi halus.
- ↩️ **Frictionless UX**: Fitur hapus dengan *Inline Undo Toast* 5 detik tanpa popup konfirmasi yang mengganggu.
- 🔒 **Zero-Setup & Offline-Ready**: Data tersimpan persisten di browser (`localStorage`) tanpa memerlukan server backend atau database terpisah.

---

## 🛠️ Tech Stack

- **Structure**: HTML5 Semantic Markup
- **Styling**: Vanilla CSS3 (CSS Variables, Flexbox, CSS Grid)
- **Logic**: Modern JavaScript (ES Modules native)
- **Charts**: [Chart.js](https://www.chartjs.org/) via CDN
- **Fonts**: [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) & [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono)

---

## 🚀 Cara Menjalankan Secara Lokal

Cukup buka file `index.html` langsung di browser modern, atau gunakan ekstensi live server (misal: *Live Server* di VS Code).

```bash
# Contoh membuka via browser
open index.html
# atau buka index.html secara langsung dari file explorer
```

---

## 📂 Struktur Proyek

```text
├── index.html              # Halaman utama aplikasi
├── css/
│   └── styles.css          # Design system & tokens (Dark/Light mode)
├── js/
│   ├── app.js              # Entry point utama aplikasi
│   ├── services/           # Service & storage persistence layer
│   ├── components/         # Komponen UI (Timer, List, Modal, Dashboard)
│   └── utils/              # Helper waktu, tanggal, dan sanitasi DOM
└── assets/                 # Aset grafis & ikon
```

---

## 👤 Pemilik Proyek
Dibuat oleh **Fahdil Raihandi** (2026).
