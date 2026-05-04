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
                pass_threshold: 0.7,
                is_active: true,
                // Default threshold for your thesis project
            }
        ])
        .select();

    if (error) throw error;
    return data;
};


export const getRandomStudyCase = async () => {
    const { count, error: countError } = await supabase
        .from('study_cases')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

    if (countError) throw countError;
    if (count === 0 || count === null) return null;

    const randomIndex = Math.floor(Math.random() * count);

    const { data, error: fetchError } = await supabase
        .from('study_cases')
        .select('*')
        .eq('is_active', true)
        .range(randomIndex, randomIndex)
        .single();

    if (fetchError) throw fetchError;
    return data;
};

export const getStudyCaseById = async (id: string) => {
    const { data, error } = await supabase
        .from('study_cases')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
};