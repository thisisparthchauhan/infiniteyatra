/**
 * CUTOVER — the PB-only production booking API.
 *
 * A deliberately small Express app carrying ONLY what the live site needs to
 * take and show a booking. The legacy monolith in functions/index.js is not
 * reused and is not imported, because importing it would:
 *
 *   - mount routes that must never reach production in their current state:
 *     the Razorpay order/verify pair that trusts a client-supplied `amount`,
 *     a webhook whose signature verification is disabled, legacy invoice
 *     generation, OAuth/2FA session endpoints, and createStaffAccount
 *   - require ./security, which reads JWT_SECRET AT MODULE LOAD and throws on a
 *     production runtime without it — so the booking API would refuse to start
 *     over a secret it never uses
 *
 * Exposed surface, and nothing else:
 *   GET    /health
 *   POST   /api/bookings/package
 *   GET    /api/bookings/:bookingId
 *   *      /api/bookings/:bookingId/documents...   (PB-3, storage-gated)
 *   *      /api/bookings/:bookingId/summary...     (PB-4, storage-gated)
 */

'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { registerPackageBookingRoutes } = require('./packageBookings');
const { capabilities, isProductionRuntime, requireStorage } = require('./bookingCapabilities');

/** The only origins allowed to call the authenticated API in production. */
const PRODUCTION_ORIGINS = Object.freeze([
    'https://www.infiniteyatra.com',
    'https://infiniteyatra.com',
]);

/** Added only when this is demonstrably not a production runtime. */
const DEVELOPMENT_ORIGINS = Object.freeze([
    'http://localhost:5173',
    'http://localhost:4173',
]);

function allowedOrigins(env = process.env) {
    return isProductionRuntime(env)
        ? [...PRODUCTION_ORIGINS]
        : [...PRODUCTION_ORIGINS, ...DEVELOPMENT_ORIGINS];
}

/**
 * Strict allowlist. Never `origin: true` and never '*': every route here is
 * authenticated, and a wildcard would let any site drive a signed-in customer's
 * browser against their own booking data.
 *
 * A request with no Origin header (server-to-server, curl, a health probe) is
 * allowed through CORS — CORS is a browser control, and blocking it here would
 * not add security while breaking uptime checks. Authentication and ownership
 * still apply to every route.
 */
function corsOptions(env = process.env) {
    const allow = allowedOrigins(env);
    return {
        origin(origin, callback) {
            if (!origin) return callback(null, true);
            if (allow.includes(origin)) return callback(null, true);
            return callback(null, false);
        },
        credentials: false,
        methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Authorization', 'Content-Type', 'Idempotency-Key'],
        maxAge: 3600,
    };
}

function createBookingApiApp({ env = process.env } = {}) {
    const app = express();

    app.disable('x-powered-by');
    app.set('trust proxy', true);

    app.use(cors(corsOptions(env)));
    app.use(helmet());
    app.use(express.json({ limit: '1mb' }));

    /**
     * Liveness only. No version, no project id, no region, no bucket name, no
     * dependency status — a health endpoint is unauthenticated, so anything it
     * returns is public.
     */
    app.get(['/health', '/api/health'], (req, res) => {
        res.status(200).json({ status: 'ok', service: 'iy-booking-api' });
    });

    const createLimiter = rateLimit({
        windowMs: 60 * 60 * 1000,
        max: 20,
        message: { error: 'Too many booking attempts, please try again later' },
        standardHeaders: true,
        legacyHeaders: false,
    });

    const readLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 300,
        standardHeaders: true,
        legacyHeaders: false,
    });

    // Storage-backed features are refused before any handler runs, so a
    // disabled bucket produces one clean 503 rather than a failure deep inside
    // an upload or a PDF render.
    const storageGuard = requireStorage(env);
    app.use(['/bookings/:bookingId/documents', '/api/bookings/:bookingId/documents'], storageGuard);
    app.use(['/bookings/:bookingId/summary', '/api/bookings/:bookingId/summary'], storageGuard);

    registerPackageBookingRoutes(app, { createLimiter, readLimiter });

    // Anything not named above does not exist here.
    app.use((req, res) => res.status(404).json({ error: 'Not found' }));

    // Terminal handler: never leak a stack or an internal message.
    // eslint-disable-next-line no-unused-vars
    app.use((err, req, res, next) => {
        console.error('[booking-api] unhandled error:', err && err.message);
        if (!res.headersSent) res.status(500).json({ error: 'Internal server error' });
    });

    return app;
}

module.exports = {
    createBookingApiApp,
    corsOptions,
    allowedOrigins,
    capabilities,
    PRODUCTION_ORIGINS,
    DEVELOPMENT_ORIGINS,
};
