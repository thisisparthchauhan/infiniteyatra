/**
 * Express application.
 *
 * Mounted at /api on the same origin as the React app, so there is no
 * cross-origin grant in production at all — the strongest CORS posture
 * available. CORS below exists only for local development, where Vite runs on
 * a different port.
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { config, capabilities } from './config.js';
import { ValidationError } from './lib/validate.js';
import authRoutes from './routes/auth.js';
import staffAuthRoutes from './routes/staffAuth.js';
import catalogueRoutes from './routes/catalogue.js';
import bookingRoutes from './routes/bookings.js';
import adminRoutes from './routes/admin.js';

export function createApp() {
    const app = express();
    app.disable('x-powered-by');
    app.set('trust proxy', 1);

    app.use(helmet({
        contentSecurityPolicy: false,          // the SPA host sets its own CSP
        crossOriginResourcePolicy: { policy: 'same-site' },
    }));

    // Same-origin in production means no browser sends an Origin we must allow.
    // A strict allowlist is kept for the dev server and as defence in depth.
    const allowedOrigins = config.isProd
        ? [config.appOrigin, 'https://www.infiniteyatra.com', 'https://infiniteyatra.com']
        : [config.appOrigin, 'http://localhost:5173', 'http://localhost:4173'];

    app.use(cors({
        origin(origin, cb) {
            if (!origin) return cb(null, true);                 // curl, health probes
            return cb(null, allowedOrigins.includes(origin));
        },
        credentials: true,                                      // session cookie
        methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type'],
    }));

    app.use(cookieParser());
    app.use(express.json({ limit: '256kb' }));                  // bounded body
    app.use(express.urlencoded({ extended: false, limit: '256kb' }));

    app.use(rateLimit({
        windowMs: 15 * 60 * 1000, max: config.rateLimits.globalMax,
        standardHeaders: true, legacyHeaders: false,
    }));

    /**
     * CSRF: session cookies are SameSite=Lax, which already blocks cross-site
     * POSTs. This adds a second, explicit check — a state-changing request must
     * either carry no Origin (same-origin fetch in some browsers, or a
     * non-browser client) or an Origin we recognise.
     */
    app.use((req, res, next) => {
        if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
        const origin = req.get('origin');
        if (!origin || allowedOrigins.includes(origin)) return next();
        return res.status(403).json({ error: 'Cross-site request blocked' });
    });

    app.get(['/health', '/api/health'], (req, res) => {
        res.json({ status: 'ok', service: 'iy-api' });
    });

    app.get(['/capabilities', '/api/capabilities'], (req, res) => {
        res.json({ capabilities: capabilities() });
    });

    const api = express.Router();
    api.use('/auth', authRoutes);
    api.use('/staff/auth', staffAuthRoutes);
    api.use('/catalogue', catalogueRoutes);
    api.use('/bookings', bookingRoutes);
    api.use('/admin', adminRoutes);

    // Both prefixes: '/api/...' behind the Hostinger/Nginx proxy, bare when the
    // proxy already strips it. The client always builds exactly one '/api'.
    app.use('/api', api);
    app.use('/', api);

    app.use((req, res) => res.status(404).json({ error: 'Not found' }));

    // eslint-disable-next-line no-unused-vars
    app.use((err, req, res, next) => {
        if (err instanceof ValidationError) {
            return res.status(400).json({ error: 'Validation failed', details: err.details });
        }
        if (err && err.status && err.status < 500) {
            return res.status(err.status).json({ error: err.message, code: err.code });
        }
        // Never leak a stack or a driver message: those carry table names,
        // column names and sometimes values.
        console.error('[api] unhandled error:', err && err.message);
        return res.status(500).json({ error: 'Internal server error' });
    });

    return app;
}
