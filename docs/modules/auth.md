# Auth — JWT, role, dan keamanan

> Alur visual: `docs/data-flow.md` §5. Endpoint: `modules/api.md`.

## Mekanisme

- **Bukan Supabase Auth.** Login/register dikelola sendiri oleh Express
  (`api/controllers/authController.js`) terhadap tabel `profiles`.
- **Password** di-hash `bcryptjs` saat register; login memakai `bcrypt.compare`.
- **Token** = JWT ditandatangani `jsonwebtoken`, berisi identitas `{id, role}`.
  Client menyimpan `token` dan `user` di `localStorage`
  (`login/page.tsx`, `register/page.tsx`).
- **Verifikasi per request** — middleware `authenticateToken`
  (`api/middleware/authMiddleware.js`) membaca header
  `Authorization: Bearer <token>` dan set `req.user = {id, role}`.
  Controller grader mengambil `user_id` **dari `req.user.id`**, bukan body
  (BR-9).
- **Role guard** — `authorizeRole(["lecturer"])` menjaga endpoint dosen
  (dashboard). Halaman `/lecturer/*` di client juga dijaga ganda oleh
  `lecturer/layout.tsx` (cek role di localStorage, screen "Akses Ditolak").
- **Redirect setelah login** — selalu ke `/student/select`, yang mendeteksi
  role dan menampilkan portal dosen atau pemilihan kelompok mahasiswa (BR-13).

## Utang keamanan yang diketahui (jangan hilang saat refactor)

| # | Isu | Lokasi | Status |
|---|---|---|---|
| 1 | **Fallback `JWT_SECRET` hardcoded** (`"pathwise-secret-key-2026"`). Kalau env tidak terisi, server tetap berjalan dengan secret lemah yang bisa ditebak siapa pun. | `authController.js`, `authMiddleware.js` | Masih ada. Rekomendasi: fail-fast — lempar error saat startup jika `JWT_SECRET` kosong (`/ready` sudah menandainya) |
| 2 | **CRUD study case tidak dijaga role** | `studyCaseRoutes.js` | Siapa pun dengan endpoint bisa tulis/hapus study case. Ditoleransi untuk internal/tugas-akhir |
| 3 | **Metrik & logic_rules dikirim client** | `codeController.js` (BR-10, BR-11) | Bisa dimanipulasi client; TODO(BUSINESS RULE) tertanam |
| 4 | **Token di localStorage** | client | Rentan XSS standar; dipilih demi kesederhanaan tugas akhir |

## Naik ke produksi — minimal yang harus berubah

1. Fail-fast `JWT_SECRET` (item 1) + rotate secret terdaftar.
2. `authorizeRole` untuk POST/PUT/DELETE study case (item 2).
3. Guard attempt/assignment mahasiswa↔study case (BR-8, BR-11 — letak sudah
   ditandai di kedua controller grader).
4. `.env` dengan `NODE_ENV=production` (server hanya listen di development —
   lihat `modules/env.md`).
