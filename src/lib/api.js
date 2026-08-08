// Client for the new Node/Express + MongoDB API (migration off Firebase).
//
// Rollout is gated by VITE_USE_API so we can migrate one slice at a time
// without breaking the live site: when the flag is 'true', data goes to this
// API; otherwise callers keep using the existing Firebase path.

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const USE_API = import.meta.env.VITE_USE_API === 'true';

const TOKEN_KEY = 'iy_auth_token';
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
};

async function request(path, { method = 'GET', body, auth = false } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth) {
        const token = getToken();
        if (token) headers.Authorization = `Bearer ${token}`;
    }
    const res = await fetch(`${API_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });
    let data = {};
    try {
        data = await res.json();
    } catch {
        /* non-JSON response — leave data empty */
    }
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
}

export const api = {
    get: (path, opts) => request(path, { ...opts }),
    post: (path, body, opts) => request(path, { method: 'POST', body, ...opts }),
};
