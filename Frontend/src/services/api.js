// ============================================================
//  services/api.js  — Centralized API Service Layer
//  All backend calls live here. Components stay clean.
// ============================================================

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/** Build headers, injecting the JWT token when available */
function authHeaders(token, isFormData = false, extra = {}) {
    const headers = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...extra,
    };
    if (!isFormData && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }
    return headers;
}

/**
 * Core fetch wrapper.
 * Returns { data, ok, status, error }
 * Never throws — always resolves.
 */
async function apiFetch(path, options = {}, token = null) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const isFormData = options.body instanceof FormData;
        const res = await fetch(`${BASE_URL}${path}`, {
            ...options,
            headers: authHeaders(token, isFormData, options.headers),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        let data = null;
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await res.json();
        }

        return { data, ok: res.ok, status: res.status, error: null };
    } catch (err) {
        let errorMessage = err.message || 'Network error';

        if (err.name === 'AbortError') {
            errorMessage = 'Request timeout. Server is not responding.';
        } else if (err.message === 'Failed to fetch') {
            errorMessage = `Cannot connect to server at ${BASE_URL}. Is the backend running?`;
        }

        console.error(`[API] ${options.method || 'GET'} ${path} failed:`, err);
        return { data: null, ok: false, status: 0, error: errorMessage };
    }
}

// ── Auth ─────────────────────────────────────────────────────

export const login = (email, password) =>
    apiFetch('/api/users/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });

export const signUp = (name, email, password) =>
    apiFetch('/api/users/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
    });

export const resetPassword = (email, newPassword) =>
    apiFetch('/api/users/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, newPassword }),
    });

export const googleAuth = (credential) =>
    apiFetch('/api/users/google', {
        method: 'POST',
        body: JSON.stringify({ credential }),
    });


// ── Complaints ───────────────────────────────────────────────

export const fetchComplaints = (token) =>
    apiFetch('/api/complaints', {}, token);

export const createComplaint = (complaintData, token) => {
    // If it's already a FormData object, pass it directly
    const isFormData = complaintData instanceof FormData;
    return apiFetch('/api/complaints', {
        method: 'POST',
        body: isFormData ? complaintData : JSON.stringify(complaintData),
    }, token);
};

