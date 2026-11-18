import express from 'express';

const router = express.Router();

/**
 * LIVENESS CHECK — GET /health
 * Menjawab: "apakah proses server masih hidup?"
 * Tidak menyentuh dependency apa pun, selalu 200 selama server bisa merespons.
 * Cocok untuk liveness probe (Kubernetes/Docker) & uptime monitor.
 */
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        uptime_seconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
    });
});

/**
 * READINESS CHECK — GET /ready
 * Menjawab: "apakah server SIAP melayani request?"
 * Memverifikasi seluruh dependency yang wajib:
 *   1. Env variables (SUPABASE_URL, SUPABASE_ANON_KEY, JWT_SECRET)
 *   2. Konektivitas ke Supabase (REST API)
 * 503 jika ada satu saja yang gagal, agar orchestrator menahan traffic.
 */
router.get('/ready', async (req, res) => {
    const checks = {
        env: { status: 'ok', missing: [] },
        supabase: { status: 'ok' },
    };
    let ready = true;

    // 1. Validasi env yang wajib terisi
    const requiredEnv = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'JWT_SECRET'];
    requiredEnv.forEach((key) => {
        if (!process.env[key]) {
            checks.env.missing.push(key);
        }
    });
    if (checks.env.missing.length > 0) {
        checks.env.status = 'fail';
        ready = false;
    }

    // 2. Cek konektivitas Supabase hanya jika env dasarnya lengkap
    if (ready) {
        try {
            const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
                headers: { apikey: process.env.SUPABASE_ANON_KEY },
                signal: AbortSignal.timeout(5000), // hard timeout 5 detik
            });
            if (response.ok) {
                checks.supabase.status = 'ok';
            } else {
                checks.supabase.status = 'fail';
                checks.supabase.error = `Supabase REST merespons HTTP ${response.status}`;
                ready = false;
            }
        } catch (err) {
            checks.supabase.status = 'fail';
            checks.supabase.error = err.name === 'TimeoutError' ? 'Koneksi ke Supabase timeout (5s)' : `Tidak bisa terhubung ke Supabase: ${err.message}`;
            ready = false;
        }
    }

    res.status(ready ? 200 : 503).json({
        status: ready ? 'ready' : 'not_ready',
        checks,
        timestamp: new Date().toISOString(),
    });
});

export default router;
