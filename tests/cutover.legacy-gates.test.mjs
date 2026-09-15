/**
 * CUTOVER — the PB-4 summary and PB-3 document gates on legacy bookings.
 *
 * Run: npm run test:cutover-gates
 */

import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { LEGACY_FIXTURES, canonicalBooking } from './fixtures/legacyBookings.mjs';

const require = createRequire(import.meta.url);
const summary = require('../functions/packageBookingSummary.js');
const documents = require('../functions/packageBookingDocuments.js');
const { LEGACY_ERROR_CODES } = require('../functions/bookingSchema.js');

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

/** Minimal Express response double recording what a handler sent. */
function fakeRes() {
    const r = { statusCode: null, body: null, sent: false };
    r.status = (code) => { r.statusCode = code; return r; };
    r.json = (payload) => { r.body = payload; r.sent = true; return r; };
    return r;
}

// ---------------------------------------------------------------------------
// [8] Booking Summary
// ---------------------------------------------------------------------------

describe('[8] a legacy booking cannot produce a Booking Summary', () => {
    for (const [name, data] of Object.entries(LEGACY_FIXTURES)) {
        test(`legacy ${name} is refused with 409 and a stable code`, () => {
            const res = fakeRes();
            const stopped = summary.rejectLegacyBooking(res, { id: `legacy-${name}`, data });
            assert.equal(stopped, true, 'the handler must be told to stop');
            assert.equal(res.statusCode, 409);
            assert.equal(res.body.code, LEGACY_ERROR_CODES.SUMMARY_NOT_AVAILABLE);
            assert.equal(res.body.code, 'BOOKING_SUMMARY_NOT_AVAILABLE');
        });
    }

    test('[10] a canonical booking is not refused', () => {
        const res = fakeRes();
        const stopped = summary.rejectLegacyBooking(res, { id: 'c1', data: canonicalBooking });
        assert.equal(stopped, false);
        assert.equal(res.sent, false, 'nothing may be written for a canonical booking');
    });

    test('the customer message names availability, never schema internals', () => {
        const res = fakeRes();
        summary.rejectLegacyBooking(res, { id: 'x', data: LEGACY_FIXTURES.A });
        const text = res.body.error;
        assert.match(text, /earlier booking/i);
        for (const leak of ['schemaVersion', 'LEGACY', 'CANONICAL', 'projection', 'Firestore', 'null']) {
            assert.ok(!text.includes(leak), `customer message leaked "${leak}"`);
        }
    });

    test('no zero-amount summary can be reached: the gate precedes every handler', () => {
        const src = read('../functions/packageBookingSummary.js');
        for (const fn of ['ensureSummary', 'getSummary', 'downloadSummary']) {
            const start = src.indexOf(`async function ${fn}(`);
            assert.ok(start !== -1, `${fn} not found`);
            const body = src.slice(start, start + 800);
            const ownershipAt = body.indexOf("if (!booking) return res.status(404)");
            const gateAt = body.indexOf('rejectLegacyBooking(res, booking)');
            assert.ok(gateAt !== -1, `${fn} must gate legacy bookings`);
            assert.ok(gateAt > ownershipAt, `${fn}: the gate must follow the ownership check`);
            // Nothing that renders or allocates may appear before the gate.
            const before = body.slice(0, gateAt);
            for (const risky of ['renderSummaryPdf', 'allocateSummaryNumber', 'bookingFingerprint']) {
                assert.ok(!before.includes(risky), `${fn}: ${risky} runs before the legacy gate`);
            }
        }
    });
});

// ---------------------------------------------------------------------------
// [9] documents
// ---------------------------------------------------------------------------

describe('[9] a legacy booking cannot enter the document workflow', () => {
    for (const [name, data] of Object.entries(LEGACY_FIXTURES)) {
        test(`legacy ${name} is refused with 409 and a stable code`, () => {
            const res = fakeRes();
            const stopped = documents.rejectLegacyBooking(res, { id: `legacy-${name}`, data });
            assert.equal(stopped, true);
            assert.equal(res.statusCode, 409);
            assert.equal(res.body.code, LEGACY_ERROR_CODES.DOCUMENTS_NOT_AVAILABLE);
            assert.equal(res.body.code, 'BOOKING_DOCUMENTS_NOT_AVAILABLE');
        });
    }

    test('[11] a canonical booking still enters the document flow', () => {
        const res = fakeRes();
        assert.equal(documents.rejectLegacyBooking(res, { id: 'c1', data: canonicalBooking }), false);
        assert.equal(res.sent, false);
    });

    test('array position is never used as a traveller identity', () => {
        const src = read('../functions/packageBookingDocuments.js');
        // Identity is matched on a stored travellerId, not an index.
        assert.match(src, /t\.travellerId === travellerId/);
        assert.ok(!/travellers\[\s*(?:index|idx|i|position)\s*\]/.test(src),
            'a traveller must never be addressed by array position');
    });

    test('the gate precedes every document handler', () => {
        const src = read('../functions/packageBookingDocuments.js');
        for (const fn of ['finalizeDocument', 'listDocuments', 'deleteDocument']) {
            const start = src.indexOf(`async function ${fn}(`);
            const body = src.slice(start, start + 800);
            assert.ok(body.includes('rejectLegacyBooking(res, booking)'), `${fn} must gate legacy`);
        }
    });
});

// ---------------------------------------------------------------------------
// The two gates are independent of the storage gate
// ---------------------------------------------------------------------------

describe('the legacy gate does not depend on storage being on', () => {
    test('a legacy booking is refused for a data reason, not a capability one', () => {
        const res = fakeRes();
        summary.rejectLegacyBooking(res, { id: 'x', data: LEGACY_FIXTURES.D });
        // 409, not the 503 the storage gate returns: turning storage on later
        // must not quietly make legacy summaries available.
        assert.equal(res.statusCode, 409);
        assert.notEqual(res.body.code, 'BOOKING_STORAGE_UNAVAILABLE');
    });
});
