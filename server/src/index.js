import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env, reportMissingEnv } from './config/env.js';
import { connectDB } from './config/db.js';
import { authenticate } from './middleware/auth.js';

import authRoutes from './routes/auth.js';
import leadRoutes from './routes/leads.js';
import enquiryRoutes from './routes/enquiries.js';
import newsletterRoutes from './routes/newsletter.js';

const app = express();

app.use(helmet());
app.use(
    cors({
        origin(origin, cb) {
            // Allow same-origin / server-to-server (no Origin header) and any
            // configured frontend origin.
            if (!origin || env.corsOrigins.includes(origin)) return cb(null, true);
            return cb(new Error(`Origin ${origin} not allowed by CORS`));
        },
    }),
);
app.use(express.json({ limit: '100kb' }));
app.use(authenticate);

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'infiniteyatra-api' }));

app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/newsletter', newsletterRoutes);

// Fallthrough 404 + error handler.
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
});

async function start() {
    reportMissingEnv();
    try {
        await connectDB();
    } catch (err) {
        console.error('⚠️  DB connection failed — server will start but data routes will error:', err.message);
    }
    app.listen(env.port, () => console.log(`✔  API listening on http://localhost:${env.port}`));
}

start();
