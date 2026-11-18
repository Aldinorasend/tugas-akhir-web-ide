# API — semua endpoint REST

> Base URL server: `http://localhost:4000` (`PORT` di root `.env`).
> Client memanggil lewat `packages/client/src/lib/api.tsx` (semua request
> memakai helper `apiFetch` — error selalu berupa pesan jelas, bukan SyntaxError).
> Logika di balik endpoint grading: `modules/grading.md`; aturan bisnis:
> `docs/business-rules.md`.

## Health (tanpa auth, di-mount root — `api/routes/healthRoutes.js`)

| Endpoint | Method | Fungsi |
|---|---|---|
| `/health` | GET | Liveness — selalu 200 selama proses hidup. Body: `{status, uptime_seconds, timestamp}` |
| `/ready` | GET | Readiness — cek env wajib (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `JWT_SECRET`) + probe REST Supabase (timeout 5s). 200 `{status:"ready", checks}` atau **503** `{status:"not_ready", checks:{env:{missing[]}, supabase:{error}}}` |

## Auth — `/api/auth` (`authController.js`, tanpa auth)

| Endpoint | Method | Payload | Response sukses |
|---|---|---|---|
| `/api/auth/register` | POST | `{nim_nip, password, full_name, role}` (`student`\|`lecturer`) | `{success:true}` — password di-hash bcrypt |
| `/api/auth/login` | POST | `{nim_nip, password}` | `{success:true, token, user}` — token JWT, disimpan client di localStorage |
| `/api/auth/login-nim` | POST | `{nim_nip, password}` | Sama seperti login (versi sederhana) |

Response gagal: `{success:false, message}` dengan status 4xx.

## Study cases — `/api/study-cases` (`studyCaseController.js`)

| Endpoint | Method | Fungsi |
|---|---|---|
| `/api/study-cases` | GET | Semua study case: `{data:[...]}` |
| `/api/study-cases/random` | GET | Satu study case acak (dipakai mahasiswa tanpa `?id=`) |
| `/api/study-cases/:id` | GET | Detail satu study case (termasuk `answer_key`) |
| `/api/study-cases` | POST | Buat (dosen): judul, deskripsi, files, answer_key |
| `/api/study-cases/:id` | PUT | Perbarui (dosen) |
| `/api/study-cases/:id` | DELETE | Hapus (dosen) |

> Catatan: endpoint CRUD saat ini tidak dijaga `authorizeRole` — dianggap
> internal/tugas-akhir. Endpoint berikut ini sudah dijaga.

## Grader — `/api/grader` (`graderRules.js`, wajib Bearer token)

| Endpoint | Method | Payload | Response |
|---|---|---|---|
| `/api/grader/grade-diagram` | POST | `{user_id(ignored), exerciseId, nodes, edges, diagramMetrics, experiment_group}` | `{isPassed, score, feedbacks}` |
| `/api/grader/compare-code` | POST | `{user_id(ignored), exerciseId, current_code:[{path,content}], codeMetrics, logic_rules, experiment_group}` | `{isPassed, score, feedbacks}` |

Kedua endpoint menutup dengan upsert metrik (`diagram_phase_metrics` /
`code_phase_metrics`) dan insert `scaffolding_logs` bila hint dipicu.
Header wajib: `Authorization: Bearer <token>` (`authenticateToken`).

## Dashboard dosen — `/api/lecturer/dashboard` (wajib Bearer + role lecturer)

| Endpoint | Method | Fungsi |
|---|---|---|
| `/api/lecturer/dashboard/data` | GET | Data agregat semua mahasiswa: identitas, per-exercise `{diagram, code, score, logs}`, `experiment_group`. Agregasi detail: `docs/data-flow.md` §3 |

## Middleware

- `authenticateToken` (`api/middleware/authMiddleware.js`) — verifikasi JWT,
  set `req.user = {id, role}`.
- `authorizeRole(["lecturer"])` — tolak 403 bila role tidak cocok.

## Konvensi error

Server mengembalikan **JSON** `{message}` untuk semua kegagalan. Client
(`apiFetch`) mem-parse aman dan menerjemahkan HTML/404/network-fail menjadi
pesan Indonesia yang menjelaskan langkah pemulihan.
