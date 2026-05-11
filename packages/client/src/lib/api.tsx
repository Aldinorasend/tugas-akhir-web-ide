// lib/api.ts
import { supabase } from "./supabase";
const API_URL = "http://localhost:4000/api";

export const getAllStudyCases = async () => {
    const response = await fetch(`${API_URL}/study-cases`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        throw new Error('Gagal mengambil data dari server');
    }

    return response.json();
}

export const getStudyCaseById = async (id: string) => {
    const response = await fetch(`${API_URL}/study-cases/${id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        throw new Error('Gagal mengambil data dari server');
    }

    return response.json();
}

export const createStudyCase = async (studyCase: any) => {
    const response = await fetch(`${API_URL}/study-cases`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(studyCase),
    });
    if (!response.ok) {
        throw new Error('Gagal membuat study case');
    }
    return response.json();
}

export const getRandomStudyCase = async () => {
    const { count, error: countError } = await supabase
        .from('study_cases')
        .select('*', { count: 'exact', head: true })

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

export const updateStudyCase = async (id: string, studyCase: any) => {
    const response = await fetch(`${API_URL}/study-cases/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(studyCase),
    });
    if (!response.ok) {
        throw new Error('Gagal memperbarui study case');
    }
    return response.json();
};

export const deleteStudyCase = async (id: string) => {
    const response = await fetch(`${API_URL}/study-cases/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        throw new Error('Gagal menghapus study case');
    }
    return response.json();
};
