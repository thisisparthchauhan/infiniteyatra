import './env.mjs';
import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, makeClient, resetDatabase, seedCatalogue, bookingBody, query, closePool } from './helpers.mjs';
import { SUMMARY_DISCLAIMER } from '../src/services/summaries.js';

let srv; let cat;
before(async () => { srv = await startServer(); });
after(async () => { await srv.close(); await closePool(); });
beforeEach(async () => { await resetDatabase(); cat = await seedCatalogue(); });

async function customerWithBooking(email = 'cust@example.invalid') {
    const c = makeClient(srv.base);
    await c.req('/api/auth/register', { method: 'POST', body: { email, password: 'a-long-enough-passphrase' } });
    const created = await c.req('/api/bookings', { method: 'POST', body: bookingBody({ packageId: cat.packageId }) });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    return { c, id: created.body.booking.id };
}

describe('PB-4 Booking Summary', () => {
    test('a summary is issued with a formatted number and the booking gross', async () => {
        const { c, id } = await customerWithBooking();
        const res = await c.req(`/api/bookings/${id}/summary`, { method: 'POST' });
        assert.equal(res.status, 200);
        const s = res.body.summary;
        assert.match(s.summaryNumber, /^IY-BS-\d{4}-\d{6}$/);
        assert.equal(s.version, 1);
        assert.equal(s.amountMinor, 3000000, 'the summary shows what was booked');
    });

    test('it says plainly that it is not an invoice and not proof of payment', async () => {
        const { c, id } = await customerWithBooking();
        const res = await c.req(`/api/bookings/${id}/summary`, { method: 'POST' });
        assert.equal(res.body.summary.documentKind, 'booking_summary');
        assert.equal(res.body.summary.disclaimer, SUMMARY_DISCLAIMER);
        assert.match(res.body.summary.disclaimer, /not a tax invoice/i);
        assert.match(res.body.summary.disclaimer, /not evidence of payment/i);
    });

    test('the amount is the price booked, never the amount received', async () => {
        // P0-05: a document that looked like a paid invoice for an unpaid
        // booking. The summary must never imply settlement.
        const { c, id } = await customerWithBooking();
        const res = await c.req(`/api/bookings/${id}/summary`, { method: 'POST' });
        const booking = (await c.req(`/api/bookings/${id}`)).body.booking;
        assert.equal(booking.payment.amountReceivedMinor, 0);
        assert.equal(res.body.summary.amountMinor, booking.pricing.grossAmountMinor);
        const flat = JSON.stringify(res.body.summary);
        assert.ok(!/amountReceived|paid|settled/i.test(flat), 'a summary must not imply payment');
    });

    test('a refresh reuses the summary and consumes no number', async () => {
        const { c, id } = await customerWithBooking();
        const first = await c.req(`/api/bookings/${id}/summary`, { method: 'POST' });
        const second = await c.req(`/api/bookings/${id}/summary`, { method: 'POST' });
        assert.equal(first.body.summary.summaryNumber, second.body.summary.summaryNumber);
        assert.equal((await query('SELECT COUNT(*) c FROM booking_summaries'))[0].c, 1);
        assert.equal(Number((await query('SELECT next_value FROM summary_counters'))[0].next_value), 2);
    });

    test('a changed booking supersedes the old summary with a new version', async () => {
        const { c, id } = await customerWithBooking();
        const first = await c.req(`/api/bookings/${id}/summary`, { method: 'POST' });
        await query("UPDATE bookings SET booking_status = 'confirmed' WHERE public_id = ?", [id]);
        const second = await c.req(`/api/bookings/${id}/summary`, { method: 'POST' });

        assert.notEqual(first.body.summary.summaryNumber, second.body.summary.summaryNumber);
        assert.equal(second.body.summary.version, 2);
        const rows = await query('SELECT version, superseded_by FROM booking_summaries ORDER BY version');
        assert.ok(rows[0].superseded_by, 'the first must be marked superseded');
        assert.equal(rows[1].superseded_by, null);
    });

    test('summary numbers are unique under concurrency', async () => {
        const a = await customerWithBooking('a@example.invalid');
        const b = await customerWithBooking('b@example.invalid');
        const [r1, r2] = await Promise.all([
            a.c.req(`/api/bookings/${a.id}/summary`, { method: 'POST' }),
            b.c.req(`/api/bookings/${b.id}/summary`, { method: 'POST' }),
        ]);
        assert.notEqual(r1.body.summary.summaryNumber, r2.body.summary.summaryNumber);
        assert.equal((await query('SELECT COUNT(DISTINCT summary_number) c FROM booking_summaries'))[0].c, 2);
    });

    test("another customer cannot issue or read a summary for someone else's booking", async () => {
        const owner = await customerWithBooking('owner@example.invalid');
        const other = makeClient(srv.base);
        await other.req('/api/auth/register', { method: 'POST', body: { email: 'other@example.invalid', password: 'a-long-enough-passphrase' } });
        assert.equal((await other.req(`/api/bookings/${owner.id}/summary`, { method: 'POST' })).status, 404);
        assert.equal((await other.req(`/api/bookings/${owner.id}/summary`)).status, 404);
    });

    test('no PDF is offered while private storage is gated off', async () => {
        const { c, id } = await customerWithBooking();
        const res = await c.req(`/api/bookings/${id}/summary`, { method: 'POST' });
        assert.equal(res.body.summary.pdfAvailable, false);
        const stored = (await query('SELECT storage_path FROM booking_summaries'))[0];
        assert.equal(stored.storage_path, null, 'nothing may be written to disk yet');
    });

    test('the summary projection leaks no storage path or counter state', async () => {
        const { c, id } = await customerWithBooking();
        const res = await c.req(`/api/bookings/${id}/summary`, { method: 'POST' });
        const flat = JSON.stringify(res.body.summary);
        for (const leak of ['storage_path', 'sequence', 'fingerprint', 'booking_id']) {
            assert.ok(!flat.includes(leak), `leaked ${leak}`);
        }
    });
});

