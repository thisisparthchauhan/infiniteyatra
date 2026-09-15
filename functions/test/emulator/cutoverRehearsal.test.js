/**
 * CUTOVER REHEARSAL — the complete future production path, end to end.
 *
 * Drives the REAL deployable Express app (functions/bookingApi.js) over a REAL
 * socket, with REAL Firebase ID tokens minted by the Auth emulator and verified
 * by admin.auth().verifyIdToken(), against a REAL Firestore emulator.
 *
 * Nothing is doubled. This is the closest rehearsal to production that can be
 * run without deploying:
 *
 *   browser request -> PB API -> canonical booking -> schemaVersion 2
 *                   -> bookingReference -> stable traveller ids -> server pricing
 *                   -> own-booking read
 *
 * Storage-backed features are gated OFF, matching the intended initial release.
 * Legacy records are seeded alongside and must stay readable and untouched.
 *
 * Run: npm run test:cutover-rehearsal
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const admin = require('firebase-admin');

const PROJECT_ID = process.env.GCLOUD_PROJECT || 'demo-iy-rehearsal';
const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';

assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'must run under firebase emulators:exec');
assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST, 'must run under firebase emulators:exec');

admin.initializeApp({ projectId: PROJECT_ID });
const db = admin.firestore();

const { createBookingApiApp } = require('../../bookingApi');
const { isValidReference } = require('../../packageBookingReference');
const { classifyBooking, BOOKING_SCHEMA, CANONICAL_SCHEMA_VERSION } = require('../../bookingSchema');

// Storage is NOT provisioned in production, so the rehearsal runs the way the
// initial release will: storage-backed capabilities off.
const app = createBookingApiApp({ env: { PB_STORAGE_ENABLED: 'false' } });

let base;
let server;

async function mintIdToken(uid, email) {
    try { await admin.auth().createUser({ uid, email }); }
    catch (err) { if (err.code !== 'auth/uid-already-exists') throw err; }
    const customToken = await admin.auth().createCustomToken(uid);
    const res = await fetch(
        `http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake-api-key`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: customToken, returnSecureToken: true }) },
    );
    const data = await res.json();
    assert.ok(data.idToken, 'Auth emulator did not mint an ID token');
    return data.idToken;
}

const PACKAGE = {
    title: 'Himalaya Trek', location: 'Uttarakhand, India', duration: '5 Days / 4 Nights',
    price: 15000, costPrice: 9000, adminNotes: 'Supplier: internal', isVisible: true,
    departureType: 'daily', maxGroupSize: 12, minimumPersons: 1,
    seasonStartDate: '2026-04-01', seasonEndDate: '2026-10-31',
    inclusions: ['Accommodation'], exclusions: ['Personal expenses'],
    cancellationPolicy: ['Token non-refundable'],
    pickupLocations: [{ location: 'Delhi', price: 16000, b2bPrice: 11000 }],
};

/** The real production legacy shape, synthetic values. */
const LEGACY_SEED = {
    userId: 'uid-legacy-cust', packageId: 'himalaya-trek', packageTitle: 'Old Trek 2024',
    bookingDate: '2024-06-01', travelers: 2, contactName: 'Legacy Person',
    contactEmail: 'legacy@example.invalid', contactPhone: '+910000000000',
    travelersList: [{ name: 'Legacy Person', age: 40 }], specialRequests: '',
    tourAmount: 21000, hotelAmount: 9000, totalPrice: 28500,
    bundledHotelId: 'h1', bundledHotelName: 'Old Hotel',
    status: 'confirmed', bookingStatus: 'confirmed', booking_status: 'CONFIRMED',
    paymentStatus: 'paid', payment_status: 'PAID',
    razorpayOrderId: 'order_SYNTH', razorpayPaymentId: 'pay_SYNTH',
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2024-05-01T00:00:00Z')),
    updatedAt: admin.firestore.Timestamp.fromDate(new Date('2024-05-02T00:00:00Z')),
};

let n = 0;
const freshKey = () => `rehearsal-${Date.now()}-${(n += 1)}-abcdefgh`;

