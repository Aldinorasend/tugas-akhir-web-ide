# Client Pages — peta halaman Next.js

> Semua halaman `"use client"` (App Router). Panggilan API terpusat di
> `lib/api.tsx` (`apiFetch` — error selalu pesan jelas). State Supabase
> browser di `lib/supabase.tsx` (env `NEXT_PUBLIC_*`).

## Publik

| Route | File | Fungsi |
|---|---|---|
| `/` | `app/page.tsx` | Landing sederhana → link ke login |
| `/login` | `app/login/page.tsx` | Login NIM/NIP + password. Sukses: simpan `token`+`user` di localStorage → `/student/select`. Sudah login → redirect ke sana |
| `/register` | `app/register/page.tsx` | Registrasi (NIM/NIP, nama, password, role). Sukses → login |

## Mahasiswa

| Route | File | Fungsi |
|---|---|---|
| `/student/select` | `app/student/select/page.tsx` | **Halaman setelah login, membedakan role.** Dosen → 2 card: "Uji Coba Study Case" (`/student/scaffolding`) dan "Dashboard Dosen" (`/lecturer/dashboard`). Mahasiswa → 2 card kelompok: "Adaptive Scaffolding" (eksperimen) dan "Non-Scaffolding" (kontrol) |
| `/student/scaffolding` | `app/student/scaffolding/page.tsx` | Workspace mode eksperimen (EXPERIMENTAL) — dibungkus scaffolding adaptif (hint L1/L2/L3) |
| `/student/non-scaffolding` | `app/student/non-scaffolding/page.tsx` | Workspace mode kontrol (CONTROL) — tanpa hint |
| `/student/ide` | `app/student/ide/page.tsx` | Workspace editor mandiri (memuat study case via `?id=`). Tidak memanggil grader |

Halaman mahasiswa memakai komponen bersama `StudentDiagramPage.tsx`
(`app/student/`) — kerangka dua fase (tab Diagram → Kode), metrik sesi, dan
pemanggilan `graderDiagram` / `compareCode`.

## Dosen (semua di bawah `lecturer/layout.tsx` — guard role + sidebar)

| Route | File | Fungsi |
|---|---|---|
| `/lecturer` | `app/lecturer/page.tsx` | **Menu Study Case** — satu pintu untuk Buat (tombol header → `/lecturer/new`), Lihat (klik baris → panel detail + DiagramPreview), Edit (ikon → `/lecturer/edit/:id`), Hapus (ikon → modal konfirmasi) |
| `/lecturer/new` | `app/lecturer/new/page.tsx` | Buat study case: file tree + Monaco + diagram kunci → Publish |
| `/lecturer/edit/[id]` | `app/lecturer/edit/[id]/page.tsx` | Edit study case existing |
| `/lecturer/dashboard` | `app/lecturer/dashboard/page.tsx` | Dashboard monitoring: tab Eksperimen/Kontrol, statistik kelompok, tabel mahasiswa, panel detail per exercise (fase diagram, fase kode, riwayat scaffolding) |
| `/lecturer/project-config` | `app/lecturer/project-config/page.tsx` | Konfigurasi workspace mandiri (mode new/edit, simpan langsung via supabase client) |

Sidebar dosen hanya dua item: **Study Case** (aktif juga di `/lecturer/new`
dan `/lecturer/edit/*`) dan **Student Progress** (`/lecturer/dashboard`).

## Komponen penting

| Komponen | Fungsi |
|---|---|
| `components/JavaEditor.tsx` | Monaco editor (header nama file + editor). Prop: `code`, `fileName`, `onCodeChange` — **tanpa onRun** (fitur run dihapus) |
| `components/ProjectExplorer.tsx` | File tree (add/rename/delete file & folder) |
| `components/diagram/DiagramPreview.tsx` | Render read-only kunci jawaban (panel view dosen) |
| `hooks/useWorkspace.tsx` | State file tree: `nodes`, `selectedId`, `flattenFiles`, handler CRUD file |

## Aturan umum UI

- Konsistensi desain mengikuti dashboard (mode Operate): teks sekunder
  `slate-400`, angka `tabular-nums`, tanpa badge berlebihan, kontrol punya
  `focus-visible` ring. Gunakan skill **impeccable** (`.opencode/skills/`)
  saat mengubah UI — detector-nya memblok pola AI-slop (side-tab stripe,
  animate-bounce, eyebrow badge, dll.).
