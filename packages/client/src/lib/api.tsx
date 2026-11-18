export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * ============================================================
 * ERROR HANDLING TERPUSAT
 * ============================================================
 * Semua request API lewat apiFetch() agar pesan error yang
 * tampil ke user SELALU jelas, bukan error mentah seperti
 * "SyntaxError: Unexpected token '<'" (yang terjadi kalau
 * server balikin HTML karena mati/404).
 */

export class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

const parseResponse = async (response: Response, fallbackMessage: string) => {
    const raw = await response.text();

    // Coba parse JSON secara aman (body bisa kosong atau HTML)
    let data: any = null;
    try {
        data = raw ? JSON.parse(raw) : null;
    } catch {
        data = null;
    }

    // Body bukan JSON valid (mis. halaman HTML error / body kosong)
    if (data === null) {
        throw new ApiError(
            `${fallbackMessage} — server merespons dengan format tidak valid (HTTP ${response.status}). ` +
            `Pastikan API server berjalan di ${API_URL}.`,
            response.status
        );
    }

    // Server merespons JSON tapi dengan status error
    if (!response.ok) {
        throw new ApiError(
            data.message || data.error || `${fallbackMessage} (HTTP ${response.status})`,
            response.status
        );
    }

    return data;
};

export const apiFetch = async (
    url: string,
    options: RequestInit,
    fallbackMessage: string
) => {
    let response: Response;
    try {
        response = await fetch(url, options);
    } catch (err: any) {
        // Fetch gagal total: server mati / DNS gagal / CORS diblokir
        throw new ApiError(
            `Tidak bisa terhubung ke server API (${API_URL}). ` +
            'Pastikan backend sudah berjalan, lalu coba lagi.',
            0
        );
    }
    return parseResponse(response, fallbackMessage);
};

// -------------------------------------------------------------

export const getAllStudyCases = async () => {
    return apiFetch(
        `${API_URL}/api/study-cases`,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } },
        'Gagal mengambil data study case'
    );
};

export const getStudyCaseById = async (id: string) => {
    return apiFetch(
        `${API_URL}/api/study-cases/${id}`,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } },
        'Gagal mengambil data study case'
    );
};

export const createStudyCase = async (studyCase: any) => {
    return apiFetch(
        `${API_URL}/api/study-cases`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studyCase),
        },
        'Gagal membuat study case'
    );
};

export const getRandomStudyCase = async () => {
    return apiFetch(
        `${API_URL}/api/study-cases/random`,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } },
        'Gagal mengambil study case acak'
    );
};

export const updateStudyCase = async (id: string, studyCase: any) => {
    return apiFetch(
        `${API_URL}/api/study-cases/${id}`,
        {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studyCase),
        },
        'Gagal memperbarui study case'
    );
};

export const deleteStudyCase = async (id: string) => {
    return apiFetch(
        `${API_URL}/api/study-cases/${id}`,
        { method: 'DELETE', headers: { 'Content-Type': 'application/json' } },
        'Gagal menghapus study case'
    );
};

const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const graderDiagram = async (user_id: string, exerciseId: string, nodes: any[], edges: any[], diagramMetrics: any, experiment_group: string = "CONTROL") => {
    return apiFetch(
        `${API_URL}/api/grader/grade-diagram`,
        {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ user_id, exerciseId, nodes, edges, diagramMetrics, experiment_group }),
        },
        'Gagal menilai diagram'
    );
};

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
    return apiFetch(
        `${API_URL}/api/grader/compare-code`,
        {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ user_id, exerciseId, current_code, codeMetrics, logic_rules, experiment_group }),
        },
        'Gagal menilai kode'
    );
};

export const getLecturerDashboardData = async () => {
    return apiFetch(
        `${API_URL}/api/lecturer/dashboard/data`,
        { method: 'GET', headers: getAuthHeaders() },
        'Gagal mengambil data dashboard dosen'
    );
};
