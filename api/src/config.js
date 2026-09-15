/**
 * Environment configuration, validated once at startup.
 *
 * The API refuses to boot in production with a missing or weak secret rather
 * than starting and silently issuing forgeable sessions. In development it
 * falls back so a contributor can run it without ceremony.
 */

const isProd = process.env.NODE_ENV === 'production';

function required(name, fallback) {
    const v = process.env[name];
    if (v !== undefined && v !== '') return v;
    if (!isProd && fallback !== undefined) return fallback;
    throw new Error(`Missing required environment variable: ${name}`);
}

function int(name, fallback) {
    const v = process.env[name];
    if (v === undefined || v === '') return fallback;
    const n = Number.parseInt(v, 10);
    if (!Number.isFinite(n)) throw new Error(`${name} must be an integer`);
    return n;
}

const SESSION_SECRET = required('SESSION_SECRET', 'dev-only-insecure-secret-change-me');
if (isProd && SESSION_SECRET.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters in production');
}

export const config = Object.freeze({
    isProd,
    env: process.env.NODE_ENV || 'development',
    port: int('PORT', 3000),

    db: Object.freeze({
        host: required('DB_HOST', '127.0.0.1'),
        port: int('DB_PORT', 3306),
        database: required('DB_NAME', 'iy_test'),
        user: required('DB_USER', 'iy_test'),
        password: required('DB_PASSWORD', 'iy_test_local_only'),
        connectionLimit: int('DB_POOL_SIZE', 10),
    }),

    /**
     * Rate limits, tunable per environment. Defaults are the production values;
     * the test suite raises them so that exercising many flows in one process
     * does not trip a limiter that is doing its job, and one dedicated test
     * lowers them to prove the limiter still engages.
     */
    rateLimits: Object.freeze({
        authMax: int('RATE_LIMIT_AUTH_MAX', 20),
        staffAuthMax: int('RATE_LIMIT_STAFF_AUTH_MAX', 10),
        bookingCreateMax: int('RATE_LIMIT_BOOKING_MAX', 20),
        globalMax: int('RATE_LIMIT_GLOBAL_MAX', 600),
    }),

    sessionSecret: SESSION_SECRET,
    sessionTtlDays: int('SESSION_TTL_DAYS', 30),

    // Same-origin in production: the frontend and /api share www.infiniteyatra.com,
    // so no cross-origin grant is needed at all.
    appOrigin: required('APP_ORIGIN', 'http://localhost:5173'),
    publicAppUrl: required('PUBLIC_APP_URL', 'http://localhost:5173'),

    /**
     * Private document/PDF storage. OFF unless an absolute path OUTSIDE the
     * web root is configured. Identity documents must never be written under
     * public_html, so the default is refusal rather than a guessed directory.
     */
    storage: Object.freeze({
        privateDir: process.env.PRIVATE_STORAGE_DIR || '',
        get enabled() {
            const d = process.env.PRIVATE_STORAGE_DIR || '';
            return d.startsWith('/') && !d.includes('public_html');
        },
    }),
});

export const capabilities = () => ({
    bookingCreate: true,
    bookingRead: true,
    documentUpload: config.storage.enabled,
    bookingSummaryPdf: config.storage.enabled,
});
