const detectCodeCategory = (metrics, graderResults = []) => {
    const { temporal, spatial_textual, spatial_churn, evaluation } = metrics || {};

    const timeSpent = temporal?.time_spent_ms || 0;
    const idleTime = temporal?.idle_time_ms || 0;
    const maxSingleIdle = temporal?.max_single_idle_ms || 0;

    const keystrokeCount = spatial_textual?.keystroke_count || 0;

    const totalActions = spatial_churn?.total_actions || 0;
    const deleteCount = spatial_churn?.delete_count || 0;

    const submitCount = evaluation?.submit_count || 0;
    const mismatchAttempts = evaluation?.mismatch_attempts || 0;

    if (timeSpent === 0) {
        return "TINKERERS";
    }

    // ==========================================
    // DERIVED METRICS
    // ==========================================

    const hesitationRatio =
        timeSpent > 0 ? idleTime / timeSpent : 0;

    const churnRatio =
        totalActions > 0 ? deleteCount / totalActions : 0;

    const timeSpentMinutes = timeSpent / 60000;

    const submitVelocity =
        timeSpentMinutes > 0
            ? submitCount / timeSpentMinutes
            : 0;

    const mismatchRatio =
        submitCount > 0
            ? mismatchAttempts / submitCount
            : 0;

    // ==========================================
    // 1. MOVERS
    // Rapid semantic checking / gaming tendency
    // ==========================================

    if (
        submitCount >= 5 &&
        submitVelocity >= 1.2 &&
        mismatchRatio >= 0.7
    ) {
        return "MOVERS";
    }

    // ==========================================
    // 2. STOPPERS
    // Passive stuck / disengagement
    // ==========================================

    if (
        keystrokeCount < 80 &&
        (
            hesitationRatio > 0.65 ||
            maxSingleIdle > 420000
        )
    ) {
        return "STOPPERS";
    }

    // ==========================================
    // 3. DEFAULT
    // Healthy / reflective exploration
    // ==========================================

    return "TINKERERS";
};

export const evaluateCodeScaffolding = (
    graderResults,
    codeMetrics,
    parsedClasses = []
) => {

    const totalRules = graderResults.length;

    const mismatchRules =
        graderResults.filter(
            r => r.status === "MISMATCH"
        ).length;

    const codeErrorRatio =
        totalRules > 0
            ? mismatchRules / totalRules
            : 0;

    const studentCategory =
        detectCodeCategory(
            codeMetrics,
            graderResults
        );

    const {
        temporal,
        spatial_churn,
        evaluation,
        spatial_textual
    } = codeMetrics || {};

    // ==========================================
    // METRICS
    // ==========================================

    const timeSpent =
        temporal?.time_spent_ms || 0;

    const idleTime =
        temporal?.idle_time_ms || 0;

    const hesitationRatio =
        timeSpent > 0
            ? idleTime / timeSpent
            : 0;

    const totalActions =
        spatial_churn?.total_actions || 0;

    const deleteCount =
        spatial_churn?.delete_count || 0;

    const churnRatio =
        totalActions > 0
            ? deleteCount / totalActions
            : 0;

    const submitCount =
        evaluation?.submit_count || 0;

    const mismatchAttempts =
        evaluation?.mismatch_attempts || 0;

    const keystrokeCount =
        spatial_textual?.keystroke_count || 0;

    // ==========================================
    // FRUSTRATION INDEX
    // ==========================================

    const frustrationIndex =
        (
            churnRatio * 0.3
        ) +
        (
            hesitationRatio * 0.2
        ) +
        (
            Math.min(
                mismatchAttempts * 0.1,
                0.5
            )
        );

    // ==========================================
    // SCAFFOLD DECISION
    // ==========================================

    let givenLevel = 3;
    let triggerReason = "";
    let hintMessage = "";

    // ==========================================
    // CRITICAL STRUGGLE / LEVEL 1 COGNITIVE AID
    // ==========================================
    if (mismatchAttempts >= 6 && studentCategory !== "STOPPERS") {
        givenLevel = 1;
        triggerReason = "Mahasiswa terindikasi mengalami kesulitan kognitif tingkat tinggi pada implementasi OOP. Bantuan kognitif Level 1 diaktifkan.";
        hintMessage = "jangan lupa untuk menambahkan setter getter jika private";
    }

    // ==========================================
    // STOPPERS
    // ==========================================

    else if (studentCategory === "STOPPERS") {

        givenLevel = 3;

        triggerReason =
            "Mahasiswa terindikasi mengalami stagnasi interaksi dan penghentian progres sementara.";

        hintMessage =
            "Tidak apa-apa jika implementasi OOP terasa membingungkan. Coba fokuskan perhatian pada satu class terlebih dahulu sebelum melanjutkan ke relasi inheritance atau interface.";

    }

    // ==========================================
    // MOVERS
    // ==========================================

    else if (studentCategory === "MOVERS") {

        givenLevel = 2;

        triggerReason =
            "Mahasiswa menunjukkan kecenderungan semantic checking berulang tanpa refleksi konseptual mendalam.";

        hintMessage =
            "Coba hentikan percobaan validasi sesaat. Telaah kembali apakah relasi inheritance, abstract class, atau interface pada kode Anda sudah benar-benar sesuai dengan diagram UML.";

    }

    // ==========================================
    // TINKERERS
    // ==========================================

    else if (studentCategory === "TINKERERS") {

        // --------------------------------------
        // STRUGGLING TINKERERS
        // Active but conceptually struggling
        // --------------------------------------

        if (
            codeErrorRatio > 0.3 &&
            mismatchAttempts >= 3
        ) {

            givenLevel = 2;

            triggerReason =
                "Mahasiswa aktif melakukan eksplorasi solusi, namun masih mengalami miskonsepsi implementasi OOP.";

            hintMessage =
                "Perhatikan kembali implementasi method dan hubungan antarkelas. Apakah seluruh method yang dideklarasikan sudah memiliki body yang valid? Apakah penggunaan extends dan implements sudah sesuai konteks?";

        }

        // --------------------------------------
        // HEALTHY TINKERERS
        // --------------------------------------

        else {

            givenLevel = 3;

            triggerReason =
                "Mahasiswa menunjukkan pola eksplorasi solusi yang stabil dan progresif.";

            hintMessage =
                "Progres implementasi Anda sudah berada pada jalur yang baik. Lanjutkan pengecekan detail kecil seperti return type, modifier, dan konsistensi struktur class.";

        }
    }

    return {
        success: true,

        matrix: {
            codeErrorRatio,
            hesitationRatio,
            churnRatio,
        },

        analytics: {
            category: studentCategory,

            frustrationIndex:
                parseFloat(
                    Math.min(frustrationIndex, 1)
                        .toFixed(2)
                ),

            errorRatio:
                parseFloat(
                    codeErrorRatio.toFixed(2)
                ),
        },

        scaffolding: {
            level: givenLevel,
            reason: triggerReason,
            hint: hintMessage,
            shouldResetIdle:
                studentCategory === "STOPPERS"
        },

        isPassed: mismatchRules === 0
    };
};