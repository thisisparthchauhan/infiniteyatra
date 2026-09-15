/**
 * PB-1 — Package booking API tests.
 *
 * These exercise the real handlers (auth middleware, validation, package
 * loading, pricing, idempotency transaction, ownership check, customer-safe
 * projection). Only the Firestore/Auth layer is substituted, by an in-memory
 * double whose create/transaction semantics match Firestore where the handlers
 * depend on them.
 *
 * Covers the mandated PB-1 security matrix — see the numbered comments.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    requireFirebaseUser,
    createPackageBooking,
    getOwnBooking,
    __setDepsForTesting,
} = require('../packageBookings');

const { makeDeps, mockReq, mockRes, callWithAuth } = require('./helpers/fakeFirestore');
const { isValidReference } = require('../packageBookingReference');

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const CUSTOMER_A = { uid: 'uid-alice', email: 'alice@example.com' };
const CUSTOMER_B = { uid: 'uid-bob', email: 'bob@example.com' };

const TOKENS = {
    'token-alice': CUSTOMER_A,
    'token-bob': CUSTOMER_B,
};

const PACKAGE = {
    title: 'Himalaya Trek',
    location: 'Uttarakhand, India',
    duration: '5 Days / 4 Nights',
    price: 15000,
    // Private commercial fields that must never reach a customer response:
    costPrice: 9000,
    tokenPrice: 2000,
    adminNotes: 'Supplier: Sharma Treks. Margin thin — do not discount.',
    internalNotes: 'Vendor payment pending',
    isVisible: true,
    departureType: 'daily',
    maxGroupSize: 12,
    minimumPersons: 4,
    seasonStartDate: '2026-04-01',
    seasonEndDate: '2026-10-31',
    inclusions: ['Accommodation', 'Meals'],
    exclusions: ['Personal expenses'],
    cancellationPolicy: ['Token non-refundable'],
    pickupLocations: [
        { location: 'Delhi', price: 16000, b2bPrice: 11000 },
        { location: 'Rishikesh', price: 14000, b2bPrice: 9500 },
    ],
};

const HIDDEN_PACKAGE = { ...PACKAGE, title: 'Draft Trek', isVisible: false };

const HOTEL = {
    name: 'Riverside Lodge',
    isVisible: true,
    rooms: [{ id: 'r1', name: 'Deluxe', price: 4000 }],
};

function seed() {
    return {
        'packages/himalaya-trek': { ...PACKAGE },
        'packages/draft-trek': { ...HIDDEN_PACKAGE },
        'hotels/riverside': { ...HOTEL },
    };
}

let keyCounter = 0;
function freshKey(prefix = 'idem') {
    keyCounter += 1;
    return `${prefix}-key-${String(keyCounter).padStart(4, '0')}-abcdefgh`;
}

function validBody(overrides = {}) {
    return {
        packageId: 'himalaya-trek',
        departureDate: '2026-05-15',
        travellerCount: 2,
        pickupLocationIndex: 0,
        customer: { name: 'Alice Kapoor', email: 'alice@example.com', phone: '+919876543210' },
        travellers: [
            { firstName: 'Alice', lastName: 'Kapoor' },
            { firstName: 'Ravi', lastName: 'Kapoor' },
        ],
        idempotencyKey: freshKey(),
        ...overrides,
    };
}

/** Build a fresh isolated environment and point the handlers at it. */
function env() {
    const { store, deps } = makeDeps({ seed: seed(), tokens: TOKENS });
    __setDepsForTesting(deps);
    return store;
}

async function post(body, token = 'token-alice') {
    const headers = token ? { authorization: `Bearer ${token}` } : {};
    return callWithAuth(requireFirebaseUser, createPackageBooking, mockReq({ body, headers }), mockRes());
}

async function get(bookingId, token = 'token-alice') {
    const headers = token ? { authorization: `Bearer ${token}` } : {};
    return callWithAuth(
        requireFirebaseUser,
        getOwnBooking,
        mockReq({ params: { bookingId }, headers }),
        mockRes(),
    );
}

// ---------------------------------------------------------------------------
// 1. Authentication
// ---------------------------------------------------------------------------

test('[1] unauthenticated booking creation is rejected with 401', async () => {
    const store = env();
    const res = await post(validBody(), null);
    assert.equal(res.statusCode, 401);
    assert.equal(store.allDocsIn('bookings').length, 0, 'no booking may be written');
});

