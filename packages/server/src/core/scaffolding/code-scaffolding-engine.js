const detectCodeCategory = (metrics, graderResults = []) => {
    const {
        temporal,
        spatial_textual,
        spatial_churn,
        evaluation
    } = metrics || {};

    const timeSpent = temporal ?.time_spent_ms || 0;
    const idleTime = temporal ?.idle_time_ms || 0;
    const maxSingleIdle = temporal ?.max_single_idle_ms || 0;

    const keystrokeCount = spatial_textual ?.keystroke_count || 0;

    const totalActions = spatial_churn ?.total_actions || 0;
    const deleteCount = spatial_churn ?.delete_count || 0;

    const submitCount = evaluation ?.submit_count || 0;
    const mismatchAttempts = evaluation ?.mismatch_attempts || 0;

    if (timeSpent === 0) {
        return "TINKERERS";
    }

    // ==========================================
    // DERIVED METRICS
    // ==========================================

    const hesitationRatio = timeSpent > 0 ? idleTime / timeSpent : 0;
    const churnRatio = totalActions > 0 ? deleteCount / totalActions : 0;
    const timeSpentMinutes = timeSpent / 60000;
    const submitVelocity = timeSpentMinutes > 0 ? submitCount / timeSpentMinutes : 0;
    const mismatchRatio = submitCount > 0 ? mismatchAttempts / submitCount : 0;
    const netKeystroke = keystrokeCount - deleteCount;
    // Jalur 1: Movers
    if (submitCount >= 2 && keystrokeCount > 15) {
        if (submitVelocity >= 1.2 || churnRatio >= 0.35 || mismatchRatio >= 0.7) {
            return "MOVERS";
        }
    }

    // Jalur 2: Stoppers
    if (netKeystroke < 50) {
        if (hesitationRatio > 0.5 || maxSingleIdle > 300000) {
            return "STOPPERS";
        }
    }
    return "TINKERERS";


};

export const evaluateCodeScaffolding = (graderResults, codeMetrics, parsedClasses = []) => {
    // ... (Perhitungan kriteria dasar tetap sama seperti kode sebelumnya)

    let studentCategory = detectCodeCategory(codeMetrics, graderResults);
    
    const { temporal, evaluation } = codeMetrics || {};
    const maxSingleIdle = temporal?.max_single_idle_ms || 0;
    const idleTime = temporal?.idle_time_ms || 0;
    const timeSpent = temporal?.time_spent_ms || 0;
    const mismatchAttempts = evaluation?.mismatch_attempts || 0;

    const hesitationRatio = timeSpent > 0 ? idleTime / timeSpent : 0;

    // =================================================================
    // MEKANISME RECOVERY (Mengubah Movers -> Tinkerers Secara Paksa)
    // =================================================================
    if (studentCategory === "MOVERS") {
        // Indikator Pertobatan 1: Mahasiswa mulai mengambil jeda berpikir yang cukup lama
        // setelah dinasihati (maxSingleIdle > 1.5 menit atau hesitationRatio tinggi)
        const isTakingPause = maxSingleIdle > 90000 || hesitationRatio > 0.45;

        const totalRules = graderResults.length;
        const mismatchRules = graderResults.filter(r => r.status === "MISMATCH").length;
        const codeErrorRatio = totalRules > 0 ? mismatchRules / totalRules : 0;
        const isProgressing = codeErrorRatio <= 0.3;

        if (isTakingPause || isProgressing) {
            studentCategory = "TINKERERS";
        }
    }

   
    let givenLevel = 3;
    let triggerReason = "";
    let hintMessage = "";

    if (studentCategory === "STOPPERS") {
        if (maxSingleIdle > 420000) {
            givenLevel = 1;
            triggerReason = "Mahasiswa mengalami kebuntuan mengetik ekstrem (>7 menit). Injeksi cetak biru kerangka kode diaktifkan.";
            hintMessage = "Sistem mendeteksi stagnasi aktivitas. Kerangka dasar kelas Java telah disiapkan untuk membantu Anda menyusun struktur berkas.";
        } else {
            givenLevel = 2;
            triggerReason = "Mahasiswa mengalami stagnasi mengetik awal (>5 menit). Pertanyaan pemandu metakognitif diaktifkan.";
            hintMessage = "Apakah Anda bingung memulai pengetikan kode? Coba periksa kembali deklarasi package, nama public class, atau apakah konstruktor utama sudah Anda inisialisasi.";
        }
    } 
    else if (studentCategory === "MOVERS") {
        givenLevel = 2;
        triggerReason = "Mahasiswa menunjukkan kecenderungan semantic checking berulang tanpa refleksi konseptual mendalam.";
        hintMessage = "Coba hentikan percobaan submit sesaat. Telaah kembali secara mandiri apakah relasi inheritance, abstract class, atau interface pada baris kode Anda sudah benar-benar sinkron dengan spesifikasi diagram.";
    } 
    else if (studentCategory === "TINKERERS") {
        const totalRules = graderResults.length;
        const mismatchRules = graderResults.filter(r => r.status === "MISMATCH").length;
        const codeErrorRatio = totalRules > 0 ? mismatchRules / totalRules : 0;

        if (codeErrorRatio > 0.3) {
            givenLevel = 2;
            triggerReason = "Mahasiswa aktif melakukan eksplorasi solusi, namun masih mengalami miskonsepsi implementasi OOP (At-Risk Tinkerers).";
            hintMessage = "Perhatikan kembali implementasi method dan hubungan antarkelas Anda. Apakah penggunaan keyword 'extends' atau 'implements' sudah tepat? Apakah visibilitas komponen private sudah dilindungi mekanisme pembungkusan data?";
        } else {
            givenLevel = 3;
            triggerReason = "Mahasiswa menunjukkan pola eksplorasi solusi yang stabil dan progresif (Healthy Tinkerers).";
            hintMessage = "Progres implementasi Anda sudah berada pada jalur yang baik. Lanjutkan pengecekan detail kecil seperti return type, modifier, dan konsistensi struktur class.";
        }
    }

    // return object hasil evaluasi...
    return { success: true, analytics: { category: studentCategory }, scaffolding: { level: givenLevel, hint: hintMessage, reason: triggerReason } };
};