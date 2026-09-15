/** Process entry. Hostinger runs this with Node 22. */

import { createApp } from './app.js';
import { config } from './config.js';
import { closePool, query } from './db/pool.js';

const app = createApp();

const server = app.listen(config.port, () => {
    console.log(`[api] listening on ${config.port} (${config.env})`);
    console.log(`[api] document/PDF storage: ${config.storage.enabled ? 'enabled' : 'disabled'}`);
});

// Fail fast and loudly if the database is unreachable at boot.
query('SELECT 1').catch((err) => {
    console.error('[api] database unreachable at startup:', err.code || err.message);
    process.exit(1);
});

const shutdown = async (signal) => {
    console.log(`[api] ${signal} received, shutting down`);
    server.close(async () => { await closePool(); process.exit(0); });
    setTimeout(() => process.exit(1), 10000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