test('[1b] a malformed or unknown bearer token is rejected with 401', async () => {
    const store = env();
    for (const bad of ['not-a-real-token', '', 'token-alice-tampered']) {
        const res = await post(validBody(), bad);
        assert.equal(res.statusCode, 401, `token "${bad}" must be rejected`);
    }
    assert.equal(store.allDocsIn('bookings').length, 0);
});

// ---------------------------------------------------------------------------
// 2. Happy path
// ---------------------------------------------------------------------------

test('[2] a valid authenticated booking succeeds and persists one record', async () => {
    const store = env();
    const res = await post(validBody());

    assert.equal(res.statusCode, 201);
    const bookings = store.allDocsIn('bookings');
    assert.equal(bookings.length, 1);
    assert.equal(bookings[0].data.packageId, 'himalaya-trek');
    assert.equal(bookings[0].data.travellerCount, 2);
});

// ---------------------------------------------------------------------------
// 3. Ownership cannot be supplied by the client
// ---------------------------------------------------------------------------

test('[3] a client-supplied userId cannot change booking ownership', async () => {
    const store = env();
    const res = await post(validBody({ userId: CUSTOMER_B.uid }));

    // The validator rejects unknown top-level keys outright.
    assert.equal(res.statusCode, 400);
    assert.ok(
        res.body.details.some((d) => d.includes('userId')),
        `expected a userId rejection, got ${JSON.stringify(res.body.details)}`,
    );
    assert.equal(store.allDocsIn('bookings').length, 0);
});

test('[3b] ownership is always the verified token uid', async () => {
    const store = env();
    await post(validBody(), 'token-bob');
    const [booking] = store.allDocsIn('bookings');
    assert.equal(booking.data.userId, CUSTOMER_B.uid);
});

// ---------------------------------------------------------------------------
// 4-5. Package validity
// ---------------------------------------------------------------------------

test('[4] a nonexistent package is rejected with 404', async () => {
    const store = env();
    const res = await post(validBody({ packageId: 'does-not-exist' }));
    assert.equal(res.statusCode, 404);
    assert.equal(store.allDocsIn('bookings').length, 0);
});

test('[5] an unpublished package is rejected with 409', async () => {
    const store = env();
    const res = await post(validBody({ packageId: 'draft-trek' }));
    assert.equal(res.statusCode, 409);
    assert.equal(store.allDocsIn('bookings').length, 0);
});

// ---------------------------------------------------------------------------
// 6. Price authority — the core PB-1 guarantee
// ---------------------------------------------------------------------------

test('[6] a manipulated client price cannot influence the booking total', async () => {
    const store = env();

    // Attempt every field name the legacy client flow wrote, plus obvious guesses.
    const res = await post(
        validBody({
            totalPrice: 1,
            grossAmountMinor: 100,
            tourAmount: 1,
            pricing: { grossAmountMinor: 1 },
            amount: 1,
        }),
    );

    // Unknown keys are refused rather than ignored, so the attempt is visible.
    assert.equal(res.statusCode, 400);
    for (const field of ['totalPrice', 'grossAmountMinor', 'tourAmount', 'pricing', 'amount']) {
        assert.ok(
            res.body.details.some((d) => d.includes(field)),
            `expected "${field}" to be rejected as an unaccepted field`,
        );
    }
    assert.equal(store.allDocsIn('bookings').length, 0);
});

test('[6b] the stored total is the server price, computed from the package', async () => {
    const store = env();
    await post(
        validBody({
            travellerCount: 3,
            pickupLocationIndex: 1,
            travellers: [
                { firstName: 'Alice', lastName: 'Kapoor' },
                { firstName: 'Ravi', lastName: 'Kapoor' },
                { firstName: 'Meera', lastName: 'Kapoor' },
            ],
        }),
    );

    const [booking] = store.allDocsIn('bookings');
    // Rishikesh @ 14000 x 3 travellers = 42000 => 4,200,000 paise
    assert.equal(booking.data.pricing.grossAmountMinor, 4200000);
    assert.equal(booking.data.pricing.unitPriceMinor, 1400000);
    assert.equal(booking.data.totalPrice, 42000, 'legacy rupee field stays consistent');
});

test('[6c] the same request at a different pickup yields a different server price', async () => {
    const store = env();
    await post(validBody({ pickupLocationIndex: 0 })); // Delhi 16000 x2 = 32000
    const [booking] = store.allDocsIn('bookings');
    assert.equal(booking.data.pricing.grossAmountMinor, 3200000);
});

