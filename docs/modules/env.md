# Env — konfigurasi monorepo

> Prinsip: **satu file `.env` di root**, dipakai server dan client.
> Diagram alur: `docs/data-flow.md` §4.

## Kenapa satu file di root

Monorepo dua package; menjaga dua set env terpisah pernah membuat key hilang
salingan (REDIS_* hanya server, NEXT_PUBLIC_* hanya client). Sekarang:

- **Server** — `packages/server/src/config/env.js` menemukan root `.env`
  dengan naik **4 level** dari `packages/server/src` ke repo root, lalu
  `dotenv.config()` dari sana. File ini **wajib diimpor paling atas** di
  `app.js` (dan `supabase.js`) sebelum kode lain membaca `process.env`.
- **Client** — Next.js hanya membaca `.env*` dari direktori project-nya
  sendiri, jadi `packages/client/next.config.ts` memuat root `.env` manual
  via `process.loadEnvFile(path.resolve(process.cwd(), "../../.env"))`
  (Node ≥ 20.12; project berjalan di Node 22).
  - `loadEnvFile` **tidak menimpa** variabel yang sudah ada (semantik dotenv).
  - Jika root `.env` belum ada → `try/catch` diam; Next tetap membaca
    `.env.local` milik `packages/client` sebagai fallback.

## Daftar key (lihat `.env.example`)

| Key | Dipakai | Arti |
|---|---|---|
| `PORT` | server | Port Express (default dev 4000) |
| `NODE_ENV` | server | `development` = app listen; selain itu tidak listen (untuk deploy di balik platform) |
| `JWT_SECRET` | server | Tanda tangan JWT. **Wajib.** Generator: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` — catatan: fallback hardcoded masih ada (lihat `modules/auth.md`) |
| `SUPABASE_URL` | server | Project URL Supabase (server-side, boleh key `sb_secret_`) |
| `SUPABASE_ANON_KEY` | server | Key server-side |
| `NEXT_PUBLIC_SUPABASE_URL` | client | Sama dengan `SUPABASE_URL` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client | **Harus key publishable (`sb_publishable_...`), BUKAN `sb_secret_`** — var ber-prefix `NEXT_PUBLIC_` ter-inline ke bundle browser, bisa dibaca siapa pun |
| `NEXT_PUBLIC_API_URL` | client | Base URL API (default `http://localhost:4000`) |

## Supabase: dua key, satu project

Server dan browser memakai project yang sama. Duplikasi key sebagai
`NEXT_PUBLIC_*` disengaja: Next.js hanya meng-inline var dengan prefix itu ke
bundle browser. Jangan pernah menaruh `sb_secret_` pada var `NEXT_PUBLIC_*`.

## Git

`.gitignore` menutup `.env*` **kecuali** `.env.example` (pola `!.env.example`).
`.env` berisi secret — tidak pernah masuk repo.
