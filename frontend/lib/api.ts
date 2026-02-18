import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
    baseURL: API_URL,
});

export interface Document {
    id: number;
    filename: string;
    status: string;
    doc_type?: string;
    created_at: string;
    open_findings: number;
    extraction_result?: any;
}

export interface Finding {
    id: number;
    document_id: number;
    finding_type: string;
    severity: string;
    description: string;
    evidence: any;
    status: string;
}

export interface DashboardStats {
    processing: number;
    needs_review: number;
    completed: number;
    failed: number;
    open_findings: number;
    total: number;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
    const res = await api.get('/dashboard/stats');
    return res.data;
};

export const getDocuments = async () => {
    const res = await api.get('/documents');
    return res.data;
};

export const getDocument = async (id: number) => {
    const res = await api.get(`/documents/${id}/extraction`);
    return res.data;
};

export const getFindings = async (id: number) => {
    const res = await api.get(`/documents/${id}/findings`);
    return res.data.findings;
};

export const reviewFinding = async (id: number, decision: 'APPROVE' | 'OVERRIDE', comment?: string) => {
    await api.post(`/findings/${id}/review`, { decision, comment });
};

export const uploadDocument = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    await api.post('/upload', formData);
};

export const getDocumentPdfUrl = async (id: number): Promise<string> => {
    const res = await api.get(`/documents/${id}/pdf`);
    return res.data.url;
};

export const analyzeDocument = async (id: number) => {
    const res = await api.post(`/documents/${id}/analyze`);
    return res.data;
};

export const triggerRiskAssessment = async (id: number): Promise<{ status: string; task_id: string }> => {
    const res = await api.post(`/contracts/${id}/risk_assessment`);
    return res.data;
};

export const getTaskStatus = async (taskId: string): Promise<{ task_id: string; state: string; result?: any; error?: string }> => {
    const res = await api.get(`/tasks/${taskId}/status`);
    return res.data;
};

/**
 * Poll a Celery task until it completes or fails.
 * Returns the task result on success, throws on failure.
 */
export const pollTaskUntilDone = async (
    taskId: string,
    intervalMs = 2000,
    maxAttempts = 60
): Promise<any> => {
    for (let i = 0; i < maxAttempts; i++) {
        const status = await getTaskStatus(taskId);
        if (status.state === 'SUCCESS') return status.result;
        if (status.state === 'FAILURE') throw new Error(status.error || 'Task failed');
        await new Promise(r => setTimeout(r, intervalMs));
    }
    throw new Error('Task timed out');
};