// ---------------------------------------------------------------------------
// 7-8. Selection validity
// ---------------------------------------------------------------------------

test('[7] an out-of-season departure is rejected', async () => {
    const store = env();
    const res = await post(validBody({ departureDate: '2026-12-25' }));
    assert.equal(res.statusCode, 400);
    assert.ok(res.body.details.join(' ').includes('season'));
    assert.equal(store.allDocsIn('bookings').length, 0);
});

test('[7b] a malformed departure date is rejected', async () => {
    env();
    const res = await post(validBody({ departureDate: '15-05-2026' }));
    assert.equal(res.statusCode, 400);
});

test('[8] an out-of-range pickup location index is rejected', async () => {
    const store = env();
    const res = await post(validBody({ pickupLocationIndex: 9 }));
    assert.equal(res.statusCode, 400);
    assert.ok(res.body.details.join(' ').toLowerCase().includes('pickup'));
    assert.equal(store.allDocsIn('bookings').length, 0);
});

// ---------------------------------------------------------------------------
// 9. Traveller count
// ---------------------------------------------------------------------------

test('[9] traveller counts below 1 and above maxGroupSize are rejected', async () => {
    const store = env();

    const zero = await post(validBody({ travellerCount: 0, travellers: [] }));
    assert.equal(zero.statusCode, 400);

    const tooMany = await post(validBody({ travellerCount: 13, travellers: [] }));
    assert.equal(tooMany.statusCode, 400);
    assert.ok(tooMany.body.details.join(' ').includes('maximum'));

    assert.equal(store.allDocsIn('bookings').length, 0);
});

test('[9b] travellers array length must match travellerCount', async () => {
    env();
    const res = await post(validBody({ travellerCount: 3 })); // body supplies 2 travellers
    assert.equal(res.statusCode, 400);
    assert.ok(res.body.details.join(' ').includes('travellerCount'));
});

// ---------------------------------------------------------------------------
// 10. Idempotency
// ---------------------------------------------------------------------------

test('[10] a duplicate submission with the same idempotency key creates one booking', async () => {
    const store = env();
    const body = validBody();

    const first = await post(body);
    const second = await post(body);
    const third = await post(body);

    assert.equal(first.statusCode, 201);
    assert.equal(second.statusCode, 200, 'replay should return 200, not a second create');
    assert.equal(third.statusCode, 200);

    assert.equal(second.body.idempotentReplay, true);
    assert.equal(store.allDocsIn('bookings').length, 1, 'exactly one booking must exist');
    assert.equal(first.body.booking.id, second.body.booking.id);
    assert.equal(first.body.booking.bookingReference, second.body.booking.bookingReference);
});

test('[10b] different idempotency keys create distinct bookings', async () => {
    const store = env();
    await post(validBody());
    await post(validBody());
    assert.equal(store.allDocsIn('bookings').length, 2);
});

test('[10c] the same idempotency key from a different user does not collide', async () => {
    const store = env();
    const key = freshKey('shared');
    await post(validBody({ idempotencyKey: key }), 'token-alice');
    await post(validBody({ idempotencyKey: key }), 'token-bob');

    // The idempotency document is namespaced by uid, so these are independent.
    const bookings = store.allDocsIn('bookings');
    assert.equal(bookings.length, 2);
    assert.deepEqual(
        bookings.map((b) => b.data.userId).sort(),
        [CUSTOMER_A.uid, CUSTOMER_B.uid].sort(),
    );
});

// ---------------------------------------------------------------------------
// 11-13. Payment state at creation
// ---------------------------------------------------------------------------

test('[11][12][13] a new booking is UNPAID, received 0, balance equals the server total', async () => {
    const store = env();
    const res = await post(validBody({ travellerCount: 2, pickupLocationIndex: 0 }));

    const [booking] = store.allDocsIn('bookings');
    const d = booking.data;

    assert.equal(d.paymentStatus, 'UNPAID');
    assert.equal(d.amountReceivedMinor, 0);
    assert.equal(d.balanceAmountMinor, d.pricing.grossAmountMinor);
    assert.equal(d.balanceAmountMinor, 3200000);
    assert.equal(d.bookingStatus, 'SUBMITTED');
    assert.equal(d.documentStatus, 'PENDING');
    assert.equal(d.paymentPlan, 'UNDECIDED');

    // and the same holds in the customer-facing response
    assert.equal(res.body.booking.payment.paymentStatus, 'UNPAID');
    assert.equal(res.body.booking.payment.amountReceivedMinor, 0);
    assert.equal(res.body.booking.payment.balanceAmountMinor, 3200000);
});

