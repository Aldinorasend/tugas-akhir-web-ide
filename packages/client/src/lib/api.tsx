export const API_URL = "http://localhost:4000/api";

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
    const response = await fetch(`${API_URL}/study-cases/random`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        throw new Error('Gagal mengambil data dari server');
    }
    return response.json();
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

export const graderDiagram = async (user_id: string, exerciseId: string, nodes: any[], edges: any[], diagramMetrics: any, experiment_group: string = "CONTROL") => {
    const response = await fetch(`${API_URL}/grader/grade-diagram`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id, exerciseId, nodes, edges, diagramMetrics, experiment_group }),
    });
    if (!response.ok) {
        throw new Error('Gagal menilai diagram');
    }
    return response.json();
}

interface JavaFile {
    path: string;
    content: string;
}


export const compareCode = async (
    user_id: string,
    exerciseId: string,
    current_code: JavaFile[],
    codeMetrics: any,
    logic_rules: string[],
    experiment_group: string = "CONTROL"
) => {
    const response = await fetch(`${API_URL}/grader/compare-code`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id, exerciseId, current_code, codeMetrics, logic_rules, experiment_group }),
    });

    if (!response.ok) {
        throw new Error('Gagal menilai kode');
    }
    return response.json();
}
