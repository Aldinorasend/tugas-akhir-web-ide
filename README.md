# Pathwise

Platform pembelajaran OOP (Java): dosen membuat study case berisi kunci UML,
mahasiswa mengerjakannya (diagram + kode Java) yang dinilai otomatis terhadap
kunci tersebut, lengkap eksperimen A/B scaffolding adaptif.

> **Dokumentasi lengkap ada di [`docs/`](docs/ARCHITECTURE.md)** — mulai dari
> `docs/ARCHITECTURE.md` (peta + keputusan arsitektur), lalu `docs/data-flow.md`
> dan `docs/business-rules.md`. Detail per modul ada di `docs/modules/`.

## Quick start

```bash
npm install            # sekali di root (npm workspaces, satu node_modules)
cp .env.example .env   # isi nilainya (panduan: docs/modules/env.md)
npm run dev            # client :3000 + server :4000 (concurrently)
```

Server siap saat `curl http://localhost:4000/ready` balik `200 "ready"`.

## Struktur singkat

- `packages/client` — Next.js (halaman mahasiswa & portal dosen)
- `packages/server` — Express 5 (REST API, mesin grading AST, health check)
- `docs/` — dokumentasi arsitektur, alur data, aturan bisnis, per modul

Catatan: aplikasi **tidak** meng-compile/menjalankan kode Java — penilaian
murni berbasis AST vs kunci UML (riwayat keputusan: `docs/ARCHITECTURE.md`).