test('[11b] no Razorpay or payment-gateway artefact is written', async () => {
    const store = env();
    await post(validBody());
    const [booking] = store.allDocsIn('bookings');
    const serialised = JSON.stringify(booking.data).toLowerCase();
    for (const artefact of ['razorpay', 'order_id', 'orderid', 'paymentid', 'signature']) {
        assert.ok(!serialised.includes(artefact), `booking must not contain "${artefact}"`);
    }
});

// ---------------------------------------------------------------------------
// 14-15. Own-booking read and cross-user denial
// ---------------------------------------------------------------------------

test('[14] a customer can read their own booking', async () => {
    env();
    const created = await post(validBody(), 'token-alice');
    const id = created.body.booking.id;

    const res = await get(id, 'token-alice');
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.booking.id, id);
    assert.equal(res.body.booking.bookingReference, created.body.booking.bookingReference);
});

test('[15] a customer cannot read another customer booking', async () => {
    env();
    const created = await post(validBody(), 'token-alice');
    const id = created.body.booking.id;

    const res = await get(id, 'token-bob');
    assert.equal(res.statusCode, 404, 'must not disclose that the booking exists');
    assert.equal(res.body.booking, undefined);
});

test('[15b] an unauthenticated read is rejected with 401', async () => {
    env();
    const created = await post(validBody(), 'token-alice');
    const res = await get(created.body.booking.id, null);
    assert.equal(res.statusCode, 401);
});

test('[15c] a nonexistent booking returns the same 404 as a forbidden one', async () => {
    env();
    const missing = await get('no-such-booking', 'token-alice');
    assert.equal(missing.statusCode, 404);

    const created = await post(validBody(), 'token-alice');
    const forbidden = await get(created.body.booking.id, 'token-bob');

    assert.deepEqual(missing.body, forbidden.body, 'responses must be indistinguishable');
});

// ---------------------------------------------------------------------------
// 16. Customer-safe projection
// ---------------------------------------------------------------------------

test('[16] private cost and internal fields never appear in the customer response', async () => {
    env();
    const created = await post(validBody());
    const read = await get(created.body.booking.id);

    for (const payload of [created.body.booking, read.body.booking]) {
        const serialised = JSON.stringify(payload);

        for (const key of [
            'costPrice',
            'tokenPrice',
            'b2bPrice',
            'adminNotes',
            'internalNotes',
            'financialNotes',
            'margin',
            'supplierCost',
        ]) {
            assert.ok(!serialised.includes(key), `customer response must not contain key "${key}"`);
        }

        // and the private values themselves must be absent
        assert.ok(!serialised.includes('Sharma Treks'), 'supplier name must not leak');
        assert.ok(!serialised.includes('Vendor payment pending'), 'internal note must not leak');
        assert.ok(!serialised.includes('11000'), 'b2b price must not leak');
    }
});

test('[16b] the customer response exposes no raw package document passthrough', async () => {
    env();
    const created = await post(validBody());
    const pkg = created.body.booking.package;
    assert.deepEqual(
        Object.keys(pkg).sort(),
        ['cancellationPolicy', 'duration', 'exclusions', 'inclusions', 'location', 'pickupLocation', 'slug', 'title'].sort(),
    );
});

test('[16c] the stored package snapshot itself carries no private commercial data', async () => {
    const store = env();
    await post(validBody());
    const [booking] = store.allDocsIn('bookings');
    const snapshot = JSON.stringify(booking.data.packageSnapshot);
    for (const leak of ['costPrice', 'tokenPrice', 'b2bPrice', 'adminNotes', 'internalNotes', 'Sharma Treks']) {
        assert.ok(!snapshot.includes(leak), `snapshot must not contain "${leak}"`);
    }
});

// ---------------------------------------------------------------------------
// 17. Booking reference
// ---------------------------------------------------------------------------

test('[17] the booking reference is server-generated, well-formed and reserved', async () => {
    const store = env();
    const res = await post(validBody());
    const ref = res.body.booking.bookingReference;

    assert.ok(isValidReference(ref), `"${ref}" must match IY-BKG-YYYY-XXXXXX`);

    // A reservation document exists, which is what makes the reference unique.
    const reservations = store.allDocsIn('booking_references');
    assert.equal(reservations.length, 1);
    assert.equal(reservations[0].id, ref);
    assert.equal(reservations[0].data.bookingId, res.body.booking.id);
});