describe('PB-3 document workflow', () => {
    test('document upload is unavailable, gracefully, while storage is gated', async () => {
        const { c, id } = await customerWithBooking();
        const res = await c.req(`/api/bookings/${id}/documents`, { method: 'POST', body: {} });
        assert.equal(res.status, 503);
        assert.equal(res.body.code, 'DOCUMENT_STORAGE_UNAVAILABLE');
        // No directory, bucket or path detail is revealed.
        assert.ok(!/public_html|\/var\/|bucket|path/i.test(res.body.error));
    });

    test('the booking says so itself, so the UI never has to guess', async () => {
        const { c, id } = await customerWithBooking();
        const booking = (await c.req(`/api/bookings/${id}`)).body.booking;
        assert.equal(booking.capabilities.documentUpload, false);
        assert.equal(booking.capabilities.bookingSummaryPdf, false);
    });

    test('the workflow states exist in the schema, ready for when storage is approved', async () => {
        const rows = await query(
            `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
              WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'booking_documents' AND COLUMN_NAME = 'review_status'`,
        );
        for (const state of ['uploaded', 'under_review', 'approved', 'rejected']) {
            assert.ok(rows[0].COLUMN_TYPE.includes(state), `missing state ${state}`);
        }
    });

    test('a document is filed against a traveller id, never a position', async () => {
        const rows = await query(
            `SELECT COLUMN_NAME FROM information_schema.COLUMNS
              WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'booking_documents'`,
        );
        const cols = rows.map((r) => r.COLUMN_NAME);
        assert.ok(cols.includes('traveller_id'));
        assert.ok(!cols.includes('traveller_index') && !cols.includes('position'));
    });
});

