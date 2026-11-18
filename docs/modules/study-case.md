# Study Case — struktur & alur dosen

> Endpoint CRUD: `modules/api.md`. Menu gabungan dosen: `modules/client-pages.md`.
> Aturan grading yang bergantung pada data ini: `modules/grading.md`.

## Apa itu study case

Satu "soal" lengkap yang dibuat dosen: deskripsi kasus, starter code Java
(file tree), dan **kunci jawaban** berupa diagram UML yang otomatis ditransform
menjadi aturan penilaian.

## Struktur data

Tabel `study_cases` (kolom utama):
`id`, `title`, `description`, `files` (file tree JSON), `answer_key`,
`created_at`.

Tabel `diagram_rules` (ground truth grading, dibuat bersama study case):
`exercise_id`, `nodes` (kelas/interface/abstract + atribut + method),
`edges` (relasi), `logic_rules` (hasil `transformDiagramToLogic`, format
Prolog — contoh di `modules/grading.md` §1).

Hubungan: `answer_key.exercise_id` pada study case mengacu ke
`diagram_rules.exercise_id`. Endpoint grader menerima `exerciseId` dari client
dan mencocokkannya ke sana (status guard: BR-8, BR-11).

## Alur dosen (kini satu menu)

```
Sidebar dosen
└── 📖 Study Case  (/lecturer)          ← satu-satunya pintu
    ├── [Buat Study Case]   → /lecturer/new
    ├── klik baris (view)   → panel kanan: judul, deskripsi,
    │                          DiagramPreview (kunci jawaban)
    ├── ikon pensil (edit)  → /lecturer/edit/:id
    └── ikon sampah (hapus) → modal konfirmasi "Ya, hapus"
```

- **Create** (`/lecturer/new`): dosen menyusun file Java di `ProjectExplorer` +
  `JavaEditor` (Monaco), menggambar diagram kunci, lalu Publish →
  `createStudyCase` yang menjalankan `transformDiagramToLogic` dan menyimpan
  `study_cases` + `diagram_rules`.
- **Edit** (`/lecturer/edit/[id]`): memuat data existing ke workspace yang
  sama, menyimpan via `updateStudyCase`.
- **Delete**: dialog konfirmasi (`alertdialog` ber-aria) sebelum
  `deleteStudyCase`.
- **View**: klik baris di panel kiri menampilkan detail + preview kunci
  (reactflow `DiagramPreview`).

Nav terpisah "New Case" sudah dihapus — semua aksi bermuara ke menu Study Case
(navigasi aktif mengikuti `/lecturer`, `/lecturer/new`, `/lecturer/edit/*`).

## Sisi mahasiswa

Mahasiswa memuat study case lewat `getStudyCaseById` atau `getRandomStudyCase`
(query param `?id=` di URL workspace; kalau kosong → random lalu id ditulis ke
URL). Isi `answer_key` inilah yang menyediakan `exerciseId` dan `logic_rules`
yang dikirim ke endpoint grader.
