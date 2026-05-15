/**
 * Mendeteksi kategori perilaku pengerjaan diagram mahasiswa (Dinamis per submission)
 */
const detectDiagramCategory = (metrics) => {
    const { temporal, spatial_churn, evaluation } = metrics;

    const timeSpent = temporal?.time_spent_ms || 0;
    const idleTime = temporal?.idle_time_ms || 0;
    const maxSingleIdle = temporal?.max_single_idle_ms || 0;
    const submitCount = evaluation?.submit_count || 0;
    const totalActions = spatial_churn?.total_actions || 0;

    if (timeSpent === 0 || totalActions === 0) return "Tinkerers";

    const hesitationRatio = idleTime / timeSpent;

    // A. DETEKSI STOPPERS (Pasif / Stuck)
    if (hesitationRatio > 0.5 || maxSingleIdle > 90000) {
        if (totalActions < 10 || submitCount <= 1) return "Stoppers";
    }

    // B. DETEKSI MOVERS (Trial-and-Error)
    if (hesitationRatio < 0.2 && submitCount >= 3) return "Movers";

    // C. DETEKSI TINKERERS (Strategis)
    return "Tinkerers";
};

/**
 * Core Evaluator untuk Scaffolding Diagram
 */
export const evaluateDiagramScaffolding = (graderResults, diagramMetrics) => {
    const totalRules = graderResults.length;
    const mismatchRules = graderResults.filter(r => r.status === "MISMATCH").length;
    const diagramErrorRatio = totalRules > 0 ? mismatchRules / totalRules : 0;

    const studentCategory = detectDiagramCategory(diagramMetrics);

    const { spatial_churn, temporal, evaluation } = diagramMetrics;
    const totalDeletes = (spatial_churn?.node_delete_count || 0) + (spatial_churn?.edge_delete_count || 0);
    const churnRatio = spatial_churn?.total_actions > 0 ? totalDeletes / spatial_churn.total_actions : 0;
    const hesitationRatio = temporal?.time_spent_ms > 0 ? temporal.idle_time_ms / temporal.time_spent_ms : 0;

    // Rumus Frustration Index (Landasan Teori TA)
    const frustrationIndex = (churnRatio * 0.4) + (hesitationRatio * 0.4) + (Math.min((evaluation?.mismatch_attempts || 0) * 0.15, 0.2));

    // Penentuan Level
    let givenLevel = 3; // L3: Default Mandiri / Afektif
    let triggerReason = `Mahasiswa berada di state [${studentCategory}]. Alur aman.`;

    if (studentCategory === "Stoppers") {
        givenLevel = 1; // L1: Kognitif (Skeleton)
        triggerReason = "Mahasiswa terdeteksi sebagai [Stoppers] karena pasif terlalu lama. Diberikan bantuan kognitif (L1).";
    } else if (studentCategory === "Movers" && frustrationIndex > 0.5) {
        givenLevel = 2; // L2: Metakognitif (Highlight / Pertanyaan)
        triggerReason = "Mahasiswa terdeteksi sebagai [Movers] terjebak trial-and-error ekstrem. Diberikan pemicu refleksi (L2).";
    } else if (studentCategory === "Tinkerers" && diagramErrorRatio > 0.3 && hesitationRatio > 0.35) {
        givenLevel = 2;
        triggerReason = "Mahasiswa terdeteksi sebagai [Tinkerers] yang stuck setelah berpikir. Diberikan petunjuk metakognitif (L2).";
    }

    return {
        analytics: {
            category: studentCategory,
            frustrationIndex: parseFloat(Math.min(frustrationIndex, 1).toFixed(2)),
            errorRatio: parseFloat(diagramErrorRatio.toFixed(2)),
        },
        scaffolding: {
            level: givenLevel,
            reason: triggerReason
        },
        isPassed: mismatchRules === 0
    };
};