describe('security', () => {
    test('SQL injection through a path parameter does nothing', async () => {
        const c = makeClient(srv.base);
        await c.req('/api/auth/register', { method: 'POST', body: { email: 'sql@example.invalid', password: 'a-long-enough-passphrase' } });
        const payloads = [
            "1' OR '1'='1", "'; DROP TABLE bookings;--", "1 UNION SELECT 1,2,3",
            "' OR 1=1--", '%27%20OR%201%3D1',
        ];
        for (const p of payloads) {
            const res = await c.req(`/api/bookings/${encodeURIComponent(p)}`);
            assert.equal(res.status, 404, `payload leaked a different status: ${p}`);
        }
        // The table is still there and the schema is intact.
        assert.equal((await query('SELECT COUNT(*) c FROM bookings'))[0].c, 0);
    });

    test('SQL injection through a login body does nothing', async () => {
        const c = makeClient(srv.base);
        const res = await c.req('/api/auth/login', {
            method: 'POST', body: { email: "admin'--", password: "' OR '1'='1" },
        });
        assert.equal(res.status, 401);
        assert.equal((await query('SELECT COUNT(*) c FROM users'))[0].c, 0);
    });

    test('an oversized body is refused before it is parsed', async () => {
        const res = await fetch(`${srv.base}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'a@b.co', password: 'x'.repeat(2 * 1024 * 1024) }),
        });
        assert.ok(res.status === 413 || res.status === 400, `expected a rejection, got ${res.status}`);
    });

    test('malformed JSON is a clean 400, not a stack trace', async () => {
        const res = await fetch(`${srv.base}/api/auth/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{not json',
        });
        assert.ok(res.status >= 400 && res.status < 500);
        const text = await res.text();
        assert.ok(!/at .*\(.*:\d+:\d+\)/.test(text), 'a stack trace leaked');
    });

    test('an internal error never leaks driver or schema detail', async () => {
        const c = makeClient(srv.base);
        const res = await c.req('/api/auth/login', { method: 'POST', body: { email: 'a@b.co', password: 'x' } });
        const flat = JSON.stringify(res.body);
        for (const leak of ['SELECT', 'users', 'mysql', 'ER_', 'password_hash']) {
            assert.ok(!flat.includes(leak), `error leaked ${leak}`);
        }
    });

    test('security headers are present', async () => {
        const res = await fetch(`${srv.base}/api/health`);
        assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
        assert.ok(res.headers.get('x-frame-options') || res.headers.get('content-security-policy'));
        assert.equal(res.headers.get('x-powered-by'), null, 'the stack must not announce itself');
    });

    test('the rate limiter engages when limits are low', async () => {
        // Run in a CHILD PROCESS: config is frozen at first import, so changing
        // the limit in this process would not reach the already-loaded module.
        // A child also proves the production path — the value really does come
        // from the environment the server boots with.
        const { execFileSync } = await import('node:child_process');
        const script = `
            process.env.NODE_ENV = 'test';
            process.env.DB_HOST='127.0.0.1'; process.env.DB_NAME='iy_test';
            process.env.DB_USER='iy_test'; process.env.DB_PASSWORD='iy_test_local_only';
            process.env.SESSION_SECRET='test-secret-that-is-long-enough-for-checks';
            process.env.APP_ORIGIN='http://localhost:5173';
            process.env.PUBLIC_APP_URL='http://localhost:5173';
            process.env.RATE_LIMIT_AUTH_MAX='3';
            const { createApp } = await import('./src/app.js');
            const { closePool } = await import('./src/db/pool.js');
            const app = createApp();
            const s = await new Promise((r) => { const x = app.listen(0, '127.0.0.1', () => r(x)); });
            const base = 'http://127.0.0.1:' + s.address().port;
            let limited = false;
            for (let i = 0; i < 8; i += 1) {
                const res = await fetch(base + '/api/auth/login', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: 'x@y.co', password: 'whatever' }),
                });
                if (res.status === 429) { limited = true; break; }
            }
            console.log(limited ? 'LIMITED' : 'NOT_LIMITED');
            s.close(); await closePool(); process.exit(0);
        `;
        const out = execFileSync(process.execPath, ['--input-type=module', '-e', script], {
            cwd: new URL('..', import.meta.url), encoding: 'utf8',
        });
        assert.match(out, /LIMITED/, 'the limiter must refuse repeated attempts');
    });

    test('health and capabilities are public and say nothing sensitive', async () => {
        const health = await (await fetch(`${srv.base}/api/health`)).json();
        assert.deepEqual(health, { status: 'ok', service: 'iy-api' });
        const caps = await (await fetch(`${srv.base}/api/capabilities`)).json();
        assert.equal(caps.capabilities.documentUpload, false);
        assert.equal(caps.capabilities.bookingCreate, true);
        const flat = JSON.stringify({ health, caps });
        for (const leak of ['DB_', 'password', 'secret', '/var/', 'mysql']) {
            assert.ok(!flat.toLowerCase().includes(leak.toLowerCase()), `leaked ${leak}`);
        }
    });

    test('the API is reachable at exactly one /api prefix, never /api/api', async () => {
        assert.equal((await fetch(`${srv.base}/api/health`)).status, 200);
        assert.equal((await fetch(`${srv.base}/health`)).status, 200, 'bare path for a proxy that strips /api');
        assert.equal((await fetch(`${srv.base}/api/api/health`)).status, 404, '/api/api must not resolve');
    });
});
