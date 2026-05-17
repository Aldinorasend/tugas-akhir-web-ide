const detectCodeCategory = (metrics) => {
    const timeSpent = metrics.temporal?.time_spent_ms || 0;
    const idleTime = metrics.temporal?.idle_time_ms || 0;
    const maxSingleIdle = metrics.temporal?.max_single_idle_ms || 0;
    const keystrokeCount = metrics.spatial_textual?.keystroke_count || 0;
    
    // REFACTOR UTAMA: Menggunakan check_count (Verifikasi AST/Kunci Jawaban)
    // karena mahasiswa jarang melakukan run kompilasi mentah akibat sudah dipandu UML
    const checkCount = metrics.evaluation?.submit_count || 0; 

    if (timeSpent === 0) return "TINKERERS";

    // Kalkulasi Rasio Menggunakan Pengecekan Validasi
    const hesitationRatio = idleTime / timeSpent;
    const timeSpentMinutes = timeSpent / 60000;
    const checkVelocity = timeSpentMinutes > 0 ? checkCount / timeSpentMinutes : 0;

    // 1. KONDISI MOVERS (Spamming Tombol Validasi/Check Jawaban)
    // Mahasiswa melakukan submit verifikasi jawaban >= 3 kali dengan tempo agresif
    if (checkCount >= 3 && checkVelocity >= 1.5) {
        return "MOVERS";
    }

    // 2. KONDISI STOPPERS (Macet / Mengalami Kebuntuan Konseptual pasca-Check)
    if (maxSingleIdle > 420000) {
        return "STOPPERS";
    }
    // Jika melamun lama setelah tahu kodenya salah, dan ketikannya minim
    if (hesitationRatio > 0.55 && keystrokeCount < 100) {
        return "STOPPERS";
    }

    // 3. KONDISI DEFAULT TINKERERS
    return "TINKERERS";
};

export const evaluateCodeScaffolding = (graderResults, codeMetrics) => {
    const totalRules = graderResults.length;
    const mismatchRules = graderResults.filter(r => r.status === "MISMATCH").length;
    const codeErrorRatio = totalRules > 0 ? mismatchRules / totalRules : 0;

    const studentCategory = detectCodeCategory(codeMetrics);

    const { spatial_churn, temporal, evaluation } = codeMetrics || {};
    const maxSingleIdle = temporal?.max_single_idle_ms || 0;

    const totalDeletes = spatial_churn?.delete_count || 0;
    const churnRatio = spatial_churn?.total_actions > 0 ? totalDeletes / spatial_churn.total_actions : 0;
    const hesitationRatio = temporal?.time_spent_ms > 0 ? temporal.idle_time_ms / temporal.time_spent_ms : 0;

    const frustrationIndex = (churnRatio * 0.4) + (hesitationRatio * 0.4) + (Math.min((evaluation?.mismatch_attempts || 0) * 0.15, 0.2));

    let givenLevel = 3;
    let triggerReason = "";
    let hintMessage = "";

    if (studentCategory === "STOPPERS") {
        if (maxSingleIdle > 420000) {
            givenLevel = 3; // R-SCA-06: Afektif jika diam > 7 menit
            triggerReason = "Tidak ada aksi penulisan kode > 7 menit. Diberikan dukungan afektif L3.";
            hintMessage = "Menghadapi error Java OOP adalah bagian alami dari proses belajar seorang engineer. Jangan berkecil hati, mari coba perbaiki dari error baris terkecil terlebih dahulu.";
        } else {
            givenLevel = 1; // R-SCA-04: Kognitif jika buntu teknis
            triggerReason = "Mengalami mismatch + hesitation tinggi pada penulisan kode. Diberikan bantuan kognitif L1.";
            hintMessage = "Kode Anda berhasil dikompilasi, namun implementasi method belum memenuhi cetak biru diagram. Periksa kembali tipe data kembalian (return type) method tersebut.";
        }
    } else if (studentCategory === "MOVERS") {
        if (frustrationIndex > 0.5) {
            givenLevel = 2; // R-SCA-05: Metakognitif untuk memutus brute-forcing
            triggerReason = "Mahasiswa terindikasi trial-and-error membabi buta (Movers). Diberikan petunjuk metakognitif L2.";
            hintMessage = "Aksi kompilasi Anda ditangguhkan sementara. Mari berpikir sejenak: Apa tujuan Anda memodifikasi kata kunci super pada konstruktor tersebut? Tuliskan rencana perbaikan Anda.";
        } else {
            givenLevel = 3;
            triggerReason = "Mahasiswa melakukan iterasi cepat tanpa indikasi frustrasi tinggi. Diberikan dorongan afektif L3.";
            hintMessage = "Kerja bagus! Struktur implementasi kode Anda sejauh ini selaras dengan rancangan kelas.";
        }
    } else if (studentCategory === "TINKERERS") {
        if (codeErrorRatio > 0.3 && hesitationRatio > 0.35 ) {
            // HANYA berikan Level 3 Afirmasi jika kodenya MEMANG BENAR/LULUS
            givenLevel = 2;
            hintMessage = "Aksi kompilasi Anda ditangguhkan sementara. Mari berpikir sejenak: Apa tujuan Anda memodifikasi kata kunci super pada konstruktor tersebut? Tuliskan rencana perbaikan Anda.";
        } else {
            // JIKA kodenya masih salah (mismatch AST), berikan Level 1 (Kognitif) 
            // agar mahasiswa terbantu secara teknis/konseptual, bukan dicuekin pake L3 terus!
            givenLevel = 3;
            hintMessage = "Kerja bagus! Struktur implementasi kode Anda sejauh ini selaras dengan rancangan kelas.";
        }
    }

    return {
        success: true,
        matrix: {
            codeErrorRatio: codeErrorRatio,
            hesitationRatio: hesitationRatio,
            churnRatio: churnRatio,
        },
        analytics: {
            category: studentCategory,
            frustrationIndex: parseFloat(Math.min(frustrationIndex, 1).toFixed(2)),
            errorRatio: parseFloat(codeErrorRatio.toFixed(2)),
        },
        scaffolding: {
            level: givenLevel,
            reason: triggerReason,
            hint: hintMessage,
            shouldResetIdle: studentCategory === "STOPPERS"
        },
        isPassed: mismatchRules === 0
    };
};
