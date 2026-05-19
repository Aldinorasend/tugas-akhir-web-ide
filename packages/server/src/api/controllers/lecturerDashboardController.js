import { supabase } from "../../config/supabase.js";

export const getLecturerDashboardData = async (req, res) => {
    try {
        // 1. Fetch all student profiles
        const { data: students, error: studentErr } = await supabase
            .from("profiles")
            .select("id, nim_nip, full_name, role")
            .eq("role", "student");

        if (studentErr) throw studentErr;

        // 2. Fetch all exercises
        const { data: exercises, error: exerciseErr } = await supabase
            .from("exercises")
            .select("id, title");

        if (exerciseErr) throw exerciseErr;

        // 3. Fetch all diagram phase metrics
        const { data: diagramMetrics, error: diagErr } = await supabase
            .from("diagram_phase_metrics")
            .select("*");

        if (diagErr) throw diagErr;

        // 4. Fetch all code phase metrics
        const { data: codeMetrics, error: codeErr } = await supabase
            .from("code_phase_metrics")
            .select("*");

        if (codeErr) throw codeErr;

        // 5. Fetch all scaffolding logs
        const { data: scaffoldingLogs, error: logErr } = await supabase
            .from("scaffolding_logs")
            .select("*")
            .order("created_at", { ascending: false });

        if (logErr) throw logErr;

        // Create exercise map for title lookup
        const exerciseMap = {};
        exercises.forEach(e => {
            exerciseMap[e.id] = e.title;
        });

        // Aggregate the data in-memory for lightning-fast speeds and bulletproof stability
        const studentProgress = students.map(student => {
            const studentDiagMetrics = diagramMetrics.filter(m => m.user_id === student.id);
            const studentCodeMetrics = codeMetrics.filter(m => m.user_id === student.id);
            const studentLogs = scaffoldingLogs.filter(m => m.user_id === student.id);

            // Find unique exercise IDs this student has attempted
            const attemptedExerciseIds = Array.from(new Set([
                ...studentDiagMetrics.map(m => m.exercise_id),
                ...studentCodeMetrics.map(m => m.exercise_id),
                ...studentLogs.map(m => m.exercise_id)
            ]));

            // Default experiment group from any active metrics
            let experimentGroup = "CONTROL"; // Default
            const groupMetric = studentDiagMetrics.find(m => m.experiment_group) || 
                                studentCodeMetrics.find(m => m.experiment_group) ||
                                studentLogs.find(m => m.experiment_group);
            if (groupMetric) {
                experimentGroup = groupMetric.experiment_group;
            }

            const studentExercises = attemptedExerciseIds.map(exerciseId => {
                const diag = studentDiagMetrics.find(m => m.exercise_id === exerciseId);
                const code = studentCodeMetrics.find(m => m.exercise_id === exerciseId);
                const logs = studentLogs.filter(m => m.exercise_id === exerciseId);

                // Calculate maximum/latest score from logs or passes
                let latestScore = 0;
                if (logs.length > 0) {
                    latestScore = logs[0].current_score || 0;
                } else if (diag?.is_passed) {
                    latestScore = 100;
                }

                const exerciseGroup = diag?.experiment_group || code?.experiment_group || logs[0]?.experiment_group || "CONTROL";

                return {
                    exercise_id: exerciseId,
                    title: exerciseMap[exerciseId] || "Study Case " + exerciseId.slice(0, 8),
                    experiment_group: exerciseGroup,
                    score: latestScore,
                    diagram: diag ? {
                        is_passed: diag.is_passed,
                        time_spent_ms: diag.time_spent_ms,
                        idle_time_ms: diag.idle_time_ms,
                        total_actions: diag.total_actions,
                        submit_count: diag.submit_count,
                        mismatch_attempts: diag.mismatch_attempts,
                        frustration_index: diag.frustration_index,
                        detected_category: diag.detected_category || "MOVERS"
                    } : null,
                    code: code ? {
                        is_passed: code.is_passed,
                        time_spent_ms: code.time_spent_ms,
                        idle_time_ms: code.idle_time_ms,
                        keystroke_count: code.keystroke_count,
                        lines_of_code: code.lines_of_code,
                        run_count: code.run_count,
                        syntax_error_count: code.syntax_error_count,
                        logical_error_count: code.logical_error_count,
                        frustration_index: code.frustration_index,
                        detected_category: code.detected_category || "MOVERS"
                    } : null,
                    logs: logs.map(l => ({
                        id: l.id,
                        trigger_phase: l.trigger_phase,
                        detected_category: l.detected_category,
                        scaffolding_level: l.scaffolding_level,
                        trigger_reason: l.trigger_reason,
                        hint_message: l.hint_message,
                        current_score: l.current_score,
                        created_at: l.created_at
                    }))
                };
            });

            return {
                id: student.id,
                nim_nip: student.nim_nip,
                full_name: student.full_name,
                experiment_group: experimentGroup,
                exercises: studentExercises
            };
        });

        res.json({
            success: true,
            data: studentProgress
        });
    } catch (err) {
        console.error("Lecturer Dashboard API Error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard data: " + err.message
        });
    }
};
