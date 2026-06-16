# SIAKAD Universitas Cendekia

SIAKAD Universitas Cendekia adalah aplikasi web sistem informasi akademik untuk mengelola data akademik kampus secara terintegrasi. Sistem ini mendukung tiga peran utama: admin, dosen, dan mahasiswa.

## Preview Web

Simpan screenshot web ke folder `docs/images/` dengan nama file berikut.

| Halaman | Lokasi Gambar |
|---|---|
| Login | `docs/images/login.png` |
| Dashboard Admin | `docs/images/admin-dashboard.png` |
| Dashboard Dosen | `docs/images/dosen-dashboard.png` |
| Rekap Nilai Dosen | `docs/images/dosen-rekap-nilai.png` |
| Dashboard Mahasiswa | `docs/images/mahasiswa-dashboard.png` |
| KRS Mahasiswa | `docs/images/mahasiswa-krs.png` |
| Transkrip Mahasiswa | `docs/images/mahasiswa-transkrip.png` |

### Login
![Login](docs/images/login.png)

### Admin
![Dashboard Admin](docs/images/admin-dashboard.png)

### Dosen
![Dashboard Dosen](docs/images/dosen-dashboard.png)

![Rekap Nilai Dosen](docs/images/dosen-rekap-nilai.png)

### Mahasiswa
![Dashboard Mahasiswa](docs/images/mahasiswa-dashboard.png)

![KRS Mahasiswa](docs/images/mahasiswa-krs.png)

![Transkrip Mahasiswa](docs/images/mahasiswa-transkrip.png)

## Fitur Utama

- Login berdasarkan role admin, dosen, dan mahasiswa.
- Pengelolaan data departemen, mahasiswa, dosen, mata kuliah, kelas, jadwal kuliah, KRS, nilai, periode aktif, dan user.
- Filter data berdasarkan departemen, angkatan, periode, dan mata kuliah.
- Mahasiswa dapat melihat KRS, jadwal kuliah, riwayat studi, transkrip, IPS, dan IPK.
- Dosen dapat melihat mahasiswa wali, jadwal mengajar, KRS mahasiswa, dan menginput nilai.
- Admin memiliki akses penuh untuk mengelola seluruh data akademik.
- Perhitungan nilai akhir, huruf mutu, IPS, dan IPK mengikuti data akademik yang tersimpan di database.

## Tech Stack

- Frontend: Svelte, TypeScript, Vite
- Backend: Hono, Node.js, TypeScript
- Database: MySQL
- Package manager: pnpm / npm

## Struktur Project

```text
SIAKAD-Universitas-Cendekia/
├── client/             # Frontend Svelte
├── server/             # Backend Hono + MySQL
├── docs/images/        # Screenshot untuk README
├── package.json
└── README.md
```

## Menjalankan Project

### 1. Backend

```bash
cd server
npm install
npm run dev
```

Backend berjalan pada port yang dikonfigurasi di `server/src/index.ts`.

### 2. Frontend

```bash
cd client
npm install
npm run dev
```

Frontend akan berjalan melalui Vite, biasanya di:

```text
http://localhost:5173
```

## Environment Backend

Buat file `server/.env` untuk konfigurasi database lokal.

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=Universitas_Cendekia_dependago
DB_PORT=3306
```

> File `.env` tidak perlu dimasukkan ke Git karena berisi konfigurasi lokal.

## Anggota Kelompok

Kelompok 09

| No. | Nama | NRP |
|---:|---|---|
| 1 | Vinsen Dwi Putra | 5024241094 |
| 2 | Sarah Shafira Maulida | 5024241035 |
| 3 | Anisa Hasna Mufida | 5024241071 |
| 4 | Yoga Andreas Hutajulu | 5024241021 |

## Design Database

<img width="927" height="677" alt="Design Tabel" src="https://github.com/user-attachments/assets/96e1d9c7-8827-49db-b2c6-cc4207f154f5" />