export const updateComplaint = (id, updateData, token) =>
    apiFetch(`/api/complaints/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
    }, token);

export const deleteComplaint = (id, token) =>
    apiFetch(`/api/complaints/${id}`, {
        method: 'DELETE',
    }, token);


// ── Dashboard ────────────────────────────────────────────────

export const fetchCitizenDashboard = (email, token) =>
    apiFetch(`/api/dashboard/citizen/${email}`, {}, token);

export const fetchAdminDashboard = (token) =>
    apiFetch('/api/dashboard/admin', {}, token);

export const fetchStaffDashboard = (name, token) =>
    apiFetch(`/api/dashboard/staff/${name}`, {}, token);


// ── Tax ──────────────────────────────────────────────────────

export const fetchTaxRecords = (email, token) =>
    apiFetch(`/api/tax/user/${email}`, {}, token);

export const fetchAllTaxes = (token) =>
    apiFetch('/api/tax', {}, token);

export const createTax = (taxData, token) =>
    apiFetch('/api/tax', {
        method: 'POST',
        body: JSON.stringify(taxData),
    }, token);

export const generateDemoTax = (email, token) =>
    apiFetch('/api/tax/generate', {
        method: 'POST',
        body: JSON.stringify({ email }),
    }, token);

export const payTax = (id, token) =>
    apiFetch(`/api/tax/${id}/pay`, {
        method: 'PATCH',
    }, token);


// ── Pensions ─────────────────────────────────────────────────

export const fetchPensions = (email, token) =>
    apiFetch(`/api/pensions/user/${email}`, {}, token);

export const fetchAllPensions = (token) =>
    apiFetch('/api/pensions', {}, token);

export const applyForPension = (pensionData, token) =>
    apiFetch('/api/pensions', {
        method: 'POST',
        body: JSON.stringify(pensionData),
    }, token);


// ── Certificates ─────────────────────────────────────────────

export const fetchCertificates = (email, token) =>
    apiFetch(`/api/certificates/user/${email}`, {}, token);

export const fetchAllCertificates = (token) =>
    apiFetch('/api/certificates', {}, token);

export const applyCertificate = (certData, token) =>
    apiFetch('/api/certificates', {
        method: 'POST',
        body: JSON.stringify(certData),
    }, token);


// ── Announcements ────────────────────────────────────────────

export const fetchAnnouncements = (token) =>
    apiFetch('/api/announcements', {}, token);

export const createAnnouncement = (announcementData, token) =>
    apiFetch('/api/announcements', {
        method: 'POST',
        body: JSON.stringify(announcementData),
    }, token);

export const deleteAnnouncement = (id, token) =>
    apiFetch(`/api/announcements/${id}`, {
        method: 'DELETE',
    }, token);


// ── Staff Management (Admin) ─────────────────────────────────

export const fetchStaffMembers = (token) =>
    apiFetch('/api/users/staff', {}, token);

export const createStaffMember = (staffData, token) =>
    apiFetch('/api/users/staff', {
        method: 'POST',
        body: JSON.stringify(staffData),
    }, token);

export const toggleStaffStatus = (id, token) =>
    apiFetch(`/api/users/staff/${id}`, {
        method: 'PATCH',
    }, token);

export const deleteStaffMember = (id, token) =>
    apiFetch(`/api/users/staff/${id}`, {
        method: 'DELETE',
    }, token);


// ── Profile & Settings ───────────────────────────────────────

export const updateProfile = (profileData, token) => {
    const isFormData = profileData instanceof FormData;
    return apiFetch('/api/users/profile', {
        method: 'PATCH',
        body: isFormData ? profileData : JSON.stringify(profileData),
    }, token);
};

export const changePassword = (passwordData, token) =>
    apiFetch('/api/users/change-password', {
        method: 'PUT',
        body: JSON.stringify(passwordData),
    }, token);


// ── Support Center ───────────────────────────────────────────

export const fetchMyTickets = (token) =>
    apiFetch('/api/support/my-tickets', {}, token);

export const createSupportTicket = (ticketData, token) =>
    apiFetch('/api/support/tickets', {
        method: 'POST',
        body: JSON.stringify(ticketData),
    }, token);

export const fetchAllSupportTickets = (token) =>
    apiFetch('/api/support/tickets', {}, token);

export const updateSupportTicket = (id, updateData, token) =>
    apiFetch(`/api/support/tickets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
    }, token);

// ── AI Chatbot ───────────────────────────────────────────────

export const sendChatbotMessage = (message, history, file = null) => {
    if (file) {
        const formData = new FormData();
        formData.append('message', message);
        formData.append('history', JSON.stringify(history));
        formData.append('image', file);
        return apiFetch('/api/chatbot/message', {
            method: 'POST',
            body: formData,
        });
    }

    return apiFetch('/api/chatbot/message', {
        method: 'POST',
        body: JSON.stringify({ message, history }),
    });
};

// ── AI Agents ────────────────────────────────────────────────

export const runAIComplaintAnalyzer = (text, ward, token) =>
    apiFetch('/api/ai/complaint-analyzer', {
        method: 'POST',
        body: JSON.stringify({ text, ward }),
    }, token);

export const runAIImageVerification = (formData, token) =>
    apiFetch('/api/ai/image-verification', {
        method: 'POST',
        body: formData,
    }, token);

export const fetchGovernanceAnalytics = (token, from, to) => {
    let url = '/api/ai/governance-analytics';
    if (from || to) {
        const params = new URLSearchParams();
        if (from) params.append('from', from);
        if (to) params.append('to', to);
        url += `?${params.toString()}`;
    }
    return apiFetch(url, {}, token);
};

export const fetchComplaintHeatmap = (token, from, to) => {
    let url = '/api/ai/complaint-heatmap';
    if (from || to) {
        const params = new URLSearchParams();
        if (from) params.append('from', from);
        if (to) params.append('to', to);
        url += `?${params.toString()}`;
    }
    return apiFetch(url, {}, token);
};

export const generateAIReport = (token, from, to, name) => {
    let url = '/api/ai/report';
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (name) params.append('name', name);
    url += `?${params.toString()}`;
    return apiFetch(url, {}, token);
};

export const processVoiceComplaint = (audioBlob, token) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice_complaint.webm');
    return apiFetch('/api/ai/voice', {
        method: 'POST',
        body: formData,
    }, token);
};
