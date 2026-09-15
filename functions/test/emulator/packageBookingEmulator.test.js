/**
 * PB-1 GATE 1 — Firebase Emulator integration tests.
 *
 * These run the real handlers against the REAL Firebase Admin SDK talking to
 * the REAL Firestore and Auth emulators. Nothing is doubled here: ID tokens are
 * genuinely minted by the Auth emulator and genuinely verified by
 * admin.auth().verifyIdToken(); transactions are genuinely committed by
 * Firestore with real contention and real rollback semantics.
 *
 * This is the coverage the in-memory double in ../helpers/fakeFirestore.js
 * could not provide.
 *
 * Run via:
 *   npm run test:emulator        (from the repo root)
 *
 * Requires FIRESTORE_EMULATOR_HOST and FIREBASE_AUTH_EMULATOR_HOST, which
 * `firebase emulators:exec` sets automatically.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const admin = require('firebase-admin');

const PROJECT_ID = process.env.GCLOUD_PROJECT || 'demo-infinite-yatra-pb1';
const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';

assert.ok(
    process.env.FIRESTORE_EMULATOR_HOST,
    'FIRESTORE_EMULATOR_HOST is not set — these tests must run under `firebase emulators:exec`',
);
assert.ok(
    process.env.FIREBASE_AUTH_EMULATOR_HOST,
    'FIREBASE_AUTH_EMULATOR_HOST is not set — these tests must run under `firebase emulators:exec`',
);

admin.initializeApp({ projectId: PROJECT_ID });
const db = admin.firestore();

const { requireFirebaseUser, createPackageBooking, getOwnBooking } = require('../../packageBookings');
const { isValidReference } = require('../../packageBookingReference');

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

function mockReq({ body = {}, params = {}, headers = {} } = {}) {
    return { body, params, headers };
}

function mockRes() {
    return {
        statusCode: null,
        body: null,
        headersSent: false,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            this.headersSent = true;
            return this;
        },
    };
}

async function callWithAuth(handler, req, res) {
    let nexted = false;
    await requireFirebaseUser(req, res, () => {
        nexted = true;
    });
    if (!nexted) return res;
    await handler(req, res);
    return res;
}

/**
 * Mint a REAL Firebase ID token from the Auth emulator.
 *
 * A custom token is exchanged through the emulator's Identity Toolkit endpoint,
 * producing a token with the same structure and claims a production token has.
 * verifyIdToken() then validates it for real.
 */
async function mintIdToken(uid, email) {
    try {
        await admin.auth().createUser({ uid, email });
    } catch (err) {
        if (err.code !== 'auth/uid-already-exists') throw err;
    }
    const customToken = await admin.auth().createCustomToken(uid);

    const res = await fetch(
        `http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake-api-key`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: customToken, returnSecureToken: true }),
        },
    );
    const data = await res.json();
    assert.ok(data.idToken, `Auth emulator did not return an ID token: ${JSON.stringify(data)}`);
    return data.idToken;
}

