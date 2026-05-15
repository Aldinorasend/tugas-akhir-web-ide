import { supabase } from "../../config/supabase.js";
import { compareDiagrams } from "./ruleEngine.js";

export const gradeStudentDiagram = async (exerciseId, studentNodes, studentEdges) => {
    try {
        // Ambil rule dari tabel 'diagram_rules'
        const { data: rules, error } = await supabase
            .from('diagram_rules')
            .select('nodes, edges, logic_rules')
            .eq('exercise_id', exerciseId)
            .single();

        if (error || !rules) throw new Error("Aturan diagram tidak ditemukan");
        // Bandingkan di memori (Tier 2 Engine)
        const result = compareDiagrams(studentNodes, studentEdges, rules);
        console.log(JSON.stringify(result, null, 2));
        return {
            success: true,
            isCorrect: result.finalGrade === 100,
            score: result.finalGrade,
            hints: result.feedbacks, // Untuk Scaffolding L1/L2
        };
    } catch (err) {
        console.error("Grader Error:", err.message);
        return { success: false, message: err.message };
    }
};