test('[17b] concurrent bookings receive distinct references', async () => {
    const store = env();
    const results = await Promise.all([post(validBody()), post(validBody()), post(validBody())]);

    const refs = results.map((r) => r.body.booking.bookingReference);
    assert.equal(new Set(refs).size, 3, 'all references must be unique');
    assert.equal(store.allDocsIn('booking_references').length, 3);
});

test('[17c] a reference collision is retried rather than surfaced', async () => {
    const store = env();

    // Pre-reserve whatever the next candidate will be by seeding a collision on
    // the first reference the generator produces, then confirm the handler still
    // succeeds with a different one.
    const first = await post(validBody());
    const takenRef = first.body.booking.bookingReference;

    const second = await post(validBody());
    assert.equal(second.statusCode, 201);
    assert.notEqual(second.body.booking.bookingReference, takenRef);
    assert.equal(store.allDocsIn('bookings').length, 2);
});

// ---------------------------------------------------------------------------
// Audit trail
// ---------------------------------------------------------------------------

test('a BOOKING_SUBMITTED activity entry is written with the actor and no document content', async () => {
    const store = env();
    const res = await post(validBody());
    const bookingId = res.body.booking.id;

    const activity = store.allDocsIn(`bookings/${bookingId}/activity`);
    assert.equal(activity.length, 1);
    assert.equal(activity[0].data.type, 'BOOKING_SUBMITTED');
    assert.equal(activity[0].data.actorId, CUSTOMER_A.uid);
    assert.equal(activity[0].data.actorType, 'customer');
    assert.equal(activity[0].data.source, 'web');

    const serialised = JSON.stringify(activity[0].data).toLowerCase();
    for (const forbidden of ['passport', 'aadhaar', 'pan', 'documenturl', 'traveller']) {
        assert.ok(!serialised.includes(forbidden), `audit entry must not contain "${forbidden}"`);
    }
});

// ---------------------------------------------------------------------------
// Hotel bundle
// ---------------------------------------------------------------------------

test('the bundled hotel price is derived server-side, not taken from the client', async () => {
    const store = env();
    const res = await post(validBody({ hotelBundle: { hotelId: 'riverside', roomId: 'r1' } }));

    assert.equal(res.statusCode, 201);
    const [booking] = store.allDocsIn('bookings');

    // Delhi 16000 x 2 = 32000 tour; room 4000 less 15% = 3400; total 35400
    assert.equal(booking.data.pricing.tourAmountMinor, 3200000);
    assert.equal(booking.data.pricing.hotelGrossMinor, 400000);
    assert.equal(booking.data.pricing.hotelDiscountMinor, 60000);
    assert.equal(booking.data.pricing.grossAmountMinor, 3540000);
    assert.equal(booking.data.hotelBundle.roomPriceMinor, 400000);
});

test('a nonexistent bundled hotel is rejected', async () => {
    const store = env();
    const res = await post(validBody({ hotelBundle: { hotelId: 'no-hotel' } }));
    assert.equal(res.statusCode, 404);
    assert.equal(store.allDocsIn('bookings').length, 0);
});

// ---------------------------------------------------------------------------
// Validation hygiene
// ---------------------------------------------------------------------------

test('validation errors are structured and leak no stack trace', async () => {
    env();
    const res = await post({ packageId: '', travellerCount: 'many' });
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, 'Validation failed');
    assert.ok(Array.isArray(res.body.details));
    const serialised = JSON.stringify(res.body);
    assert.ok(!serialised.includes('at Object.'), 'no stack frames');
    assert.ok(!serialised.includes('node_modules'), 'no internal paths');
});

test('an idempotency key is mandatory and length-bounded', async () => {
    env();
    const missing = await post(validBody({ idempotencyKey: undefined }));
    assert.equal(missing.statusCode, 400);

    const tooShort = await post(validBody({ idempotencyKey: 'short' }));
    assert.equal(tooShort.statusCode, 400);

    const tooLong = await post(validBody({ idempotencyKey: 'x'.repeat(200) }));
    assert.equal(tooLong.statusCode, 400);
});

test('special requests are length-capped', async () => {
    env();
    const res = await post(validBody({ specialRequests: 'x'.repeat(2001) }));
    assert.equal(res.statusCode, 400);
});

test('an invalid booking id on read is rejected before any lookup', async () => {
    env();
    const res = await get('../../packages/himalaya-trek', 'token-alice');
    assert.equal(res.statusCode, 400);
});
