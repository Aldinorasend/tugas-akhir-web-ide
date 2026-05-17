import { supabase } from "../../config/supabase.js";
import { compareDiagrams } from "../../core/grader/ruleEngine.js";
import { evaluateDiagramScaffolding } from "../../core/scaffolding/diagram-scaffolding-engine.js";

export const gradeAndLogDiagram = async (req, res) => {
    try {
        const { user_id, exerciseId, nodes, edges, diagramMetrics } = req.body;

        // 1. Ambil ground truth rules dari dosen di database
        const { data: rules, error: ruleError } = await supabase
            .from('diagram_rules')
            .select('nodes, edges, logic_rules')
            .eq('exercise_id', exerciseId)
            .single();
        if (ruleError || !rules) {
            return res.status(404).json({ success: false, message: "Aturan diagram tidak ditemukan" });
        }

        // 2. Evaluasi menggunakan Grader Diagram bawaan kamu
        const gradeResult = compareDiagrams(nodes, edges, rules);
        // 3. Transformasi ke format penilai Scaffolding bertingkat
        // Kita petakan feedbacks kamu sebagai array objek agar kompatibel dengan engine kita
        const mappedResultsForEngine = gradeResult.feedbacks.map(f => ({
            rule: f,
            status: "MISMATCH"
        }));
        // Jika tidak ada error feedback sama sekali, buat array pura-pura berisi status MATCH
        if (mappedResultsForEngine.length === 0) {
            mappedResultsForEngine.push({ rule: "All clear", status: "MATCH" });
        }

        // 4. Hitung kategori mahasiswa (Movers/Tinkerers/Stoppers) & Level Scaffolding (L1-L3)
        const decision = evaluateDiagramScaffolding(mappedResultsForEngine, diagramMetrics);

        // Ekstraksi metrik temporal dan spasial dari payload FE
        const { temporal, spatial_churn, evaluation } = diagramMetrics || {};
        const timeSpent = temporal?.time_spent_ms || 0;
        const idleTime = temporal?.idle_time_ms || 0;
        const maxSingleIdle = temporal?.max_single_idle_ms || 0;

        const totalActions = spatial_churn?.total_actions || 0;
        const nodeAddCount = spatial_churn?.node_add_count || 0;
        const nodeDeleteCount = spatial_churn?.node_delete_count || 0;
        const edgeAddCount = spatial_churn?.edge_add_count || 0;
        const edgeDeleteCount = spatial_churn?.edge_delete_count || 0;
        const componentModificationCount = spatial_churn?.component_modification_count || 0;

        const submitCount = evaluation?.submit_count || 1;
        const mismatchAttempts = evaluation?.mismatch_attempts || 0;

        // Hitung rasio untuk disimpan ke database
        const totalDeletes = nodeDeleteCount + edgeDeleteCount;
        const churnRatio = totalActions > 0 ? totalDeletes / totalActions : 0;
        const hesitationRatio = timeSpent > 0 ? idleTime / timeSpent : 0;
        const timeSpentMinutes = timeSpent / 60000;
        const submitVelocity = timeSpentMinutes > 0 ? submitCount / timeSpentMinutes : 0;

        // =================================================================
        // 5. ATOMIC UPSERT: Simpan Metrik Kumulatif ke diagram_phase_metrics
        // =================================================================
        const { error: updateError } = await supabase
            .from("diagram_phase_metrics")
            .upsert({
                user_id: user_id,
                exercise_id: exerciseId,
                time_spent_ms: timeSpent,
                idle_time_ms: idleTime,
                max_single_idle_ms: maxSingleIdle,
                total_actions: totalActions,
                node_add_count: nodeAddCount,
                node_delete_count: nodeDeleteCount,
                edge_add_count: edgeAddCount,
                edge_delete_count: edgeDeleteCount,
                component_modification_count: componentModificationCount,
                submit_count: submitCount,
                mismatch_attempts: mismatchAttempts,
                hesitation_ratio: parseFloat(hesitationRatio.toFixed(2)),
                churn_ratio: parseFloat(churnRatio.toFixed(2)),
                submit_velocity: parseFloat(submitVelocity.toFixed(2)),
                frustration_index: parseFloat(Math.min(decision.analytics.frustrationIndex, 1).toFixed(2)),
                detected_category: decision.analytics.category?.toUpperCase() || 'TINKERERS',
                is_passed: gradeResult.isPassed
            }, { onConflict: 'user_id, exercise_id' });

        if (updateError) throw updateError;

        // =================================================================
        // 6. INSERT Tabel History: scaffolding_logs
        // =================================================================
        const { error: logError } = await supabase
            .from("scaffolding_logs")
            .insert({
                user_id: user_id,
                exercise_id: exerciseId,
                trigger_phase: 'DIAGRAM_PLANNING', // Menandai fase perancangan diagram UML
                detected_category: decision.analytics.category?.toUpperCase() || 'TINKERERS',
                scaffolding_level: decision.scaffolding.level, 
                trigger_reason: decision.scaffolding.reason,
                hint_message: gradeResult.feedbacks[0] || "Periksa kembali rancangan diagram Anda."
            });

        if (logError) throw logError;

        // 7. Berikan respons adaptif ke Frontend Next.js (Adaptive Feedback UI)
        return res.json({
            success: true,
            isPassed: gradeResult.isPassed,
            score: gradeResult.finalGrade,
            matrix: decision.matrix,
            hints: gradeResult.feedbacks, // Feedback teks mendalam bawaan fungsi kamu
            analytics: decision.analytics, // Kategori (Movers, Tinkerers, Stoppers) + Frustration Index
            scaffolding: decision.scaffolding // Level bantuan (1, 2, atau 3) beserta alasannya
        });

    } catch (error) {
        console.error("Global Evaluation Error:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};