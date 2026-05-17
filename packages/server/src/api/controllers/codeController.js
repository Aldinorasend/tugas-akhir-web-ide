import { supabase } from "../../config/supabase.js";
import { compareCodeWithLogic } from "../../core/ast-parser/java-analyzer.js";
import { evaluateCodeScaffolding } from "../../core/scaffolding/code-scaffolding-engine.js";

// Handler Utama Endpoint HTTP POST /api/grader/compare-code
export const gradeAndCompareCode = async (req, res) => {
    try {
        const { user_id, exerciseId, current_code, codeMetrics, logic_rules } = req.body;

        // 1. Validasi input parameter dasar dari request body
        if (!current_code || !logic_rules) {
            return res.status(400).json({ success: false, error: "Missing required parameters: current_code or logic_rules" });
        }

        // Resolusi user_id aman: pastikan format UUID valid untuk mencegah database crash
        let actualUserId = user_id;
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(user_id);
        if (!isUUID || !user_id) {
            actualUserId = "90289652-6cf9-41a2-a106-ec1783c5146e"; // Test profile uuid fallback
        }

        const actualExerciseId = exerciseId || "a132ecb7-f867-4c74-b293-6bf552f0accd"; 

        // 2. Evaluasi menggunakan AST java-analyzer
        const compareResult = compareCodeWithLogic(current_code, logic_rules);
        if (!compareResult.success) {
            return res.status(500).json({ success: false, error: compareResult.error, message: compareResult.message });
        }

        // 3. Hitung skor dinamis secara proporsional
        const totalRules = compareResult.results?.length || 1;
        const matchedRules = compareResult.results?.filter(r => r.status === "MATCH").length || 0;
        const dynamicScore = matchedRules / totalRules;

        // 4. Transformasikan hasil untuk dievaluasi oleh scaffolding engine
        // Pastikan fungsi ini mengembalikan data bertipe koding (syntax_error, dsb)
        const decision = evaluateCodeScaffolding(compareResult.results, codeMetrics);

        // Ekstraksi metrik temporal dan spasial dari payload FE
        const { temporal, spatial_textual, evaluation } = codeMetrics || {};
        const timeSpent = temporal?.time_spent_ms || 0;
        const idleTime = temporal?.idle_time_ms || 0;
        const maxSingleIdle = temporal?.max_single_idle_ms || 0;
        const keystrokeCount = spatial_textual?.keystroke_count || 0;
        const linesOfCode = spatial_textual?.lines_of_code || 0;
        
        // Ambil jumlah run_count terkini yang dikirim oleh FE (sudah di-increment +1 di FE)
        const currentRunCount = evaluation?.run_count || 1;

        // Ekstraksi jumlah error dari hasil AST Parser
        const syntaxErrorCount = compareResult.results?.filter(r => r.type === "SYNTAX_ERROR").length || 0;
        const logicalErrorCount = compareResult.results?.filter(r => r.type === "LOGICAL_ERROR").length || 0;

        // Hitung ulang rasio rasional untuk disimpan ke dalam kolom database
        const hesitationRatio = timeSpent > 0 ? idleTime / timeSpent : 0;
        const timeSpentMinutes = timeSpent / 60000;
        const runVelocity = timeSpentMinutes > 0 ? currentRunCount / timeSpentMinutes : 0;

        // =================================================================
        // 5. ATOMIC UPSERT: Simpan Metrik Kumulatif ke code_phase_metrics
        // =================================================================
        // Kita tidak memakai array JSON logs lagi, semua metrik granular langsung masuk kolom
        const { data: upsertedMetric, error: updateError } = await supabase
            .from("code_phase_metrics")
            .upsert({
                user_id: actualUserId,
                exercise_id: actualExerciseId,
                time_spent_ms: timeSpent,
                idle_time_ms: idleTime,
                max_single_idle_ms: maxSingleIdle,
                keystroke_count: keystrokeCount,
                lines_of_code: linesOfCode,
                run_count: currentRunCount,
                syntax_error_count: syntaxErrorCount,
                logical_error_count: logicalErrorCount,
                hesitation_ratio: parseFloat(hesitationRatio.toFixed(2)),
                run_velocity: parseFloat(runVelocity.toFixed(2)),
                frustration_index: parseFloat(Math.min(decision.analytics.frustrationIndex, 1).toFixed(2)),
                detected_category: decision.analytics.category, // Enum: 'TINKERERS', 'STOPPERS', 'MOVERS'
                is_passed: decision.isPassed
            }, { onConflict: 'user_id, exercise_id' }) // Memanfaatkan Composite Key agar meng-update 1 baris yang sama
            .select("id")
            .single();

        if (updateError) throw updateError;

        // =================================================================
        // 6. INSERT LOG: Catat Riwayat Intervensi Ke scaffolding_logs
        // =================================================================
        const firstMismatched = compareResult.results?.find(r => r.status === "MISMATCH");
        const conceptNode = firstMismatched ? firstMismatched.rule : "Code_All_Matched";

        const { error: logError } = await supabase
            .from("scaffolding_logs")
            .insert({
                user_id: actualUserId,
                exercise_id: actualExerciseId,
                trigger_phase: 'CODE_DEBUGGING', // Menandai bahwa ini log dari fase koding (Sesuai DDL Baru)
                detected_category: decision.analytics.category,
                scaffolding_level: decision.scaffolding.level, // 1, 2, atau 3
                trigger_reason: decision.scaffolding.reason,
                hint_message: decision.scaffolding.hint || "Periksa kembali aturan konseptual diagram pada kode Anda."
            });

        if (logError) throw logError;

        // 7. Format umpan balik sebagai list string feedback untuk kompatibilitas UI
        const feedbacks = compareResult.results?.map(r => `${r.status === "MATCH" ? "✅" : "❌"} ${r.rule || r.message}`) || [];

        // 8. Berikan respon adaptif ke Frontend Next.js
        return res.json({
            success: true,
            isPassed: decision.isPassed,
            score: dynamicScore,
            hints: feedbacks, // Berisi detail visual centang/silang tiap rule untuk dirender di modal
            analytics: {
                category: decision.analytics.category,
                frustrationIndex: parseFloat(Math.min(decision.analytics.frustrationIndex, 1).toFixed(2))
            },
            scaffolding: {
                level: decision.scaffolding.level,
                reason: decision.scaffolding.reason,
                hint: decision.scaffolding.hint,
                shouldResetIdle: decision.scaffolding.shouldResetIdle
            }
        });

    } catch (error) {
        console.error("Global Code Evaluation Error:", error);
        return res.status(500).json({ success: false, error: "Internal Server Error", message: error.message });
    }
};