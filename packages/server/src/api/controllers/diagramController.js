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

        // 5. Cek atau Buat Sesi Utama di student_attempts
        let { data: attempt } = await supabase
            .from("student_attempts")
            .select("id, diagram_check_count, logs")
            .eq("user_id", user_id)
            .eq("exercise_id", exerciseId)
            .maybeSingle(); // Cari yang sudah ada

        if (!attempt) {
            const { data: newAttempt, error: createError } = await supabase
                .from("student_attempts")
                .insert({
                    user_id: user_id,
                    exercise_id: exerciseId,
                    started_at: new Date()
                })
                .select()
                .single();

            if (createError) throw createError;
            attempt = newAttempt;
        }

        const currentCheckCount = (attempt?.diagram_check_count || 0) + 1;
        const existingLogs = attempt?.logs || [];

        // Buat objek snapshot singkat untuk merekam performa di kolom array logs
        const newSnapshotLog = {
            check_number: currentCheckCount,
            timestamp: new Date().toISOString(),
            category: decision.analytics.category,
            score: gradeResult.finalGrade,
            error_ratio: decision.analytics.errorRatio
        };

        // 6. UPDATE Tabel Kunci: student_attempts (Data Kumulatif Terkini)
        const { error: updateError } = await supabase
            .from("student_attempts")
            .update({
                current_diagram: { nodes, edges },
                diagram_check_count: currentCheckCount,
                diagram_highest_scaffold: decision.scaffolding.level,
                is_completed: gradeResult.isPassed,
                logs: [...existingLogs, newSnapshotLog],
                // Jika lulus 100% MATCH, otomatis catat waktu penyelesaian
                ...(gradeResult.isPassed && {
                    completed_at: new Date().toISOString(),
                    finish_in_second: Math.round((diagramMetrics?.temporal?.time_spent_ms || 0) / 1000)
                })
            })
            .eq("id", attempt.id);

        if (updateError) throw updateError;

        // 7. INSERT Tabel History: scaffolding_logs (Menjaga keutuhan data longitudinal)
        const { error: logError } = await supabase
            .from("scaffolding_logs")
            .insert({
                attempt_id: attempt.id,
                level: decision.scaffolding.level,
                concept_node: gradeResult.feedbacks[0] || "UML_Structure_Verification", // Highlight kesalahan pertama sebagai penanda node masalah
                trigger_type: gradeResult.isPassed ? "Diagram_Passed" : "Diagram_Mismatch",
                student_category: decision.analytics.category,
                frustration_index: decision.analytics.frustrationIndex,
                error_ratio: decision.analytics.errorRatio,
                trigger_reason: decision.scaffolding.reason
            });

        if (logError) throw logError;

        // 8. Berikan respons adaptif ke Frontend Next.js (Adaptive Feedback UI)
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