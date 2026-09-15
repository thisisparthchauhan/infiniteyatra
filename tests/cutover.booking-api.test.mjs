/**
 * CUTOVER — the PB-only production booking API.
 *
 * Drives the real Express app over a real socket, so route exposure and CORS
 * are observed the way a browser would see them rather than asserted against
 * source text.
 *
 * Run: npm run test:cutover-api
 */

import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const { createBookingApiApp, allowedOrigins, PRODUCTION_ORIGINS } = require('../functions/bookingApi.js');
const { isStorageEnabled, capabilities } = require('../functions/bookingCapabilities.js');

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

/** Start an app on an ephemeral port and return a fetch bound to it. */
function serve(app) {
    return new Promise((resolve) => {
        const server = app.listen(0, '127.0.0.1', () => {
            const { port } = server.address();
            resolve({
                server,
                url: (p) => `http://127.0.0.1:${port}${p}`,
                close: () => new Promise((r) => server.close(r)),
            });
        });
    });
}

let live;
before(async () => { live = await serve(createBookingApiApp({ env: {} })); });
after(async () => { await live?.close(); });

// ---------------------------------------------------------------------------
// [20] health
// ---------------------------------------------------------------------------

describe('[20] health endpoint', () => {
    test('returns exactly the minimal body', async () => {
        const res = await fetch(live.url('/health'));
        assert.equal(res.status, 200);
        const body = await res.json();
        assert.deepEqual(body, { status: 'ok', service: 'iy-booking-api' });
    });

    test('is reachable under the /api prefix too', async () => {
        const res = await fetch(live.url('/api/health'));
        assert.equal(res.status, 200);
    });

    test('leaks no infrastructure detail', async () => {
        const raw = await (await fetch(live.url('/health'))).text();
        for (const leak of ['infiniteyatra-iy', 'us-central1', 'version', 'bucket', 'project',
            'firebase', 'node', 'JWT', 'razorpay']) {
            assert.ok(!raw.toLowerCase().includes(leak.toLowerCase()), `health leaked "${leak}"`);
        }
    });

    test('needs no authentication', async () => {
        const res = await fetch(live.url('/health'), { headers: {} });
        assert.equal(res.status, 200);
    });
});

// ---------------------------------------------------------------------------
// [17][18][19] legacy routes are absent
// ---------------------------------------------------------------------------

describe('[17][18][19] the legacy surface is not mounted', () => {
    const FORBIDDEN = [
        ['POST', '/create-order'],            // [17] client-supplied amount
        ['POST', '/api/create-order'],
        ['POST', '/verify-payment'],
        ['POST', '/api/verify-payment'],
        ['POST', '/razorpay/webhook'],        // [18] signature verification disabled
        ['GET', '/api/auth/oauth-url'],
        ['POST', '/api/auth/oauth-callback'],
        ['POST', '/api/auth/login-with-2fa'],
        ['GET', '/api/auth/2fa-status'],
        ['POST', '/api/auth/refresh-token'],
    ];

    for (const [method, path] of FORBIDDEN) {
        test(`${method} ${path} is 404, not handled`, async () => {
            const res = await fetch(live.url(path), {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: method === 'POST' ? '{}' : undefined,
            });
            assert.equal(res.status, 404, `${path} must not exist on the PB API`);
            const body = await res.json().catch(() => ({}));
            assert.equal(body.error, 'Not found');
        });
    }

    test('[19] createStaffAccount is not exported by the PB entry', () => {
        const entry = read('../functions/bookingApi.entry.js');
        const exported = entry.match(/^exports\.\w+/gm) || [];
        assert.deepEqual(exported, ['exports.api'], 'the entry must export exactly one function');
        assert.ok(!/createStaffAccount/.test(entry));
    });

    test('[17][18] the PB API never imports the legacy monolith or its secrets module', () => {
        const api = read('../functions/bookingApi.js');
        const entry = read('../functions/bookingApi.entry.js');
        for (const src of [api, entry]) {
            for (const forbidden of ["require('./index", "require('./security", "require('razorpay')",
                "require('nodemailer')"]) {
                assert.ok(!src.includes(forbidden), `must not ${forbidden}`);
            }
        }
    });

    test('the PB require graph never reaches ./security', () => {
        // security.js throws at module load without JWT_SECRET, so reaching it
        // would make the booking API unstartable over a secret it never uses.
        const seen = new Set();
        const walk = (file) => {
            if (seen.has(file)) return;
            seen.add(file);
            const src = readFileSync(new URL(`../functions/${file}`, import.meta.url), 'utf8');
            for (const m of src.matchAll(/require\('\.\/([\w.-]+)'\)/g)) {
                const dep = m[1].endsWith('.js') ? m[1] : `${m[1]}.js`;
                walk(dep);
            }
        };
        walk('bookingApi.js');
        assert.ok(!seen.has('security.js'), `security.js reached via: ${[...seen].join(' -> ')}`);
        assert.ok(!seen.has('index.js'), 'index.js must not be in the graph');
    });
});

// ---------------------------------------------------------------------------
// [L] startup without legacy secrets
// ---------------------------------------------------------------------------

