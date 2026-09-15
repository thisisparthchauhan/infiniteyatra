/**
 * THE single place the frontend talks to the backend.
 *
 * URL CONTRACT
 *   Production serves the React app and the API from the same origin
 *   (https://www.infiniteyatra.com), so the base is empty and every request is
 *   a same-origin `/api/...`. That is the strongest posture available: no CORS
 *   grant, and the session cookie is first-party.
 *
 *   VITE_API_BASE_URL exists only for a split-origin development setup. It is
 *   normalised so a value that already ends in `/api` cannot produce `/api/api`
 *   — the exact bug that made booking calls 404 in a way that looked like an
 *   auth failure.
 *
 * SESSIONS
 *   Authentication is an httpOnly cookie. There is no token in localStorage and
 *   no Authorization header, so script on the page — including anything
 *   injected — cannot read or replay the session.
 */

const RAW_BASE = (import.meta.env?.VITE_API_BASE_URL || '').trim();

export function normaliseBase(raw) {
    const base = String(raw || '').trim().replace(/\/+$/, '');
    if (base === '') return '';
    return base.replace(/\/api$/i, '');
}

export const API_BASE = normaliseBase(RAW_BASE);

export function buildApiUrl(path, base = API_BASE) {
    const p = String(path || '');
    if (!p.startsWith('/')) throw new Error(`API path must start with "/": received "${p}"`);
    const route = p.replace(/^\/api(?=\/|$)/i, '') || '/';
    return `${normaliseBase(base)}/api${route}`;
}

export class ApiError extends Error {
    constructor(message, { status, code, details } = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status ?? 0;
        this.code = code || '';
        this.details = Array.isArray(details) ? details : [];
    }
}

/** Test seam. Production uses the real fetch. */
let _fetch = (...args) => globalThis.fetch(...args);
export function __setFetchForTesting(fn) { _fetch = fn || ((...a) => globalThis.fetch(...a)); }

async function request(path, { method = 'GET', body } = {}) {
    let res;
    try {
        res = await _fetch(buildApiUrl(path), {
            method,
            headers: { 'Content-Type': 'application/json' },
            // Sends and accepts the session cookie.
            credentials: 'include',
            body: body === undefined ? undefined : JSON.stringify(body),
        });
    } catch {
        throw new ApiError('We could not reach the server. Please check your connection.', { status: 0 });
    }

    if (res.status === 204) return null;

    let payload = null;
    try { payload = await res.json(); } catch { /* empty or non-JSON body */ }

    if (!res.ok) {
        throw new ApiError(payload?.error || 'Something went wrong. Please try again.', {
            status: res.status, code: payload?.code, details: payload?.details,
        });
    }
    return payload;
}

export const api = {
    get: (path) => request(path),
    post: (path, body) => request(path, { method: 'POST', body }),
    patch: (path, body) => request(path, { method: 'PATCH', body }),
    del: (path) => request(path, { method: 'DELETE' }),
};

// --- customer auth ---------------------------------------------------------

export const authApi = {
    register: (data) => api.post('/auth/register', data),
    login: (email, password) => api.post('/auth/login', { email, password }),
    logout: () => api.post('/auth/logout'),
    me: () => api.get('/auth/me'),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
};

// --- catalogue -------------------------------------------------------------

export const catalogueApi = {
    listPackages: () => api.get('/catalogue/packages'),
    getPackage: (slug) => api.get(`/catalogue/packages/${encodeURIComponent(slug)}`),
    listHotels: () => api.get('/catalogue/hotels'),
    listContent: (kind) => api.get(`/catalogue/content/${encodeURIComponent(kind)}`),
};

// --- bookings --------------------------------------------------------------

export const bookingApi = {
    create: (payload) => api.post('/bookings', payload),
    list: () => api.get('/bookings'),
    get: (id) => api.get(`/bookings/${encodeURIComponent(id)}`),
    ensureSummary: (id) => api.post(`/bookings/${encodeURIComponent(id)}/summary`),
    getSummary: (id) => api.get(`/bookings/${encodeURIComponent(id)}/summary`),
};

// --- staff -----------------------------------------------------------------

export const staffApi = {
    login: (email, password) => api.post('/staff/auth/login', { email, password }),
    logout: () => api.post('/staff/auth/logout'),
    me: () => api.get('/staff/auth/me'),
    listPackages: () => api.get('/admin/packages'),
    updatePackage: (id, patch) => api.patch(`/admin/packages/${id}`, patch),
    createPackage: (data) => api.post('/admin/packages', data),
    listHotels: () => api.get('/admin/hotels'),
    updateHotel: (id, patch) => api.patch(`/admin/hotels/${id}`, patch),
    listBookings: () => api.get('/admin/bookings'),
    getBooking: (id) => api.get(`/admin/bookings/${encodeURIComponent(id)}`),
    setBookingStatus: (id, bookingStatus) => api.patch(`/admin/bookings/${encodeURIComponent(id)}/status`, { bookingStatus }),
    recordPayment: (id, payload) => api.post(`/admin/bookings/${encodeURIComponent(id)}/payments`, payload),
};

export const capabilitiesApi = { get: () => api.get('/capabilities') };

/** Turn an ApiError into something a customer should read. */
export function toUserMessage(err) {
    if (!(err instanceof ApiError)) return 'Something went wrong. Please try again.';
    if (err.status === 401) return 'Please sign in to continue.';
    if (err.status === 403) return 'You do not have access to this.';
    if (err.status === 404) return 'We could not find that.';
    if (err.status === 409) return err.message;
    if (err.status === 423) return 'This account is temporarily locked. Please try again shortly.';
    if (err.status === 429) return 'Too many attempts. Please wait a moment and try again.';
    if (err.details.length) return err.details[0];
    return err.message;
}
