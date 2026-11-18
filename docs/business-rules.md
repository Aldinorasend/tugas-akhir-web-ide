# Aturan Bisnis Pathwise

> Dokumen ini mendefinisikan **aturan bisnis yang aktif saat ini** dan aturan
> yang **sudah disepakati tapi belum di-enforce di kode**. Aturan yang masih
> terbuka ditandai TODO(BUSINESS RULE) di kode sumber — ubah dokumen ini setiap
> kali aturan berubah, karena aturan adalah kontrak antara server, client, dan
> data.

Status yang dipakai di bawah:
- **AKTIF** — sudah berjalan dan di-enforce di kode.
- **TERBUKA** — disepakati/tanda tangan, tapi belum di-enforce; saat ini sistem
  tidak mencegah pelanggarannya.

---

## 1. Penilaian (grading)

### BR-1 · Kode dinilai terhadap kunci UML dosen — AKTIF
Kode Java mahasiswa tidak dieksekusi. `compareCodeWithLogic` (`core/ast-parser/
java-analyzer.js`) mem-parsing kode jadi AST, lalu membandingkan struktur
(kelas, atribut, method, modifier, relasi) dengan `logic_rules` dari study case.
Skor 100% = struktur persis sesuai kunci.

### BR-2 · Diagram dinilai terhadap `diagram_rules` — AKTIF
`gradeStudentDiagram` (`core/grader/graderService.js`) mengambil rule dari tabel
`diagram_rules` untuk `exercise_id` terkait, lalu `compareDiagrams`
(`core/grader/ruleEngine.js`) memberi skor granular (kelas, atribut, method,
relasi). Jika rule kosong → skor 0 + pesan "kunci belum dikonfigurasi".

### BR-3 · `logic_rules` berformat Prolog-style, dipakai sebagai string per baris — AKTIF
Contoh rule yang dihasilkan `transformDiagramToLogic`:
```
class(Mobil).
attribute(Mobil, mesin, String, private).
method(Mobil, jalan, void, public).
```
`compareCodeWithLogic` menerima rules sebagai string (dipisah baris) atau array.
Bentuk rule inilah "bahasa kontrak" antara generator kunci (dosen) dan pemeriksa
(AST). **Jangan ubah formatnya tanpa mengubah kedua sisi.**

### BR-4 · Kegagalan tidak memberi skor 0 langsung; umpan balik granular — AKTIF
Baik `compareDiagrams` maupun `compareCodeWithLogic` mengembalikan skor
parsial + daftar ketidaksesuaian (dipakai sebagai bahan hint scaffolding).

---

## 2. Eksperimen A/B (scaffolding)

### BR-5 · Dua kelompok: EXPERIMENTAL dan CONTROL — AKTIF
`experiment_group` tersimpan pada baris metrik (`diagram_phase_metrics`,
`code_phase_metrics`) dan dikirim client dari halaman mode (`/student/
scaffolding` = EXPERIMENTAL, `/student/non-scaffolding` = CONTROL).

### BR-6 · Hint scaffolding hanya untuk EXPERIMENTAL — AKTIF
`evaluateDiagramScaffolding` / `evaluateCodeScaffolding`
(`core/scaffolding/`) menentukan level hint (L1/L2/L3) berdasarkan skor,
kategori kognitif, dan pola frustrasi. Setiap hint yang muncul dicatat ke
`scaffolding_logs` (append-only). Mahasiswa CONTROL tidak menerima hint.

### BR-7 · Kategori kognitif ditentukan dari perilaku, bukan input manual — AKTIF
`detected_category` (MOVERS / TINKERERS / STOPPERS) dihitung dari metrik
(kecepatan submit, frustrasi, churn, hesitation) oleh scaffolding engine.
Nilainya tertulis di baris metrik dan ditampilkan di dashboard dosen.

---

## 3. Pengerjaan & data mahasiswa

### BR-8 · Satu mahasiswa = satu pengerjaan per study case — TERBUKA (TODO di kode)
Keputusan bisnis: seorang mahasiswa hanya boleh punya satu pengerjaan untuk
satu study case (jawaban/attempt tidak dibuat ganda per soal).
**Status implementasi:** upsert kumulatif di
`diagramController.gradeAndLogDiagram` dan `codeController.gradeAndCompareCode`
menimpa baris `(user_id, exercise_id)` yang sama sehingga *metrik* tidak
duplikat — tetapi **tidak ada guard** yang mencegah mahasiswa memulai
pengerjaan study case kedua secara bebas (tidak ada tabel assignment, dan
`exerciseId` datang dari client). TODO(BUSINESS RULE) tertanam di kedua
controller. Jika aturan berubah (mis. attempt final tunggal, limit jumlah
attempt, atau mahasiswa wajib di-assign), guard ditambahkan di titik yang
sudah ditandai, SEBELUM upsert.

### BR-9 · Identitas mahasiswa dari JWT, bukan body request — AKTIF
`user_id` selalu diambil dari token (`req.user.id`) di kedua controller grader;
kolom `user_id` yang dikirim client **diabaikan**. Jangan pernah mempercayai
identitas dari body.

### BR-10 · Metrik kognitif dikirim client lalu server menimpa (upsert) — AKTIF
Client menghitung metrik sesi (waktu, keystroke, idle, submit, frustrasi, dll.)
dan mengirimkannya utuh; server menimpa baris metrik dengan payload terakhir.
Konsekuensi (terdokumentasi, diterima): metrik bisa dimanipulasi client karena
tidak ada verifikasi server-side. Jika risiko ini perlu ditutup, akumulasi
harus dipindah ke server.

### BR-11 · `logic_rules` untuk grading kode dikirim dari client — TERBUKA (TODO di kode)
Saat ini `codeController` memakai `logic_rules` dari body request (yang client
ambil dari `answer_key` study case). Untuk diagram, server sudah memuat
`diagram_rules` sendiri dari DB. Jika aturan keamanan diperketat, server
sebaiknya memuat `logic_rules` dari DB sendiri (tabel `diagram_rules` sudah
menyimpan `logic_rules`) dan mengabaikan yang dikirim client.

---

## 4. Akses & role

### BR-12 · Dua role: `student` dan `lecturer` — AKTIF
Role tersimpan di `profiles.role` saat register. Middleware `authorizeRole`
menjaga endpoint dosen (dashboard). Endpoint grading menerima keduanya
(mahasiswa yang menilai; dosen tidak ditolak).

### BR-13 · Redirect setelah login mengikuti role — AKTIF
Login/register selalu menuju `/student/select`; halaman itu mendeteksi role:
dosen melihat portal 2 card (Uji Coba Study Case + Dashboard Dosen),
mahasiswa melihat pemilihan kelompok eksperimen. Halaman `/lecturer/*`
ditolak (screen "Akses Ditolak") untuk akun student.

---

## 5. Kesehatan sistem

### BR-14 · `/ready` adalah syarat traffic — AKTIF
Readiness (`GET /ready`) menuntut semua env wajib terisi + Supabase terjangkau;
gagal satu saja → 503. Liveness (`GET /health`) hanya memastikan proses hidup.
Konvensi orchestrator: tarik traffic hanya saat `/ready` 200.

---

## Checklist saat aturan berubah

1. Perbarui dokumen ini (status + penjelasan).
2. Cari penanda `TODO(BUSINESS RULE)` di `diagramController.js` /
   `codeController.js` — tempat guard seharusnya berada.
3. Perbarui `docs/data-flow.md` bila alur data ikut berubah.
4. Perbarui `docs/modules/grading.md` bila format `logic_rules` berubah
   (BR-3) — client *dan* generator kunci harus diubah bersamaan.
