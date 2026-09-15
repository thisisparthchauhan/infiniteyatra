/**
 * CUTOVER — booking classification, the legacy projection, and financial safety.
 *
 * The risk this suite exists for: production holds 15 legacy bookings and zero
 * canonical ones. Every canonical reader assumes fields a legacy record simply
 * does not have. Read one through the canonical path and a real trip renders as
 * a ₹0 booking with a zero balance — a number a customer could reasonably read
 * as "nothing to pay".
 *
 * Run: npm run test:cutover
 */

import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { LEGACY_FIXTURES, canonicalBooking } from './fixtures/legacyBookings.mjs';
import * as client from '../src/config/bookingSchema.js';
import { buildBookingApiUrl, normaliseBase } from '../src/services/bookingApiUrl.js';

const require = createRequire(import.meta.url);
const server = require('../functions/bookingSchema.js');

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

// ---------------------------------------------------------------------------
// [12][13] schemaVersion is server-owned
// ---------------------------------------------------------------------------

describe('schemaVersion', () => {
    test('[12] a new PB booking is written with schemaVersion', () => {
        const src = read('../functions/packageBookings.js');
        assert.match(src, /schemaVersion: CANONICAL_SCHEMA_VERSION/,
            'the create transaction must stamp the canonical marker');
        assert.equal(server.CANONICAL_SCHEMA_VERSION, 2,
            'PB-1 already shipped 2; a fresh numbering would create two meanings for one field');
        assert.equal(server.classifyBooking(canonicalBooking), server.BOOKING_SCHEMA.CANONICAL_PB);
    });

    test('[13] a client cannot choose schemaVersion — rejected by the body allowlist', () => {
        const validation = read('../functions/packageBookingValidation.js');
        const allowed = validation.match(/const ALLOWED_BODY_KEYS = new Set\(\[([\s\S]*?)\]\)/);
        assert.ok(allowed, 'could not find the request body allowlist');
        assert.ok(!/schemaVersion/.test(allowed[1]),
            'schemaVersion must never be an accepted request field');
        assert.match(validation, /rejectUnknownKeys\(body, ALLOWED_BODY_KEYS/,
            'unknown body keys must be rejected, not ignored');
    });

    test('[13] a client cannot write schemaVersion through Firestore either', () => {
        // Both the transitional and the final ruleset must exclude it.
        for (const file of ['../firestore.rules', '../firestore.rules.cutover']) {
            const rules = read(file);
            const bookingBlock = rules.slice(rules.indexOf('match /bookings/{bookingId}'));
            const hasOnly = bookingBlock.match(/hasOnly\(\[([\s\S]*?)\]\)/);
            if (hasOnly) {
                assert.ok(!/schemaVersion/.test(hasOnly[1]),
                    `${file}: schemaVersion must not be client-writable`);
            }
        }
    });

    test('only a real number at or above the canonical version counts', () => {
        for (const junk of ['2', ' 2', true, null, undefined, {}, [], NaN, Infinity, 1, 0, -2]) {
            assert.equal(server.classifyBooking({ schemaVersion: junk }), server.BOOKING_SCHEMA.LEGACY,
                `${String(junk)} must not be canonical`);
        }
        assert.equal(server.classifyBooking({ schemaVersion: 2 }), server.BOOKING_SCHEMA.CANONICAL_PB);
    });

    test('a future schema bump does not reclassify existing canonical bookings', () => {
        // `>=`, not `===`. An exact compare would strip Booking Summaries and
        // document uploads from every existing customer the day the version moves.
        assert.equal(server.classifyBooking({ schemaVersion: 3 }), server.BOOKING_SCHEMA.CANONICAL_PB);
        assert.equal(server.classifyBooking({ schemaVersion: 99 }), server.BOOKING_SCHEMA.CANONICAL_PB);
    });

    test('the marker is written outside the block PB-5 retires', () => {
        const src = read('../functions/packageBookings.js');
        const marker = src.indexOf('schemaVersion: CANONICAL_SCHEMA_VERSION');
        const compat = src.indexOf('transition compatibility');
        assert.ok(marker !== -1 && compat !== -1);
        assert.ok(marker < compat,
            'the canonical marker must not sit inside the transition-compatibility block');
        assert.equal((src.match(/^\s*schemaVersion:/gm) || []).length, 1,
            'exactly one schemaVersion key: a later duplicate silently wins in an object literal');
    });

    test('classification degrades to LEGACY, never to canonical', () => {
        for (const junk of [null, undefined, 0, '', 'x', []]) {
            assert.equal(server.classifyBooking(junk), server.BOOKING_SCHEMA.LEGACY);
        }
    });
});

// ---------------------------------------------------------------------------
// [22] all four legacy fixtures
// ---------------------------------------------------------------------------

describe('[22] every observed legacy structure classifies and projects', () => {
    for (const [name, fixture] of Object.entries(LEGACY_FIXTURES)) {
        test(`legacy ${name} is LEGACY and projects without throwing`, () => {
            assert.equal(server.classifyBooking(fixture), server.BOOKING_SCHEMA.LEGACY);
            const p = server.toLegacyCustomerBooking(`legacy-${name}`, fixture);
            assert.equal(p.legacy, true);
            assert.equal(p.id, `legacy-${name}`);
            assert.equal(p.capabilities.bookingSummary, false);
            assert.equal(p.capabilities.documentUpload, false);
        });

        test(`legacy ${name} renders in the history list without canonical fields`, () => {
            const d = client.toDisplayBooking(`legacy-${name}`, fixture);
            assert.equal(d.legacy, true);
            assert.equal(d.title, fixture.packageTitle);
            assert.equal(d.reference, null, 'no booking reference may be invented');
            // The recorded rupee figure passes through unscaled.
            assert.equal(d.totalDisplay, fixture.totalPrice);
        });
    }

    test('a traveller list of plain strings and one of objects both project to names', () => {
        const fromStrings = server.toLegacyCustomerBooking('b', LEGACY_FIXTURES.B);
        const fromObjects = server.toLegacyCustomerBooking('d', LEGACY_FIXTURES.D);
        assert.deepEqual(fromStrings.travellers.map((t) => t.name), LEGACY_FIXTURES.B.travelersList);
        assert.deepEqual(fromObjects.travellers.map((t) => t.name),
            LEGACY_FIXTURES.D.travelersList.map((t) => t.name));
    });

    test('the sparsest record does not render as a zero-rupee booking', () => {
        // Fixture A has no tourAmount, no hotelAmount, no travellersList.
        const p = server.toLegacyCustomerBooking('a', LEGACY_FIXTURES.A);
        assert.equal(p.historical.recordedTotal, 48000);
        assert.equal(p.historical.recordedTourAmount, null, 'absent must stay null, not become 0');
        assert.equal(p.historical.recordedHotelAmount, null);
        assert.deepEqual(p.travellers, []);
    });
});

// ---------------------------------------------------------------------------
// [4] the legacy projection is an allowlist
// ---------------------------------------------------------------------------

describe('[4] legacy projection is allowlisted', () => {
    const EXPECTED_KEYS = [
        'id', 'legacy', 'schema', 'packageId', 'packageTitle', 'travelDate',
        'travellerCount', 'contact', 'travellers', 'pickupLocation',
        'specialRequests', 'hotelName', 'historical', 'createdAt', 'capabilities',
    ].sort();

    test('exactly the named keys are returned, for every fixture', () => {
        for (const [name, fixture] of Object.entries(LEGACY_FIXTURES)) {
            const p = server.toLegacyCustomerBooking('x', fixture);
            assert.deepEqual(Object.keys(p).sort(), EXPECTED_KEYS, `fixture ${name}`);
        }
    });

    test('a field added to a legacy document in future cannot leak', () => {
        const withExtras = {
            ...LEGACY_FIXTURES.C,
            internalNote: 'supplier margin 18%',
            supplierCost: 41000,
            agentCommission: 5000,
        };
        const p = server.toLegacyCustomerBooking('x', withExtras);
        const serialised = JSON.stringify(p);
        assert.ok(!serialised.includes('supplier margin'), 'internal note leaked');
        assert.ok(!serialised.includes('41000'), 'supplier cost leaked');
        assert.ok(!serialised.includes('5000'), 'commission leaked');
    });

    test('userId is never echoed back to the customer', () => {
        for (const fixture of Object.values(LEGACY_FIXTURES)) {
            const p = server.toLegacyCustomerBooking('x', fixture);
            assert.ok(!('userId' in p));
            assert.ok(!JSON.stringify(p).includes('uid-legacy-owner'));
        }
    });
});

// ---------------------------------------------------------------------------
// [5][6][7] financial safety
// ---------------------------------------------------------------------------

describe('[5][6][7] legacy money is a historical record, not financial truth', () => {
    test('[6] no amountReceived is derived, for any fixture or any status', () => {
        for (const [name, fixture] of Object.entries(LEGACY_FIXTURES)) {
            const p = server.toLegacyCustomerBooking('x', fixture);
            const flat = JSON.stringify(p);
            assert.ok(!/amountReceived/i.test(flat), `${name}: amountReceived must never appear`);
        }
    });

    test('[7] no balance is derived, including for a "paid" legacy record', () => {
        // Fixture D is paymentStatus 'paid' — the most tempting one to infer from.
        const p = server.toLegacyCustomerBooking('x', LEGACY_FIXTURES.D);
        const flat = JSON.stringify(p);
        assert.ok(!/balance/i.test(flat), 'balance must never be derived from a status label');
        assert.equal(p.historical.paymentStatusLabel, 'paid');
    });

    test('[5] legacy amounts are not exposed as canonical minor units', () => {
        for (const fixture of Object.values(LEGACY_FIXTURES)) {
            const p = server.toLegacyCustomerBooking('x', fixture);
            assert.ok(!('pricing' in p), 'no canonical pricing object');
            assert.ok(!('payment' in p), 'no canonical payment object');
            assert.ok(!/Minor\b/.test(JSON.stringify(Object.keys(p.historical))),
                'no *Minor field may appear on a legacy record');
        }
    });

    test('[5] the recorded total is passed through, never recomputed', () => {
        // Repricing against today's catalogue is what this guards against: the
        // stored figure must survive untouched regardless of any current price.
        const p = server.toLegacyCustomerBooking('x', LEGACY_FIXTURES.C);
        assert.equal(p.historical.recordedTotal, 56700);
        assert.equal(p.historical.recordedTourAmount, 38000);
        assert.equal(p.historical.recordedHotelAmount, 22000);
        // Deliberately NOT tourAmount + hotelAmount (60000): the stored total
        // reflects a bundle discount and must not be re-derived from its parts.
        assert.notEqual(p.historical.recordedTotal, 38000 + 22000);
    });

    test('no booking reference is fabricated for a legacy record', () => {
        for (const fixture of Object.values(LEGACY_FIXTURES)) {
            const p = server.toLegacyCustomerBooking('x', fixture);
            assert.ok(!('bookingReference' in p));
            assert.ok(!/IY-BKG-/.test(JSON.stringify(p)));
        }
    });

    test('no traveller ids are generated for legacy travellers', () => {
        for (const fixture of Object.values(LEGACY_FIXTURES)) {
            const p = server.toLegacyCustomerBooking('x', fixture);
            for (const t of p.travellers) {
                assert.deepEqual(Object.keys(t), ['name'],
                    'array position must never become a traveller identity');
            }
        }
    });
});

// ---------------------------------------------------------------------------
// canonical control case
// ---------------------------------------------------------------------------

describe('the canonical path is unchanged', () => {
    test('a canonical booking still carries its pricing and payment detail', () => {
        const d = client.toDisplayBooking('canon-1', canonicalBooking);
        assert.equal(d.legacy, false);
        assert.equal(d.reference, 'IY-BKG-2026-ABC123');
        assert.equal(d.totalDisplay, 149000, 'minor units divided by minorUnitsPerMajor');
        assert.equal(d.title, 'Ladakh Expedition — 8 Days');
    });

    test('client and server classify identically across every fixture', () => {
        const all = { ...LEGACY_FIXTURES, CANONICAL: canonicalBooking };
        for (const [name, fixture] of Object.entries(all)) {
            assert.equal(client.classifyBooking(fixture), server.classifyBooking(fixture),
                `client and server disagree on ${name}`);
        }
    });

    test('the client mirror and the server agree on the version constant', () => {
        assert.equal(client.CANONICAL_SCHEMA_VERSION, server.CANONICAL_SCHEMA_VERSION);
        assert.equal(client.MIN_CANONICAL_SCHEMA_VERSION, server.MIN_CANONICAL_SCHEMA_VERSION);
        assert.deepEqual(client.BOOKING_SCHEMA, server.BOOKING_SCHEMA);
    });
});

// ---------------------------------------------------------------------------
// [14] the /api/api bug
// ---------------------------------------------------------------------------

describe('[14] booking API URLs contain exactly one /api', () => {
    const BASES = [
        '',
        'https://us-central1-infiniteyatra-iy.cloudfunctions.net',
        // The value the old docs actually suggested — the bug's origin.
        'https://us-central1-infiniteyatra-iy.cloudfunctions.net/api',
        'https://us-central1-infiniteyatra-iy.cloudfunctions.net/api/',
        'https://www.infiniteyatra.com/',
    ];
    const PATHS = ['/bookings/package', '/bookings/abc123', '/bookings/abc/documents', '/bookings/abc/summary'];

    test('no combination of base and path produces /api/api', () => {
        for (const base of BASES) {
            for (const path of PATHS) {
                const url = buildBookingApiUrl(path, base);
                assert.ok(!url.includes('/api/api'), `double prefix for base "${base}" path "${path}": ${url}`);
                assert.equal((url.match(/\/api(?=\/|$)/g) || []).length, 1,
                    `expected exactly one /api segment: ${url}`);
            }
        }
    });

    test('a caller that already prefixed /api is tolerated, not doubled', () => {
        assert.equal(buildBookingApiUrl('/api/bookings/x', ''), '/api/bookings/x');
    });

    test('an empty base means same-origin', () => {
        assert.equal(buildBookingApiUrl('/bookings/x', ''), '/api/bookings/x');
        assert.equal(normaliseBase(undefined), '');
    });

    test('no double slash is produced outside the scheme', () => {
        for (const base of BASES) {
            const url = buildBookingApiUrl('/bookings/x', base);
            assert.ok(!url.replace(/^https?:\/\//, '').includes('//'), `double slash: ${url}`);
        }
    });

    test('a path without a leading slash is a programming error, not a silent join', () => {
        assert.throws(() => buildBookingApiUrl('bookings/x', ''), /must start with/);
    });

    test('all three API clients build URLs through the shared helper', () => {
        for (const f of ['packageBookingApi', 'packageBookingDocumentsApi', 'packageBookingSummaryApi']) {
            const src = read(`../src/services/${f}.js`);
            assert.match(src, /buildBookingApiUrl/, `${f} must use the shared builder`);
            assert.ok(!/\$\{d\.baseUrl\}\/api/.test(src),
                `${f} must not concatenate the /api prefix itself`);
        }
    });
});
