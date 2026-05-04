// lib/api.ts
import { supabase } from "./supabase";

export const publishStudyCase = async (
    title: string,
    description: string,
    diagram: { nodes: any[]; edges: any[] }
) => {
    const { data, error } = await supabase
        .from('study_cases')
        .insert([
            {
                title,
                description,
                // The diagram object is stored directly in the JSONB column
                answer_key: diagram,
                pass_threshold: 0.7, // Default threshold for your thesis project
            }
        ])
        .select();

    if (error) throw error;
    return data;
};