describe('the PB API starts with no legacy secrets', () => {
    test('loads on a simulated production runtime with a scrubbed environment', () => {
        // A child process with env -i semantics: nothing but PATH/HOME and the
        // two variables that mark a Functions runtime.
        const script = `
            const forbidden = ['JWT_SECRET','RAZORPAY_KEY_ID','RAZORPAY_KEY_SECRET','SMTP_USER',
                'SMTP_PASS','WHATSAPP_TOKEN','GOOGLE_OAUTH_CLIENT_ID','GOOGLE_OAUTH_CLIENT_SECRET'];
            const present = forbidden.filter((k) => process.env[k]);
            if (present.length) { console.log('FAIL: env carried ' + present.join(',')); process.exit(1); }
            const { createBookingApiApp } = require('./bookingApi.js');
            createBookingApiApp();
            console.log('OK');
        `;
        const out = execFileSync(process.execPath, ['-e', script], {
            cwd: new URL('../functions/', import.meta.url),
            env: { PATH: process.env.PATH, HOME: process.env.HOME, K_SERVICE: 'iy-booking-api', FUNCTION_TARGET: 'api' },
            encoding: 'utf8',
        });
        assert.match(out, /OK/);
    });
});

// ---------------------------------------------------------------------------
// [15][16] CORS
// ---------------------------------------------------------------------------

describe('[15][16] production CORS', () => {
    test('[15] both Infinite Yatra production origins are allowed', async () => {
        for (const origin of PRODUCTION_ORIGINS) {
            const res = await fetch(live.url('/health'), { headers: { Origin: origin } });
            assert.equal(res.headers.get('access-control-allow-origin'), origin, `${origin} rejected`);
        }
    });

    test('[16] an unrelated origin gets no allow-origin header', async () => {
        for (const origin of ['https://evil.example.com', 'https://infiniteyatra.com.evil.com',
            'http://infiniteyatra.com', 'https://sub.infiniteyatra.com']) {
            const res = await fetch(live.url('/health'), { headers: { Origin: origin } });
            assert.equal(res.headers.get('access-control-allow-origin'), null,
                `${origin} must not be allowed`);
        }
    });

    test('there is never a wildcard', async () => {
        const res = await fetch(live.url('/health'), { headers: { Origin: 'https://evil.example.com' } });
        assert.notEqual(res.headers.get('access-control-allow-origin'), '*');
        // Strip comments first: the source documents why a wildcard is wrong,
        // and scanning prose would match that warning rather than real code.
        const src = read('../functions/bookingApi.js')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/^\s*\/\/.*$/gm, '');
        assert.ok(!/origin:\s*true/.test(src) && !/origin:\s*['"]\*['"]/.test(src),
            'wildcard or reflect-all CORS must never appear in code');
    });

    test('localhost is allowed only off a production runtime', () => {
        const prod = allowedOrigins({ K_SERVICE: 'api' });
        assert.deepEqual(prod, [...PRODUCTION_ORIGINS], 'production must not allow localhost');
        const dev = allowedOrigins({});
        assert.ok(dev.some((o) => o.startsWith('http://localhost')), 'dev should allow localhost');
    });

    test('the emulator is not mistaken for production', () => {
        const emu = allowedOrigins({ FUNCTIONS_EMULATOR: 'true', K_SERVICE: 'x' });
        assert.ok(emu.some((o) => o.startsWith('http://localhost')));
    });
});

// ---------------------------------------------------------------------------
// [21] storage gate
// ---------------------------------------------------------------------------

describe('[21] storage-disabled mode is graceful', () => {
    let off;
    before(async () => { off = await serve(createBookingApiApp({ env: { PB_STORAGE_ENABLED: 'false' } })); });
    after(async () => { await off?.close(); });

    test('booking creation and reads stay available', async () => {
        // Unauthenticated, so 401 — the point is that it is NOT the 503 that
        // the storage-gated routes return, i.e. the route still exists.
        const res = await fetch(off.url('/api/bookings/package'), {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
        });
        assert.notEqual(res.status, 503, 'booking creation must not be storage-gated');
        assert.equal(res.status, 401);

        const read2 = await fetch(off.url('/api/bookings/abc123'));
        assert.notEqual(read2.status, 503, 'booking read must not be storage-gated');
        assert.equal(read2.status, 401);
    });

    test('document and summary routes return a clean 503 before any handler', async () => {
        const routes = [
            ['GET', '/api/bookings/abc123/documents'],
            ['POST', '/api/bookings/abc123/documents'],
            ['POST', '/api/bookings/abc123/summary'],
            ['GET', '/api/bookings/abc123/summary'],
        ];
        for (const [method, path] of routes) {
            const res = await fetch(off.url(path), {
                method, headers: { 'Content-Type': 'application/json' },
                body: method === 'POST' ? '{}' : undefined,
            });
            assert.equal(res.status, 503, `${method} ${path}`);
            const body = await res.json();
            assert.equal(body.code, 'BOOKING_STORAGE_UNAVAILABLE');
            // No bucket names, no project ids, no billing talk.
            assert.ok(!/bucket|billing|project|storage\.googleapis/i.test(body.error));
        }
    });

    test('the gate runs before authentication, so no upload is ever half-accepted', async () => {
        const res = await fetch(off.url('/api/bookings/abc123/documents'), {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
        });
        assert.equal(res.status, 503, 'must be refused outright, not after an auth round-trip');
    });

    test('production without the flag fails closed', () => {
        assert.equal(isStorageEnabled({ K_SERVICE: 'api' }), false);
        const cap = capabilities({ K_SERVICE: 'api' });
        assert.equal(cap.documentUpload, false);
        assert.equal(cap.bookingSummary, false);
        assert.equal(cap.bookingCreate, true, 'creation never depends on storage');
        assert.equal(cap.bookingRead, true);
    });

    test('with storage on, the routes are reachable again', async () => {
        const on = await serve(createBookingApiApp({ env: { PB_STORAGE_ENABLED: 'true' } }));
        try {
            const res = await fetch(on.url('/api/bookings/abc123/documents'));
            assert.notEqual(res.status, 503);
            assert.equal(res.status, 401, 'reachable, and then properly authenticated');
        } finally { await on.close(); }
    });
});
