# Modul Grading — mesin penilaian otomatis

> Inti produk. Kode dan diagram mahasiswa **dinilai, bukan dijalankan**
> (BR-1, BR-2). Semua aturan bisnis di balik file ini: `docs/business-rules.md`.

## Gambaran

Dua mesin penilaian yang paralel:

| Fase | Kunci (ground truth) | Mesin | Entry point server |
|---|---|---|---|
| Desain diagram | Tabel `diagram_rules` (nodes, edges, logic_rules) | `core/grader/ruleEngine.js` | `gradeAndLogDiagram` di `api/controllers/diagramController.js` |
| Implementasi kode | `logic_rules` (Prolog-style) | `core/ast-parser/java-analyzer.js` | `gradeAndCompareCode` di `api/controllers/codeController.js` |

## 1. `services/transformerService.js` — UML → logic rules

`transformDiagramToLogic(nodes, edges)` mengubah diagram kunci dosen menjadi
daftar fakta berformat Prolog (BR-3):

```
class(Mobil).
abstract_class(Kendaraan).
interface(Comparable).
attribute(Mobil, mesin, String, private).
method(Mobil, jalan, void, public).
interface_impl(Mobil, Comparable).
extends(Mobil, Kendaraan).
```

- Modifier akses dipetakan dari simbol UML: `+` → `public`, selain itu `private`.
- Aturan ini disimpan di `diagram_rules.logic_rules` bersama nodes/edges mentah,
  dan inilah "bahasa kontrak" antara generator kunci dan pemeriksa.

## 2. `core/grader/ruleEngine.js` — penilaian diagram

`compareDiagrams(studentNodes, studentEdges, rules)`:

- Membangun map ID→nama (case-insensitive) dari rule dan jawaban mahasiswa,
  sehingga ID reactflow yang berbeda tidak mempengaruhi penilaian.
- Memberi skor granular: kelas/interface/abstract, atribut (nama, tipe,
  modifier), method (nama, return type, modifier), dan relasi antar kelas.
- Return: `{ finalGrade, feedbacks[], isPassed }`. Feedbacks dipakai sebagai
  bahan hint scaffolding L1/L2 (BR-6).
- Rule kosong → skor 0 + pesan "kunci belum dikonfigurasi" (BR-2).

`core/grader/graderService.js` (`gradeStudentDiagram`) adalah pembungkus yang
memuat rule dari `diagram_rules` berdasar `exercise_id`, memanggil
`compareDiagrams`, lalu mengembalikan format seragam
`{ isCorrect, score, hints, timeToResolution }`.

## 3. `core/ast-parser/java-analyzer.js` — penilaian kode

`compareCodeWithLogic(fileArray, logicRulesRaw)`:

1. **Validasi input** — `fileArray` harus array `{path, content}`;
   `logicRulesRaw` bisa string per baris atau array (BR-3).
2. **Parsing AST** — setiap file `.java` di-parse dengan library `java-parser`
   (Chevrotain). Kode dengan syntax error ditandai, bukan crash.
3. **Ekstraksi struktur** — kelas/interface/abstract, atribut, method, modifier
   akses, dan relasi dari tiap file.
4. **Perbandingan vs logic rules** — struktur mahasiswa dicocokkan dengan fakta
   Prolog dari kunci; ketidaksesuaian dikumpulkan per item.
5. **Return** — skor + daftar ketidaksesuaian.

Alur pemanggilan lengkap: `docs/data-flow.md` §1.

## 4. Metrik kognitif (dikirim client, disimpan server)

Baris metrik menyimpan perilaku sesi mahasiswa (BR-10):

| Kolom (kedua tabel metrik) | Arti |
|---|---|
| `time_spent_ms`, `idle_time_ms`, `max_single_idle_ms` | Waktu aktif & idle terpanjang |
| `submit_count`, `mismatch_attempts` | Frekuensi submit & jumlah gagal |
| `hesitation_ratio`, `churn_ratio`, `submit_velocity` | Pola kecepatan & perubahan |
| `frustration_index` (0–1 server / 0–100 di UI) | Indikator frustrasi, diturunkan dari pola |
| `detected_category` | MOVERS / TINKERERS / STOPPERS (BR-7) |
| `is_passed` | Lolos kunci atau tidak |
| `experiment_group` | EXPERIMENTAL / CONTROL (BR-5) |

Khusus tabel `code_phase_metrics` tambah: `keystroke_count`, `lines_of_code`,
`run_count` (sisa fitur run lama, ada fallback `|| 0`), `syntax_error_count`,
`logical_error_count`.

**Penting:** nilai-nilai ini dihitung client dan dikirim utuh per submit;
server menimpa baris dengan payload terakhir — bukan akumulasi server-side.

## 5. Scaffolding (`core/scaffolding/`)

- `evaluateDiagramScaffolding(graderResults, diagramMetrics)` dan
  `evaluateCodeScaffolding(...)` menentukan **level hint** (L1/L2/L3) berdasar
  skor, kategori kognitif, dan pola frustrasi — hanya untuk kelompok
  EXPERIMENTAL (BR-6).
- Setiap hint yang muncul dicatat di `scaffolding_logs`:
  `scaffolding_level`, `trigger_phase` (DIagram/CODE_DEBUGGING),
  `trigger_reason`, `hint_message`, `current_score` — append-only, menjadi
  riwayat intervensi yang ditampilkan di dashboard dosen.

## 6. Penyimpanan

Kedua controller menutup dengan **atomic upsert** memakai composite key
`(user_id, exercise_id)`:
- `diagramController.js` → tabel `diagram_phase_metrics`
- `codeController.js` → tabel `code_phase_metrics`

Efeknya: satu baris metrik per pasangan mahasiswa×study case, selalu
termutakhirkan. TODO(BUSINESS RULE) "1 mahasiswa = 1 pengerjaan" (BR-8)
tertanam tepat sebelum upsert di kedua controller — letak guard masa depan.
