import { supabase } from "../../config/supabase.js";

export const getAllStudyCases = async (req, res) => {
    const { data, error } = await supabase
        .from('exercises')
        .select('*, diagram_rules(*)');

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    const formattedData = data.map(item => {
        const diagram_rules = item.diagram_rules && item.diagram_rules.length > 0
            ? item.diagram_rules[0]
            : null;
        return {
            ...item,
            diagram_rules,
            answer_key: diagram_rules // backward-compatibility for pages expecting answer_key
        };
    });

    res.json({
        status: "ok",
        data: formattedData
    });
}

export const getStudyCaseById = async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase
        .from('exercises')
        .select('*, diagram_rules(*)')
        .eq('id', id);

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    if (!data || data.length === 0) {
        return res.status(404).json({ error: "Study case not found" });
    }

    const item = data[0];
    const diagram_rules = item.diagram_rules && item.diagram_rules.length > 0
        ? item.diagram_rules[0]
        : null;

    const formattedData = {
        ...item,
        diagram_rules,
    };

    res.json({
        status: "ok",
        data: formattedData
    });
}

export const createStudyCase = async (req, res) => {
    const { title, description, initial_code, category, nodes, edges, logic_rules } = req.body;
    try {
        const { data: studyCase, error: caseError } = await supabase
            .from('exercises')
            .insert({ title, description, initial_code, category })
            .select()
            .single(); // Ambil satu object hasil insert

        if (caseError) throw caseError;

        const exerciseId = studyCase.id;

        const { data: diagram, error: diagramError } = await supabase
            .from('diagram_rules')
            .insert({ nodes, edges, exercise_id: exerciseId, logic_rules })
            .select();

        if (diagramError) throw diagramError;

        res.json({
            status: "ok",
            data: { studyCase, diagram }
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }


}

export const updateStudyCase = async (req, res) => {
    const { id } = req.params;
    const { title, description, initial_code, category, nodes, edges, logic_rules } = req.body;

    try {
        // 1. Update exercises table
        const { data: studyCase, error: caseError } = await supabase
            .from('exercises')
            .update({ title, description, initial_code, category })
            .eq('id', id)
            .select();

        if (caseError) throw caseError;

        // 2. Update or insert diagram_rules table
        const { data: existingRules, error: fetchError } = await supabase
            .from('diagram_rules')
            .select('id')
            .eq('exercise_id', id);

        if (fetchError) throw fetchError;

        let diagram;
        if (existingRules && existingRules.length > 0) {
            const { data: updatedDiagram, error: diagramError } = await supabase
                .from('diagram_rules')
                .update({ nodes, edges, logic_rules })
                .eq('exercise_id', id)
                .select();
            if (diagramError) throw diagramError;
            diagram = updatedDiagram;
        } else {
            const { data: insertedDiagram, error: diagramError } = await supabase
                .from('diagram_rules')
                .insert({ nodes, edges, exercise_id: id, logic_rules })
                .select();
            if (diagramError) throw diagramError;
            diagram = insertedDiagram;
        }

        const diagram_rules = diagram && diagram.length > 0 ? diagram[0] : null;
        const formattedData = studyCase && studyCase.length > 0 ? {
            ...studyCase[0],
            diagram_rules,
            answer_key: diagram_rules // backward-compatibility for pages expecting answer_key
        } : null;

        res.json({
            status: "ok",
            data: formattedData
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

export const deleteStudyCase = async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Delete associated diagram rules first to prevent foreign key constraint issues
        const { error: diagramError } = await supabase
            .from('diagram_rules')
            .delete()
            .eq('exercise_id', id);

        if (diagramError) throw diagramError;

        // 2. Delete the main exercise row
        const { data, error: exerciseError } = await supabase
            .from('exercises')
            .delete()
            .eq('id', id)
            .select('*');

        if (exerciseError) throw exerciseError;

        res.json({
            status: "ok",
            data: data
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

export const randomStudyCase = async (req, res) => {
    try {
        // 1. Get count of active exercises
        const { count, error: countError } = await supabase
            .from('exercises')
            .select('*', { count: 'exact', head: true })
        // .eq('is_active', true);

        if (countError) throw countError;
        if (!count) {
            return res.json({
                status: "ok",
                data: null
            });
        }

        // 2. Choose a random index
        const randomIndex = Math.floor(Math.random() * count);

        // 3. Fetch single active exercise at that index
        const { data, error } = await supabase
            .from('exercises')
            .select('*, diagram_rules(*)')
            // .eq('is_active', true)
            .range(randomIndex, randomIndex)
            .single();

        if (error) throw error;

        const diagram_rules = data.diagram_rules && data.diagram_rules.length > 0
            ? data.diagram_rules[0]
            : null;

        const formattedData = {
            ...data,
            diagram_rules,
            answer_key: diagram_rules
        };

        res.json({
            status: "ok",
            data: formattedData
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