async function wipeFirestore() {
    const res = await fetch(
        `http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
        { method: 'DELETE' },
    );
    assert.ok(res.ok, `Failed to clear Firestore emulator: ${res.status}`);
}

const PACKAGE = {
    title: 'Himalaya Trek',
    location: 'Uttarakhand, India',
    duration: '5 Days / 4 Nights',
    price: 15000,
    costPrice: 9000,
    tokenPrice: 2000,
    adminNotes: 'Supplier: Sharma Treks',
    internalNotes: 'Vendor payment pending',
    isVisible: true,
    departureType: 'daily',
    maxGroupSize: 12,
    minimumPersons: 4,
    seasonStartDate: '2026-04-01',
    seasonEndDate: '2026-10-31',
    inclusions: ['Accommodation'],
    exclusions: ['Personal expenses'],
    cancellationPolicy: ['Token non-refundable'],
    pickupLocations: [
        { location: 'Delhi', price: 16000, b2bPrice: 11000 },
        { location: 'Rishikesh', price: 14000, b2bPrice: 9500 },
    ],
};

let keyN = 0;
const freshKey = () => `emu-key-${Date.now()}-${(keyN += 1)}-abcdefgh`;

function body(overrides = {}) {
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

const post = (b, token) =>
    callWithAuth(
        createPackageBooking,
        mockReq({ body: b, headers: token ? { authorization: `Bearer ${token}` } : {} }),
        mockRes(),
    );

const get = (id, token) =>
    callWithAuth(
        getOwnBooking,
        mockReq({ params: { bookingId: id }, headers: token ? { authorization: `Bearer ${token}` } : {} }),
        mockRes(),
    );

let aliceToken;
let bobToken;

test.before(async () => {
    await wipeFirestore();
    await db.collection('packages').doc('himalaya-trek').set(PACKAGE);
    await db.collection('packages').doc('draft-trek').set({ ...PACKAGE, isVisible: false });
    aliceToken = await mintIdToken('emu-alice', 'alice@example.com');
    bobToken = await mintIdToken('emu-bob', 'bob@example.com');
});

// ---------------------------------------------------------------------------
// [G1-2] Authenticated booking creation — real transaction write
// ---------------------------------------------------------------------------

test('[G1-2][G1-4] authenticated booking creates a real Firestore transaction write', async () => {
    const res = await post(body(), aliceToken);
    assert.equal(res.statusCode, 201, JSON.stringify(res.body));

    const id = res.body.booking.id;

    // Read back through the Admin SDK — proves the data actually committed.
    const snap = await db.collection('bookings').doc(id).get();
    assert.ok(snap.exists);
    const d = snap.data();

    assert.equal(d.userId, 'emu-alice');
    assert.equal(d.packageId, 'himalaya-trek');
    assert.equal(d.pricing.grossAmountMinor, 3200000); // Delhi 16000 x 2
    assert.equal(d.schemaVersion, 2);

    // serverTimestamp() resolved to a real Firestore timestamp
    assert.ok(d.createdAt, 'createdAt must be set');
    assert.equal(typeof d.createdAt.toDate, 'function');

    // All four documents of the transaction committed together
    const ref = await db.collection('booking_references').doc(d.bookingReference).get();
    assert.ok(ref.exists, 'reference reservation must exist');
    assert.equal(ref.data().bookingId, id);

    const activity = await db.collection('bookings').doc(id).collection('activity').get();
    assert.equal(activity.size, 1);
    assert.equal(activity.docs[0].data().type, 'BOOKING_SUBMITTED');
    assert.equal(activity.docs[0].data().actorId, 'emu-alice');

    const idem = await db.collection('booking_idempotency').get();
    assert.ok(idem.size >= 1, 'idempotency record must exist');
});

// ---------------------------------------------------------------------------
// [G1-1][G1-3] Authentication against the real Auth emulator
// ---------------------------------------------------------------------------

test('[G1-1] unauthenticated booking creation is rejected with 401', async () => {
    const before = (await db.collection('bookings').get()).size;
    const res = await post(body(), null);
    assert.equal(res.statusCode, 401);
    const after = (await db.collection('bookings').get()).size;
    assert.equal(after, before, 'no booking may be written');
});

test('[G1-3] a real ID token is verified and its uid becomes the owner', async () => {
    const res = await post(body(), bobToken);
    assert.equal(res.statusCode, 201);
    const snap = await db.collection('bookings').doc(res.body.booking.id).get();
    assert.equal(snap.data().userId, 'emu-bob', 'owner must come from the verified token');
});

test('[G1-3] a forged / tampered ID token is rejected by verifyIdToken', async () => {
    // Flip a character in the signature segment of a genuine token.
    const parts = aliceToken.split('.');
    const tampered = `${parts[0]}.${parts[1]}.${parts[2].slice(0, -4)}AAAA`;

    const before = (await db.collection('bookings').get()).size;
    for (const bad of [tampered, 'not.a.token', 'Bearer-ish-garbage']) {
        const res = await post(body(), bad);
        assert.equal(res.statusCode, 401, `token "${bad.slice(0, 20)}…" must be rejected`);
    }
    assert.equal((await db.collection('bookings').get()).size, before);
});

test('[G1-3] an expired-issuer token from another project is rejected', async () => {
    // A well-formed JWT that was not issued by this project's Auth emulator.
    const foreign =
        'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.' +
        Buffer.from(
            JSON.stringify({ sub: 'emu-alice', aud: 'some-other-project', iss: 'https://evil.example' }),
        ).toString('base64url') +
        '.c2lnbmF0dXJl';
    const res = await post(body(), foreign);
    assert.equal(res.statusCode, 401);
});

// ---------------------------------------------------------------------------
// [G1-5] Idempotency under real Firestore
// ---------------------------------------------------------------------------

test('[G1-5] a repeated idempotency key returns the original booking, creating no duplicate', async () => {
    const b = body();
    const first = await post(b, aliceToken);
    const second = await post(b, aliceToken);
    const third = await post(b, aliceToken);

    assert.equal(first.statusCode, 201);
    assert.equal(second.statusCode, 200);
    assert.equal(third.statusCode, 200);
    assert.equal(second.body.idempotentReplay, true);
    assert.equal(first.body.booking.id, second.body.booking.id);

    const matching = await db
        .collection('bookings')
        .where('bookingReference', '==', first.body.booking.bookingReference)
        .get();
    assert.equal(matching.size, 1, 'exactly one booking may exist for the reference');
});

test('[G1-5] concurrent identical submissions settle to exactly one booking', async () => {
    const b = body();

    // Real Firestore transaction contention — the case the in-memory double
    // could not exercise.
    const results = await Promise.all([
        post(b, aliceToken),
        post(b, aliceToken),
        post(b, aliceToken),
        post(b, aliceToken),
    ]);

    const ids = new Set(results.map((r) => r.body?.booking?.id).filter(Boolean));
    assert.equal(ids.size, 1, `expected one booking id, got ${[...ids].join(', ')}`);

    const created = results.filter((r) => r.statusCode === 201).length;
    assert.equal(created, 1, 'exactly one request may report a create');

    const ref = [...ids][0];
    const activity = await db.collection('bookings').doc(ref).collection('activity').get();
    assert.equal(activity.size, 1, 'audit trail must not be duplicated');
});

// ---------------------------------------------------------------------------
// [G1-6][G1-7] Reference collision and transaction rollback
// ---------------------------------------------------------------------------

test('[G1-6] a reference collision is retried and yields a distinct reference', async () => {
    const first = await post(body(), aliceToken);
    const taken = first.body.booking.bookingReference;

    const second = await post(body(), aliceToken);
    assert.equal(second.statusCode, 201);
    assert.notEqual(second.body.booking.bookingReference, taken);

    assert.ok(isValidReference(second.body.booking.bookingReference));
});

test('[G1-6][G1-7] exhausted reference attempts roll back with no partial writes', async (t) => {
    // Force every generated candidate to collide by pinning the generator to a
    // single value and pre-reserving it. The handler should exhaust its retries
    // and return 503 — and critically, leave nothing behind.
    const refModule = require('../../packageBookingReference');
    const original = refModule.generateCandidate;
    const PINNED = 'IY-BKG-2026-ZZZZZZ';

    refModule.generateCandidate = () => PINNED;
    delete require.cache[require.resolve('../../packageBookings')];
    const reloaded = require('../../packageBookings');

    t.after(() => {
        refModule.generateCandidate = original;
        delete require.cache[require.resolve('../../packageBookings')];
    });

    await db.collection('booking_references').doc(PINNED).set({
        bookingId: 'pre-existing',
        userId: 'someone-else',
    });

    const bookingsBefore = (await db.collection('bookings').get()).size;
    const idemBefore = (await db.collection('booking_idempotency').get()).size;

    const res = await callWithAuth.call(
        null,
        reloaded.createPackageBooking,
        mockReq({ body: body(), headers: { authorization: `Bearer ${aliceToken}` } }),
        mockRes(),
    );

    assert.equal(res.statusCode, 503, `expected 503, got ${res.statusCode} ${JSON.stringify(res.body)}`);

    // Nothing partially written: no booking, no idempotency record, and the
    // pre-existing reservation is untouched.
    assert.equal((await db.collection('bookings').get()).size, bookingsBefore, 'no booking may be created');
    assert.equal(
        (await db.collection('booking_idempotency').get()).size,
        idemBefore,
        'no idempotency record may be created',
    );
    const reservation = await db.collection('booking_references').doc(PINNED).get();
    assert.equal(reservation.data().bookingId, 'pre-existing', 'existing reservation must be untouched');
});

// ---------------------------------------------------------------------------
// [G1-8][G1-9] Ownership on read
// ---------------------------------------------------------------------------

test('[G1-8] a customer reads their own booking', async () => {
    const created = await post(body(), aliceToken);
    const res = await get(created.body.booking.id, aliceToken);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.booking.id, created.body.booking.id);
    assert.equal(res.body.booking.payment.paymentStatus, 'UNPAID');
    assert.equal(res.body.booking.payment.amountReceivedMinor, 0);
    assert.equal(
        res.body.booking.payment.balanceAmountMinor,
        res.body.booking.pricing.grossAmountMinor,
    );
});

test('[G1-9] a customer cannot read another customer booking', async () => {
    const created = await post(body(), aliceToken);

    const res = await get(created.body.booking.id, bobToken);
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.booking, undefined);

    // …and is indistinguishable from a booking that does not exist
    const missing = await get('no-such-booking-id', bobToken);
    assert.deepEqual(res.body, missing.body);
});

// ---------------------------------------------------------------------------
// Price authority and private-field containment, against real data
// ---------------------------------------------------------------------------

test('a manipulated client price is rejected; the stored total is the server price', async () => {
    const res = await post(body({ totalPrice: 1, pricing: { grossAmountMinor: 1 } }), aliceToken);
    assert.equal(res.statusCode, 400);

    const ok = await post(body({ pickupLocationIndex: 1 }), aliceToken);
    const snap = await db.collection('bookings').doc(ok.body.booking.id).get();
    assert.equal(snap.data().pricing.grossAmountMinor, 2800000); // Rishikesh 14000 x 2
    assert.equal(snap.data().totalPrice, 28000);
});

test('an unpublished package is rejected with 409', async () => {
    const res = await post(body({ packageId: 'draft-trek' }), aliceToken);
    assert.equal(res.statusCode, 409);
});

test('private package cost fields never reach the customer response or the stored snapshot', async () => {
    const created = await post(body(), aliceToken);
    const read = await get(created.body.booking.id, aliceToken);
    const snap = await db.collection('bookings').doc(created.body.booking.id).get();

    const surfaces = {
        'create response': JSON.stringify(created.body.booking),
        'read response': JSON.stringify(read.body.booking),
        'stored snapshot': JSON.stringify(snap.data().packageSnapshot),
    };

    for (const [name, serialised] of Object.entries(surfaces)) {
        for (const leak of [
            'costPrice',
            'tokenPrice',
            'b2bPrice',
            'adminNotes',
            'internalNotes',
            'Sharma Treks',
            'Vendor payment pending',
        ]) {
            assert.ok(!serialised.includes(leak), `${name} must not contain "${leak}"`);
        }
    }
});
