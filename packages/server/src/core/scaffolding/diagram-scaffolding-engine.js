const detectDiagramCategory = (metrics) => {
    const { temporal, spatial_churn, evaluation } = metrics;

    const timeSpent = temporal?.time_spent_ms || 0;
    const idleTime = temporal?.idle_time_ms || 0;
    const maxSingleIdle = temporal?.max_single_idle_ms || 0;
    const submitCount = evaluation?.submit_count || 0;
    const totalActions = spatial_churn?.total_actions || 0;

    if (timeSpent === 0 || totalActions === 0) return "Tinkerers";

    const totalDeletes = (spatial_churn?.node_delete_count || 0) + (spatial_churn?.edge_delete_count || 0);
    const churnRatio = totalActions > 0 ? totalDeletes / totalActions : 0;

    const hesitationRatio = idleTime / timeSpent;
    const timeSpentMinutes = timeSpent / 60000;

    const actionVelocity = timeSpentMinutes > 0 ? totalActions / timeSpentMinutes : 0;
    const submitVelocity = timeSpentMinutes > 0 ? submitCount / timeSpentMinutes : 0;

    const totalMovementActions =
        (spatial_churn?.node_add_count || 0) +
        (spatial_churn?.edge_add_count || 0) +
        (spatial_churn?.component_modification_count || 0);

    // ==========================================
    // JALUR 1: MUTLAK MOVERS (Gaming the System)
    // ==========================================
    if (submitCount >= 3 && (submitVelocity >= 1.5 || actionVelocity > 6 || churnRatio > 0.40)) { // [cite: 364, 367]
        return "Movers";
    }

    // ==========================================
    // JALUR 2: STOPPERS (Pasif / Stuck)
    // ==========================================
    if (totalMovementActions < 3 && (hesitationRatio > 0.55 || maxSingleIdle > 420000)) { // [cite: 350, 353]
        if (totalActions < 12 || submitCount <= 1) {
            return "Stoppers";
        }
    }

    // ==========================================
    // JALUR 3: DEFAULT ZONA SEHAT (Tinkerers)
    // ==========================================
    return "Tinkerers";
};

export const evaluateDiagramScaffolding = (graderResults, diagramMetrics) => {
    const totalRules = graderResults.length;
    const mismatchRules = graderResults.filter(r => r.status === "MISMATCH").length;
    const diagramErrorRatio = totalRules > 0 ? mismatchRules / totalRules : 0;

    const studentCategory = detectDiagramCategory(diagramMetrics);

    // FIX SCOPING: Ekstrak max_single_idle_ms agar bisa dibaca di scope fungsi ini
    const { spatial_churn, temporal, evaluation } = diagramMetrics;
    const maxSingleIdle = temporal?.max_single_idle_ms || 0;

    const totalDeletes = (spatial_churn?.node_delete_count || 0) + (spatial_churn?.edge_delete_count || 0);
    const churnRatio = spatial_churn?.total_actions > 0 ? totalDeletes / spatial_churn.total_actions : 0;
    const hesitationRatio = temporal?.time_spent_ms > 0 ? temporal.idle_time_ms / temporal.time_spent_ms : 0;

    const frustrationIndex = (churnRatio * 0.4) + (hesitationRatio * 0.4) + (Math.min((evaluation?.mismatch_attempts || 0) * 0.15, 0.2));

    let givenLevel = 3;
    let triggerReason = "";

    if (studentCategory === "Stoppers") {
        // Sekarang kondisi maxSingleIdle di bawah ini dijamin aman dari ReferenceError
        if (maxSingleIdle > 420000) { // [cite: 353]
            givenLevel = 3; // [cite: 394]
            triggerReason = "Tidak ada aksi pada kanvas > 7 menit. Diberikan dukungan afektif L3."; // [cite: 394]
        } else {
            givenLevel = 1; // [cite: 394]
            triggerReason = "Mengalami mismatch + hesitation tinggi. Diberikan bantuan kognitif L1."; // [cite: 394]
        }
    } else if (studentCategory === "Movers") {
        if (frustrationIndex > 0.5) {
            givenLevel = 2; // [cite: 398]
            triggerReason = "Mahasiswa terjebak trial-and-error murni (Gaming). Diberikan petunjuk metakognitif L2."; // [cite: 398]
        } else {
            givenLevel = 3;
            triggerReason = "Mahasiswa melakukan iterasi cepat tanpa indikasi frustrasi tinggi. Diberikan dorongan afektif L3.";
        }
    } else if (studentCategory === "Tinkerers") {
        if (diagramErrorRatio > 0.3 && hesitationRatio > 0.35) {
            givenLevel = 2;
            triggerReason = "Mahasiswa mengalami kendala konseptual mendalam. Diberikan petunjuk L2.";
        } else {
            givenLevel = 3;
            triggerReason = "Progres mahasiswa berjalan dengan ritme sehat (Tinkerers). Diberikan afirmasi afektif positif L3.";
        }
    }

    return {
        success: true,
        matrix: {
            diagramErrorRatio: diagramErrorRatio,
            hesitationRatio: hesitationRatio,
            churnRatio: churnRatio,
        },
        analytics: {
            category: studentCategory,
            frustrationIndex: parseFloat(Math.min(frustrationIndex, 1).toFixed(2)),
            errorRatio: parseFloat(diagramErrorRatio.toFixed(2)),
        },
        scaffolding: {
            level: givenLevel,
            reason: triggerReason,
            shouldResetIdle: studentCategory === "Stoppers"
        },
        isPassed: mismatchRules === 0
    };
};