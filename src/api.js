const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
    const token = localStorage.getItem('terp_token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    let res;
    try {
        res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    } catch (err) {
        throw new Error('Cannot connect to server. Check your network connection.');
    }

    // On 401, clear auth and redirect to login — but only if NOT already on auth pages
    if (res.status === 401) {
        const isAuthRoute = path.startsWith('/auth/login') || path.startsWith('/auth/register');
        if (!isAuthRoute) {
            localStorage.removeItem('terp_token');
            localStorage.removeItem('terp_user');
            window.location.href = '/login';
        }
        // Still try to parse the error body for auth routes
        let data;
        try { data = await res.json(); } catch { data = {}; }
        throw new Error(data.error || 'Invalid credentials');
    }

    // Try to parse response as JSON, with text fallback
    let data;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        try {
            data = await res.json();
        } catch {
            throw new Error(`Server returned invalid response (${res.status}). Please try again.`);
        }
    } else {
        // Server returned non-JSON (e.g. HTML error page from Express crash)
        let text = '';
        try { text = await res.text(); } catch { /* ignore */ }

        if (res.status >= 500) {
            throw new Error(`Server error (${res.status}). The server may need to restart — please try again.`);
        }
        throw new Error(`Unexpected response (${res.status}). Please try again.`);
    }

    if (!res.ok) {
        // Provide actionable messages for known error codes
        if (data.code === 'DB_PAUSED') {
            throw new Error('Database is waking up after inactivity. Please wait 30-60 seconds and try again.');
        }
        if (data.code === 'DB_UNREACHABLE' || data.code === 'DB_ERROR') {
            throw new Error(data.error || 'Service temporarily unavailable. Please try again in a moment.');
        }
        throw new Error(data.error || `Request failed (${res.status})`);
    }
    return data;
}

export const api = {
    // Auth
    login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (name, email, password) => request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
    me: () => request('/auth/me'),

    // Transactions
    getTransactions: (params = '') => request(`/transactions${params ? '?' + params : ''}`),
    getTransactionStats: () => request('/transactions/stats'),
    getRecentChart: (days = 30) => request(`/transactions/recent-chart?days=${days}`),
    createTransaction: (data) => request('/transactions', { method: 'POST', body: JSON.stringify(data) }),
    getTransaction: (id) => request(`/transactions/${id}`),
    updateTransaction: (id, data) => request(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    createTransactionCorrection: (id, data) => request(`/transactions/${id}/correction`, { method: 'POST', body: JSON.stringify(data) }),

    // Donors
    getDonors: () => request('/donors'),
    createDonor: (data) => request('/donors', { method: 'POST', body: JSON.stringify(data) }),
    getDonor: (id) => request(`/donors/${id}`),
    updateDonor: (id, data) => request(`/donors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteDonor: (id) => request(`/donors/${id}`, { method: 'DELETE' }),

    // Programs
    getPrograms: () => request('/programs'),
    createProgram: (data) => request('/programs', { method: 'POST', body: JSON.stringify(data) }),
    getProgram: (id) => request(`/programs/${id}`),
    updateProgram: (id, data) => request(`/programs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteProgram: (id) => request(`/programs/${id}`, { method: 'DELETE' }),

    // Public
    publicStats: () => request('/public/stats'),
    publicLedger: (page = 1, limit = 20, search = '') => request(`/public/ledger?page=${page}&limit=${limit}&search=${search}`),
    publicVerifyChain: () => request('/public/verify/chain'),
    publicVerifyTx: (txId) => request(`/public/verify/${txId}`),
    publicPrograms: () => request('/public/programs'),
    publicExport: () => request('/public/export'),

    // Solana Anchoring
    solanaAnchor: () => request('/solana/anchor', { method: 'POST' }),
    solanaAnchors: () => request('/solana/anchors'),
    solanaVerify: (signature) => request(`/solana/verify/${signature}`),
    solanaWallet: () => request('/solana/wallet'),
    solanaStatus: () => request('/solana/status'),

    // Activity Log
    getActivities: (page = 1, limit = 50, entityType = '') => request(`/activity?page=${page}&limit=${limit}${entityType ? '&entity_type=' + entityType : ''}`),
    getActivityStats: () => request('/activity/stats'),

    // Bank Reconciliation (factual bank-vs-ledger checks)
    reconciliationAccounts: () => request('/reconciliation/accounts'),
    reconciliationProviders: () => request('/reconciliation/providers'),
    reconciliationCreateAccount: (data) => request('/reconciliation/accounts', { method: 'POST', body: JSON.stringify(data) }),
    reconciliationImport: (data) => request('/reconciliation/import', { method: 'POST', body: JSON.stringify(data) }),
    reconciliationSync: (data) => request('/reconciliation/sync', { method: 'POST', body: JSON.stringify(data) }),
    reconciliationRun: (data) => request('/reconciliation/run', { method: 'POST', body: JSON.stringify(data) }),
    reconciliationLocks: () => request('/reconciliation/locks'),
    reconciliationReleaseLock: (id) => request(`/reconciliation/locks/${id}/release`, { method: 'POST' }),
    reconciliationStatus: () => request('/reconciliation/status'),
};
