# Alur Data Pathwise

> Ilustrasi alur data yang berjalan saat ini. Nama fungsi di bawah adalah nama
> persis di kode. Aturan bisnis yang mendasar tiap alur ada di
> `docs/business-rules.md` (dirujuk sebagai BR-x).

## 1. Alur pengerjaan mahasiswa (alur utama)

Satu study case, dua fase berurutan: **desain diagram** → **implementasi kode**.

```mermaid
sequenceDiagram
    autonumber
    participant M as Mahasiswa (browser)
    participant API as Express server :4000
    participant SB as Supabase

    Note over M: FASE 1 — Desain Diagram
    M->>API: GET /api/study-cases/:id (atau /random)
    API->>SB: SELECT study_cases (+ diagram_rules via answer_key)
    API-->>M: study case (judul, deskripsi, answer_key)
    M->>M: Menggambar diagram UML (reactflow)<br/>metrik sesi terkumpul (aksi, idle, churn...)
    M->>API: POST /api/grader/grade-diagram<br/>{exerciseId, nodes, edges, diagramMetrics, experiment_group}
    API->>SB: SELECT diagram_rules WHERE exercise_id (kunci)
    API->>API: gradeStudentDiagram() → ruleEngine.compareDiagrams()
    API->>API: evaluateDiagramScaffolding() → level hint (hanya EXPERIMENTAL)
    API->>SB: UPSERT diagram_phase_metrics (kunci user_id+exercise_id)
    API->>SB: INSERT scaffolding_logs (jika hint dipicu)
    API-->>M: {isPassed, score, feedbacks}

    Note over M: FASE 2 — Implementasi Kode
    M->>M: Menulis Java di Monaco (useWorkspace)
    M->>M: flattenFiles() → [{path, content}, ...]
    M->>API: POST /api/grader/compare-code<br/>{exerciseId, current_code, codeMetrics, logic_rules, experiment_group}
    API->>API: compareCodeWithLogic() → AST java-parser vs logic_rules
    API->>API: evaluateCodeScaffolding() → level hint (hanya EXPERIMENTAL)
    API->>SB: UPSERT code_phase_metrics (kunci user_id+exercise_id)
    API->>SB: INSERT scaffolding_logs (jika hint dipicu)
    API-->>M: {isPassed, score, feedbacks}
```

Poin penting di alur ini:
- `user_id` **selalu** dari JWT (BR-9); `exerciseId`/`logic_rules` datang dari
  client (status terbuka: BR-8, BR-11).
- Fase 2 bisa diulang beberapa kali submit; tiap submit **menimpa** baris
  metrik yang sama, bukan membuat baris baru (BR-10).
- `scaffolding_logs` bersifat **append-only** — riwayat intervensi, tidak pernah
  ditimpa.

## 2. Alur dosen membuat study case

```mermaid
flowchart TD
    A["Dosen buka /lecturer (menu Study Case)"] -->|"Buat Study Case"| B["/lecturer/new<br/>susun file Java + gambar diagram kunci"]
    B --> C["transformDiagramToLogic()<br/>services/transformerService.js"]
    C -->|"class(Mobil). method(Mobil, jalan, void, public)."| D["studyCaseController.createStudyCase()"]
    D --> E[("Supabase<br/>study_cases: judul, deskripsi, files<br/>diagram_rules: nodes, edges, logic_rules")]
    B -->|"Edit existing"| F["/lecturer/edit/:id → updateStudyCase()"]
    A -->|"Hapus"| G["deleteStudyCase()"]
    A -->|"Lihat"| H["Panel detail + DiagramPreview<br/>(render kunci jawaban)"]
```

Semua CRUD study case dikelola dari **satu menu Study Case** di sidebar dosen
(lihat `modules/client-pages.md`).

## 3. Alur data dashboard dosen

```mermaid
flowchart LR
    subgraph Server["lecturerDashboardController.getLecturerDashboardData()"]
        Q1["SELECT profiles<br/>role = student"] --> AG
        Q2["SELECT diagram_phase_metrics"] --> AG
        Q3["SELECT code_phase_metrics"] --> AG
        Q4["SELECT scaffolding_logs"] --> AG
        AG["Agregasi in-memory:<br/>dedup exercise via Set;<br/>bentuk array student.exercises"]
    end
    subgraph DB[("Supabase")]
        T1[(profiles)]
        T2[(diagram_phase_metrics)]
        T3[(code_phase_metrics)]
        T4[(scaffolding_logs)]
    end
    T1 --> Q1
    T2 --> Q2
    T3 --> Q3
    T4 --> Q4
    AG --> UI["GET /api/lecturer/dashboard/data<br/>Dashboard :4000 tabel mahasiswa + panel detail"]
```

Agregasi yang dilakukan server (dipahami client apa adanya):
- `attemptedExerciseIds` di-dedup via `Set` — satu exercise selalu muncul
  sekali per mahasiswa meski ada banyak log.
- `latestScore` diambil dari `scaffolding_logs` terbaru per exercise — yaitu
  **skor saat log terakhir**, bukan skor terbaik (perilaku aktif, bukan bug).
- `experiment_group` student diambil dari baris metrik pertama yang ditemukan.

## 4. Alur env (konfigurasi)

```mermaid
flowchart TD
    ENV[(".env di ROOT monorepo")] -->|diimpor paling atas| S1["server: config/env.js<br/>(resolve 4 level ke atas)"]
    S1 -->|"process.env.*"| S2["app.js + supabase.js"]
    ENV -->|process.loadEnvFile| C1["client: next.config.ts<br/>(cwd = packages/client, ../../.env)"]
    C1 -->|"hanya var NEXT_PUBLIC_* yang<br/>ter-inline ke bundle browser"| C2["lib/supabase.tsx"]
```

Detail key & aturan: `modules/env.md`.

## 5. Alur autentikasi

```mermaid
sequenceDiagram
    participant C as Client
    participant API as Express server
    participant SB as Supabase

    C->>API: POST /api/auth/register {nim_nip, password, full_name, role}
    API->>SB: INSERT profiles (password di-hash bcrypt)
    C->>API: POST /api/auth/login {nim_nip, password}
    API->>SB: SELECT profiles WHERE nim_nip
    API->>API: bcrypt.compare → sign JWT
    API-->>C: {success, token, user}
    C->>C: simpan token + user di localStorage
    Note over C: Setiap request selanjutnya:<br/>Authorization: Bearer <token><br/>(authenticateToken → req.user.id)
```

Detail + utang keamanan yang diketahui: `modules/auth.md`.