const bookingBody = () => ({
    packageId: 'himalaya-trek',
    departureDate: '2026-05-15',
    travellerCount: 2,
    pickupLocationIndex: 0,
    customer: { name: 'Test Customer', email: 'customer@example.invalid', phone: '+919876543210' },
    travellers: [
        { firstName: 'Test', lastName: 'Customer', dateOfBirth: '1990-01-01', gender: 'female', nationality: 'Indian' },
        { firstName: 'Second', lastName: 'Traveller', dateOfBirth: '1992-02-02', gender: 'male', nationality: 'Indian' },
    ],
    idempotencyKey: freshKey(),
    source: 'web',
});

const api = (path, { method = 'GET', token, body } = {}) =>
    fetch(`${base}${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });

test.before(async () => {
    await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`, { method: 'DELETE' });
    await db.collection('packages').doc('himalaya-trek').set(PACKAGE);
    await db.collection('bookings').doc('legacy-seed-1').set(LEGACY_SEED);
    await new Promise((resolve) => { server = app.listen(0, '127.0.0.1', resolve); });
    base = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => { await new Promise((r) => server.close(r)); });

// ---------------------------------------------------------------------------

test('[R1] health is live before anything else', async () => {
    const res = await api('/health');
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { status: 'ok', service: 'iy-booking-api' });
});

test('[R2] an unauthenticated booking attempt is refused', async () => {
    const res = await api('/api/bookings/package', { method: 'POST', body: bookingBody() });
    assert.equal(res.status, 401);
});

test('[R3] the full canonical booking path', async () => {
    const token = await mintIdToken('uid-new-cust', 'customer@example.invalid');

    const res = await api('/api/bookings/package', { method: 'POST', token, body: bookingBody() });
    assert.equal(res.status, 201, `create failed: ${await res.clone().text()}`);
    const { booking } = await res.json();

    // Server-issued reference.
    assert.ok(isValidReference(booking.bookingReference), `bad reference: ${booking.bookingReference}`);

    // Server pricing, in minor units, derived from the package - not the client.
    assert.equal(booking.pricing.currency, 'INR');
    assert.equal(booking.pricing.minorUnitsPerMajor, 100);
    assert.equal(booking.pricing.grossAmountMinor, 16000 * 2 * 100, 'pickup-location price x2 travellers');

    // Stable traveller ids, issued server-side, one per traveller.
    assert.equal(booking.travellers.length, 2);
    const ids = booking.travellers.map((t) => t.travellerId);
    assert.equal(new Set(ids).size, 2, 'traveller ids must be unique');
    for (const id of ids) assert.match(id, /^tr_[0-9a-f]{12}$/, `not a stable id: ${id}`);

    // The stored document is canonical.
    const stored = await db.collection('bookings').doc(booking.id).get();
    assert.equal(stored.get('schemaVersion'), CANONICAL_SCHEMA_VERSION);
    assert.equal(classifyBooking(stored.data()), BOOKING_SCHEMA.CANONICAL_PB);
    assert.equal(stored.get('userId'), 'uid-new-cust', 'owner comes from the token');

    // Own-booking read returns the canonical projection.
    const readRes = await api(`/api/bookings/${booking.id}`, { token });
    assert.equal(readRes.status, 200);
    const read = (await readRes.json()).booking;
    assert.equal(read.legacy, false);
    assert.equal(read.schema, 'CANONICAL_PB');
    assert.equal(read.bookingReference, booking.bookingReference);

    // Storage is off, so the server says so rather than the client guessing.
    assert.equal(read.capabilities.bookingSummary, false);
    assert.equal(read.capabilities.documentUpload, false);

    // And the storage-backed routes refuse cleanly.
    for (const p of [`/api/bookings/${booking.id}/summary`, `/api/bookings/${booking.id}/documents`]) {
        const r = await api(p, { token });
        assert.equal(r.status, 503, `${p} should be storage-gated`);
        assert.equal((await r.json()).code, 'BOOKING_STORAGE_UNAVAILABLE');
    }

    // A different customer cannot read it.
    const otherToken = await mintIdToken('uid-someone-else', 'other@example.invalid');
    assert.equal((await api(`/api/bookings/${booking.id}`, { token: otherToken })).status, 404);
});

