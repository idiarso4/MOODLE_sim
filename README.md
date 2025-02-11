# Sistem Informasi Manajemen Sekolah

Repositori ini berisi kumpulan aplikasi untuk manajemen sekolah, termasuk sistem absensi berbasis wajah, manajemen pembelajaran, dan monitoring.

## Struktur Proyek

```
APP6/
├── moodle/                      # Sistem Absensi & Pembelajaran
│   ├── api/                     # Backend API
│   ├── attendance-app/          # Aplikasi Absensi Mobile
│   ├── face_recognition/        # Modul Pengenalan Wajah
│   ├── grafana/                 # Dashboard Monitoring
│   └── prometheus/              # Metrics & Monitoring
└── package.json                 # Konfigurasi Proyek
```

## Komponen Utama

### 1. Sistem Absensi (moodle/)
- Absensi berbasis pengenalan wajah
- Validasi lokasi GPS
- Pemindaian QR Code
- Dashboard real-time
- Laporan kehadiran komprehensif
- Audit log untuk keamanan

### 2. Backend API (moodle/api/)
- RESTful API dengan Express & TypeScript
- Autentikasi JWT
- Rate limiting
- Validasi input
- Logging & monitoring
- Integrasi database PostgreSQL
- Unit testing dengan Jest

### 3. Aplikasi Mobile (moodle/attendance-app/)
- React Native
- Kamera untuk pengenalan wajah
- GPS untuk validasi lokasi
- Pemindai QR Code
- Antarmuka responsif
- Mode offline

### 4. Monitoring (moodle/grafana/ & moodle/prometheus/)
- Dashboard Grafana
- Metrik Prometheus
- Alerting
- Visualisasi data real-time

## Teknologi

### Backend
- Node.js dengan TypeScript
- Express.js
- Prisma ORM
- PostgreSQL
- face-api.js
- Jest untuk testing

### Frontend
- React Native
- Ant Design
- Axios
- React Query

### DevOps
- Docker & Docker Compose
- GitHub Actions
- Prometheus & Grafana

## Fitur Keamanan

- ✅ Autentikasi JWT
- ✅ Hashing password dengan bcrypt
- ✅ Rate limiting
- ✅ Validasi input
- ✅ Audit logging
- ✅ CORS protection
- ✅ Backup database terenkripsi
- ✅ Konfigurasi berbasis environment

## Instalasi

### Prasyarat
- Docker Desktop
- Node.js 16+
- npm atau yarn
- Git

### Langkah-langkah
1. Clone repositori
   ```bash
   git clone https://github.com/idiarso4/MOODLE_sim.git
   cd APP6
   ```

2. Setup environment
   ```bash
   cp .env.example .env
   # Edit .env sesuai kebutuhan
   ```

3. Jalankan dengan Docker
   ```bash
   docker-compose up -d
   ```

## Pengembangan

### Setup Development
```bash
# Install dependencies
npm install

# Jalankan dalam mode development
npm run dev
```

### Testing
```bash
# Unit testing
npm run test

# E2E testing
npm run test:e2e
```

## Dokumentasi API

Dokumentasi API tersedia di `/api/docs` saat menjalankan dalam mode development.

## Panduan Kontribusi

1. Fork repositori
2. Buat branch fitur (`git checkout -b fitur/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add: fitur baru'`)
4. Push ke branch (`git push origin fitur/AmazingFeature`)
5. Buat Pull Request

## Keamanan

- Ganti kredensial default di production
- Gunakan password yang kuat
- Update dependencies secara berkala
- Aktifkan HTTPS di production
- Backup data secara rutin
- Monitor log audit
- Ikuti praktik keamanan terbaik

## Lisensi

Hak Cipta © 2025. Seluruh hak cipta dilindungi undang-undang.
