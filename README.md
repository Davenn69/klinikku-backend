# Backend Kehamilan Kesehatan

Backend ini adalah REST API berbasis **Node.js + Express + TypeScript** dengan **PostgreSQL** dan **Drizzle ORM**. Project ini menangani autentikasi, data wilayah, dokter, slot janji temu, encounter, dan dashboard.

# Link Postman Documentation

https://solar-satellite-704249.postman.co/workspace/Klinikku~c495fe7f-0892-4dc1-9dbb-80378d15ddc3/collection/47298475-89281a86-a8c8-4655-a129-caf6937a2f8d?action=share&creator=47298475

## Arsitektur

Project ini menggunakan **controller-based API architecture**. Artinya, aplikasi dibangun dengan alur request yang jelas: route menerima endpoint, controller/handler memproses logika request, lalu database diakses untuk mengambil atau menyimpan data.

Pola ini cocok untuk backend REST API karena fokus utamanya adalah memproses request dan mengembalikan response JSON, bukan menampilkan UI.

Struktur aplikasi dibagi menjadi beberapa layer agar mudah dirawat:

- `src/index.ts` adalah entry point aplikasi.
- `src/app.ts` berisi konfigurasi Express, middleware global, dan routing utama.
- `src/routes/` berisi definisi endpoint per fitur.
- `src/handlers/` berisi controller/handler yang menangani validasi input, logika bisnis sederhana, dan query database.
- `src/middlewares/` berisi middleware seperti autentikasi dan error handling.
- `src/db/` berisi koneksi database, schema Drizzle, dan data seed.
- `drizzle/` berisi file migration SQL dan metadata migrasi.

Alur sederhananya:

`Request -> Route -> Handler -> Database/Service -> Response`

Kalau dilihat dari peran file-nya:

- `Route` bertugas menentukan endpoint mana yang dipanggil.
- `Handler` bertugas memproses request, mengambil data dari database, lalu membentuk response.
- `Database layer` berisi schema dan koneksi PostgreSQL melalui Drizzle.

Contoh alurnya:

1. Client memanggil endpoint seperti `POST /auth/login`.
2. Route meneruskan request ke handler yang sesuai.
3. Handler melakukan validasi input dan query ke database.
4. Handler mengembalikan response JSON ke client.

Beberapa route dilindungi middleware `protect`, jadi hanya user yang sudah login dan punya token valid yang bisa mengaksesnya.

## Teknologi

- Node.js
- Express
- TypeScript
- PostgreSQL
- Drizzle ORM
- dotenv

## Database

Project ini menggunakan **PostgreSQL**, jadi jenis databasenya adalah **SQL**.

Alasan pemilihannya:

- Data pada project ini saling berelasi, misalnya `users`, `doctors`, `regions`, `appointment_slots`, dan `encounters`.
- Relasi antar tabel lebih mudah dijaga dengan foreign key, constraint, dan migration yang terstruktur.
- PostgreSQL cocok untuk data yang butuh konsistensi tinggi, seperti jadwal booking dan status encounter.
- Query SQL sangat pas untuk kebutuhan filtering, join, agregasi, dan reporting dashboard.
- Dengan schema yang jelas, validasi struktur data jadi lebih kuat dan lebih aman untuk aplikasi klinik.

Kalau dibandingkan dengan NoSQL:

- NoSQL lebih fleksibel untuk data yang bentuknya sangat bebas atau berubah-ubah.
- Namun, untuk project ini, struktur datanya cukup jelas dan saling terhubung, jadi pendekatan SQL lebih tepat.
- Karena itu PostgreSQL dipilih agar integritas data lebih terjaga dan query relasional lebih mudah dikelola.

## Endpoint Utama

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `GET /regions`
- `GET /doctors`
- `GET /appointment-slots`
- `GET /encounters`
- `POST /encounters`
- `GET /encounters/:id`
- `DELETE /encounters/:id`
- `GET /dashboard`

## Kebutuhan

- Node.js versi modern
- PostgreSQL
- `npm`

## Konfigurasi Environment

Buat file `.env` di root project, lalu isi minimal:

```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/nama_database
JWT_SECRET=secret_yang_kuat
```

Catatan:

- `DATABASE_URL` dipakai oleh koneksi database dan Drizzle.
- `JWT_SECRET` dipakai untuk sign dan verifikasi token.
- `PORT` dipakai saat server dijalankan.

## Setup Project

1. Install dependency:

```bash
npm install
```

2. Siapkan database PostgreSQL dan pastikan `DATABASE_URL` sudah benar.

3. Jalankan migration database:
   - Import file SQL berikut ke database secara berurutan:
     - `drizzle/0000_foamy_mojo.sql`
     - `drizzle/0001_triggers.sql`

   Jika kamu memakai client PostgreSQL seperti `psql` atau GUI database, cukup jalankan file SQL tersebut ke database yang sama.

4. Jalankan seed data:

```bash
npm run seed
```

Seed akan mengisi data contoh untuk:

- region
- user
- doctor
- appointment slot
- encounter

## Cara Menjalankan

### Mode Development

```bash
npm run dev
```

Mode ini memakai `nodemon` dan menjalankan `src/index.ts` lewat `ts-node`.

### Mode Production

1. Build project:

```bash
npm run build
```

2. Jalankan hasil build:

```bash
npm start
```

## Script yang Tersedia

- `npm run dev` - menjalankan server dalam mode development
- `npm run build` - compile TypeScript ke folder `dist`
- `npm start` - menjalankan hasil build dari `dist/index.js`
- `npm run seed` - build project lalu menjalankan seed data

## Default Seed Login

File seed membuat data demo dan menggunakan password default:

```text
password123
```

## Catatan Penting

- Pastikan `DATABASE_URL` dan `JWT_SECRET` sudah terisi sebelum menjalankan server.
- Route selain `/auth` dilindungi middleware autentikasi.
- Migrasi dan seed dibuat agar database bisa langsung dipakai untuk development.