test('[R4] idempotency: a retried submit does not double-book', async () => {
    const token = await mintIdToken('uid-retry-cust', 'retry@example.invalid');
    const body = bookingBody();
    const first = await api('/api/bookings/package', { method: 'POST', token, body });
    const second = await api('/api/bookings/package', { method: 'POST', token, body });
    assert.equal(first.status, 201);
    const a = (await first.json()).booking;
    const b = (await second.json()).booking;
    assert.equal(a.id, b.id, 'the same idempotency key must return the same booking');
    assert.equal(a.bookingReference, b.bookingReference, 'no second reference may be minted');
});

// ---------------------------------------------------------------------------
// Legacy alongside canonical
// ---------------------------------------------------------------------------

test('[R5] the legacy owner still reads their historical booking', async () => {
    const token = await mintIdToken('uid-legacy-cust', 'legacy@example.invalid');
    const res = await api('/api/bookings/legacy-seed-1', { token });
    assert.equal(res.status, 200);
    const b = (await res.json()).booking;

    assert.equal(b.legacy, true);
    assert.equal(b.schema, 'LEGACY');
    assert.equal(b.packageTitle, 'Old Trek 2024');
    assert.equal(b.historical.recordedTotal, 28500);

    // Nothing is fabricated.
    assert.ok(!('bookingReference' in b));
    assert.ok(!('pricing' in b) && !('payment' in b));
    for (const t of b.travellers) assert.deepEqual(Object.keys(t), ['name']);

    // Payment identifiers never reach the customer.
    const flat = JSON.stringify(b);
    assert.ok(!/razorpay|order_SYNTH|pay_SYNTH/i.test(flat), 'payment identifier leaked');
    assert.ok(!/amountReceived|balance/i.test(flat), 'financial value derived from a label');

    // 'paid' stays a label.
    assert.equal(b.historical.paymentStatusLabel, 'paid');
    assert.equal(b.capabilities.bookingSummary, false);
    assert.equal(b.capabilities.documentUpload, false);
});

test('[R6] another customer cannot read the legacy booking', async () => {
    const token = await mintIdToken('uid-nosy', 'nosy@example.invalid');
    assert.equal((await api('/api/bookings/legacy-seed-1', { token })).status, 404);
});

test('[R7] the legacy summary and document flows are refused for a data reason', async () => {
    // Storage-disabled returns 503 first, so prove the 409 with storage ON:
    // turning storage on later must not make legacy summaries available.
    const storageOn = createBookingApiApp({ env: { PB_STORAGE_ENABLED: 'true' } });
    const srv = await new Promise((resolve) => { const s = storageOn.listen(0, '127.0.0.1', () => resolve(s)); });
    try {
        const b2 = `http://127.0.0.1:${srv.address().port}`;
        const token = await mintIdToken('uid-legacy-cust', 'legacy@example.invalid');
        const hdr = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

        const sum = await fetch(`${b2}/api/bookings/legacy-seed-1/summary`, { method: 'POST', headers: hdr });
        assert.equal(sum.status, 409);
        assert.equal((await sum.json()).code, 'BOOKING_SUMMARY_NOT_AVAILABLE');

        const docs = await fetch(`${b2}/api/bookings/legacy-seed-1/documents`, { headers: hdr });
        assert.equal(docs.status, 409);
        assert.equal((await docs.json()).code, 'BOOKING_DOCUMENTS_NOT_AVAILABLE');
    } finally { await new Promise((r) => srv.close(r)); }
});

test('[R8] the legacy record is byte-for-byte unchanged by the whole rehearsal', async () => {
    const after = await db.collection('bookings').doc('legacy-seed-1').get();
    const data = after.data();
    for (const [k, v] of Object.entries(LEGACY_SEED)) {
        const got = data[k];
        if (v && typeof v.toDate === 'function') {
            assert.equal(got.toDate().toISOString(), v.toDate().toISOString(), `${k} changed`);
        } else {
            assert.deepEqual(got, v, `${k} changed`);
        }
    }
    assert.equal(Object.keys(data).length, Object.keys(LEGACY_SEED).length, 'a field was added');
    assert.ok(!('schemaVersion' in data), 'a legacy record must never gain the canonical marker');
});
