const API_BASE = '/api';

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
        throw new Error('Cannot connect to server. Run: node server/index.cjs');
    }

    if (res.status === 401) {
        localStorage.removeItem('terp_token');
        localStorage.removeItem('terp_user');
        window.location.href = '/login';
        throw new Error('Unauthorized');
    }

    let data;
    try {
        data = await res.json();
    } catch (err) {
        throw new Error('Server returned invalid response. Is backend running on port 3001?');
    }

    if (!res.ok) throw new Error(data.error || 'Request failed');
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

    // Donors
    getDonors: () => request('/donors'),
    createDonor: (data) => request('/donors', { method: 'POST', body: JSON.stringify(data) }),
    getDonor: (id) => request(`/donors/${id}`),

    // Programs
    getPrograms: () => request('/programs'),
    createProgram: (data) => request('/programs', { method: 'POST', body: JSON.stringify(data) }),
    getProgram: (id) => request(`/programs/${id}`),

    // Public
    publicStats: () => request('/public/stats'),
    publicLedger: (page = 1, limit = 20, search = '') => request(`/public/ledger?page=${page}&limit=${limit}&search=${search}`),
    publicVerifyChain: () => request('/public/verify/chain'),
    publicVerifyTx: (txId) => request(`/public/verify/${txId}`),
    publicPrograms: () => request('/public/programs'),
    publicExport: () => request('/public/export'),
};
