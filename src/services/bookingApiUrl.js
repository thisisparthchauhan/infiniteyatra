/**
 * CUTOVER — the single place a booking API URL is constructed.
 *
 * THE BUG THIS EXISTS TO PREVENT
 * Three clients each built `${BASE_URL}/api${path}` independently, while the
 * documented staging value of VITE_BOOKING_API_BASE_URL was
 * `https://us-central1-infiniteyatra-iy.cloudfunctions.net/api` — a base that
 * already ends in /api. That combination produces /api/api/bookings/... , which
 * 404s in a way that looks like an auth failure. The path prefix is now applied
 * exactly once, here, and a base that already carries it is normalised.
 *
 * THE CONTRACT
 *   - VITE_BOOKING_API_BASE_URL is an ORIGIN, with or without a trailing /api.
 *   - Callers pass a route path WITHOUT the /api prefix, e.g. '/bookings/x'.
 *   - Exactly one '/api' appears in the result, and no '//' outside the scheme.
 *
 * Empty base means same-origin '/api/...', which is what local dev (Vite proxy)
 * and Firebase Hosting rewrites both expect.
 */

/** Strip trailing slashes and one trailing '/api' so the prefix is never doubled. */
export function normaliseBase(rawBase) {
    const base = String(rawBase || '').trim().replace(/\/+$/, '');
    if (base === '') return '';
    return base.replace(/\/api$/i, '');
}

/**
 * Build a full booking API URL.
 * @param {string} path route path beginning with '/', without the '/api' prefix
 */
export function buildBookingApiUrl(path, rawBase) {
    const p = String(path || '');
    if (!p.startsWith('/')) {
        throw new Error(`booking API path must start with "/": received "${p}"`);
    }
    // Tolerate a caller that already prefixed, rather than emitting /api/api.
    const route = p.replace(/^\/api(?=\/|$)/i, '') || '/';
    return `${normaliseBase(rawBase)}/api${route}`;
}

/** The configured base for this build. Empty string means same-origin. */
export const BOOKING_API_BASE_URL = normaliseBase(
    typeof import.meta !== 'undefined' && import.meta.env
        ? import.meta.env.VITE_BOOKING_API_BASE_URL
        : '',
);

/** Bound to the build's configured base — what the API clients call. */
export function bookingApiUrl(path) {
    return buildBookingApiUrl(path, BOOKING_API_BASE_URL);
}
