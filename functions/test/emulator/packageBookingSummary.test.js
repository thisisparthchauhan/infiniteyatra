/**
 * PB-4 — Booking Summary integration tests against the real emulators.
 * Real Admin SDK, real Firestore, real Auth, real Storage.
 *
 * Run: npm run test:pb4
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const admin = require('firebase-admin');

const PROJECT_ID = process.env.GCLOUD_PROJECT || 'demo-infinite-yatra-pb4';
const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
const BUCKET = `${PROJECT_ID}.appspot.com`;

for (const v of ['FIRESTORE_EMULATOR_HOST', 'FIREBASE_AUTH_EMULATOR_HOST', 'FIREBASE_STORAGE_EMULATOR_HOST']) {
    assert.ok(process.env[v], `${v} is not set - run under firebase emulators:exec`);
}

admin.initializeApp({ projectId: PROJECT_ID, storageBucket: BUCKET });
const db = admin.firestore();
const bucket = admin.storage().bucket();

const { requireFirebaseUser } = require('../../packageBookings');
const {
    ensureSummary, getSummary, downloadSummary,
    formatSummaryNumber, bookingFingerprint,
    toCustomerSafeSummary, renderSummaryPdf, money, SUMMARY_NUMBER, DOCUMENT_KIND,
} = require('../../packageBookingSummary');

// --- harness ---------------------------------------------------------------

function mockRes() {
    return {
        statusCode: null, body: null, buffer: null, headers: {}, headersSent: false,
        status(c) { this.statusCode = c; return this; },
        json(p) { this.body = p; this.headersSent = true; return this; },
        send(b) { this.buffer = b; this.headersSent = true; return this; },
        setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    };
}

async function call(handler, { token, params = {}, body = {} } = {}) {
    const req = { body, params, headers: token ? { authorization: `Bearer ${token}` } : {} };
    const res = mockRes();
    let nexted = false;
    await requireFirebaseUser(req, res, () => { nexted = true; });
    if (!nexted) return res;
    await handler(req, res);
    return res;
}

async function mintIdToken(uid, email) {
    try { await admin.auth().createUser({ uid, email }); }
    catch (e) { if (e.code !== 'auth/uid-already-exists') throw e; }
    const ct = await admin.auth().createCustomToken(uid);
    const r = await fetch(
        `http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake-api-key`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: ct, returnSecureToken: true }) });
    const d = await r.json();
    assert.ok(d.idToken);
    return d.idToken;
}

const ALICE = 'pb4-alice';
const BOB = 'pb4-bob';
let aliceToken, bobToken;

function bookingDoc(uid, over = {}) {
    return {
        userId: uid,
        bookingReference: 'IY-BKG-2026-7K4MQP',
        packageId: 'himalaya-trek',
        packageSnapshot: {
            title: 'Himalaya Trek', location: 'Uttarakhand, India',
            duration: '5 Days / 4 Nights', pickupLocation: 'Delhi',
        },
        departureDate: '2026-05-15',
        travellerCount: 2,
        travellers: [
            { travellerId: 'tr_aaaaaaaaaaaa', firstName: 'Alice', lastName: 'Kapoor' },
            { travellerId: 'tr_bbbbbbbbbbbb', firstName: 'Ravi', lastName: 'Kapoor' },
        ],
        customer: { name: 'Alice Kapoor', email: 'alice@example.com', phone: '+919876543210' },
        pricing: {
            currency: 'INR', minorUnitsPerMajor: 100, unitPriceMinor: 1600000,
            tourAmountMinor: 3200000, hotelAmountMinor: 0, grossAmountMinor: 3200000,
        },
        amountReceivedMinor: 0,
        balanceAmountMinor: 3200000,
        bookingStatus: 'SUBMITTED',
        paymentStatus: 'UNPAID',
        documentStatus: 'PENDING',
        schemaVersion: 2,
        ...over,
    };
}

async function seed(id, uid, over = {}) {
    await db.collection('bookings').doc(id).set(bookingDoc(uid, over));
    return id;
}

test.before(async () => {
    aliceToken = await mintIdToken(ALICE, 'alice@pb4.test');
    bobToken = await mintIdToken(BOB, 'bob@pb4.test');
});

// --- PDF text extraction ---------------------------------------------------

/**
 * Pull the rendered text layer out of the PDF.
 *
 * pdfkit writes text as hex strings inside TJ arrays, and the document is
 * produced uncompressed precisely so this is possible. Decoding them gives the
 * words a customer actually sees, which is what the financial-integrity
 * assertions below need to inspect - checking the raw bytes would silently
 * pass whether or not the text was there.
 */
function pdfText(buf) {
    const raw = buf.toString('latin1');
    assert.ok(!raw.includes('FlateDecode'), 'the summary must be uncompressed so its text is auditable');
    return (raw.match(/<[0-9A-Fa-f]+>/g) || [])
        .map((h) => Buffer.from(h.slice(1, -1), 'hex').toString('latin1'))
        .join('');
}

// --- pure -------------------------------------------------------------------

test('[10] number format is IY-BS-YYYY-XXXXXX', () => {
    assert.equal(formatSummaryNumber(2026, 1), 'IY-BS-2026-000001');
    assert.equal(formatSummaryNumber(2026, 123456), 'IY-BS-2026-123456');
    assert.match(formatSummaryNumber(2026, 42), SUMMARY_NUMBER);
});

test('the fingerprint moves on stated facts and ignores received payment', () => {
    const base = bookingDoc(ALICE);
    assert.equal(bookingFingerprint(base), bookingFingerprint(bookingDoc(ALICE)));
    // A payment recorded later must not invalidate a summary — PB-6 issues a
    // receipt instead of rewriting this document.
    assert.equal(
        bookingFingerprint(base),
        bookingFingerprint(bookingDoc(ALICE, { amountReceivedMinor: 500000, paymentStatus: 'PARTIALLY_PAID' })),
    );
    // A stated fact changing must move it.
    assert.notEqual(bookingFingerprint(base),
        bookingFingerprint(bookingDoc(ALICE, { pricing: { ...base.pricing, grossAmountMinor: 9900000 } })));
    assert.notEqual(bookingFingerprint(base), bookingFingerprint(bookingDoc(ALICE, { departureDate: '2026-06-01' })));
});

test('[15][16] the customer projection exposes no path, URL or counter state', () => {
    const safe = toCustomerSafeSummary({
        summaryId: 'bs_1', documentKind: 'BOOKING_SUMMARY', summaryNumber: 'IY-BS-2026-000001',
        bookingId: 'bk1', version: 1, currency: 'INR', amountMinor: 3200000, minorUnitsPerMajor: 100,
        storagePath: 'private-bookings/x/y/summaries/z.pdf', customerId: ALICE,
        bookingFingerprint: 'deadbeef', issuedAtIso: '2026-01-01T00:00:00.000Z',
    });
    const flat = JSON.stringify(safe);
    for (const leak of ['storagePath', 'private-bookings', 'downloadURL', 'token', 'bookingFingerprint', 'customerId']) {
        assert.ok(!flat.includes(leak), `must not expose ${leak}`);
    }
});

test('[6][7][8] the rendered PDF makes no payment claim', async () => {
    const pdf = await renderSummaryPdf({
        booking: bookingDoc(ALICE), summaryNumber: 'IY-BS-2026-000001',
        issuedAt: '1 January 2026', version: 1,
    });
    assert.ok(pdf.length > 1000, 'a real PDF should be produced');
    assert.ok(pdf.toString('latin1').startsWith('%PDF'), 'must be a PDF');
    const text = pdfText(pdf);

    for (const forbidden of ['BOOKING AMOUNT RECEIVED', 'AMOUNT RECEIVED', 'Token Paid', 'PAYMENT RECEIPT', 'TAX INVOICE', 'Amount Received']) {
        assert.ok(!text.includes(forbidden), `PDF must not contain "${forbidden}"`);
    }
    assert.ok(!text.includes('1,000.00'), 'the fabricated 1,000 figure must never appear');

    for (const required of ['PROVISIONAL BOOKING SUMMARY', 'Not a payment receipt', 'UNPAID',
                            'Total Amount Payable', 'IY-BS-2026-000001', 'IY-BS-2026-000001']) {
        assert.ok(text.includes(required), `PDF must contain "${required}"`);
    }
});

test('the amount-received line appears only once a payment genuinely exists', async () => {
    const unpaid = pdfText(await renderSummaryPdf({
        booking: bookingDoc(ALICE), summaryNumber: 'IY-BS-2026-000002', issuedAt: '1 January 2026', version: 1,
    }));
    assert.ok(!unpaid.includes('Amount Received'), 'no received line while unpaid');

    const paid = pdfText(await renderSummaryPdf({
        booking: bookingDoc(ALICE, { amountReceivedMinor: 1000000, balanceAmountMinor: 2200000, paymentStatus: 'PARTIALLY_PAID' }),
        summaryNumber: 'IY-BS-2026-000003', issuedAt: '1 January 2026', version: 1,
    }));
    assert.ok(paid.includes('Amount Received'), 'shown when a payment exists');
    assert.ok(paid.includes('Balance Payable'));
});

test('money formats from minor units without floating point drift', () => {
    assert.equal(money(3200000, 'INR'), 'Rs.32,000.00');
    assert.equal(money(0, 'INR'), 'Rs.0.00');
    assert.equal(money(1, 'INR'), 'Rs.0.01');
});

// --- API --------------------------------------------------------------------

test('[14] an unauthenticated request is rejected', async () => {
    const id = await seed('bk-pb4-anon', ALICE);
    assert.equal((await call(ensureSummary, { token: null, params: { bookingId: id } })).statusCode, 401);
    assert.equal((await call(getSummary, { token: null, params: { bookingId: id } })).statusCode, 401);
    assert.equal((await call(downloadSummary, { token: null, params: { bookingId: id } })).statusCode, 401);
});

test('[1][2][3][4][5] a summary is generated from canonical booking data', async () => {
    const id = await seed('bk-pb4-gen', ALICE);
    const res = await call(ensureSummary, { token: aliceToken, params: { bookingId: id } });
    assert.equal(res.statusCode, 201, JSON.stringify(res.body));

    const s = res.body.summary;
    assert.match(s.summaryNumber, SUMMARY_NUMBER);
    assert.equal(s.documentKind, DOCUMENT_KIND.BOOKING_SUMMARY);
    assert.equal(s.currency, 'INR');
    assert.equal(s.amountMinor, 3200000, 'amount must be the server total');
    assert.equal(s.version, 1);

    const stored = await db.collection('booking_documents').doc(s.summaryId).get();
    assert.equal(stored.data().customerId, ALICE, 'owner copied from the booking');
    assert.equal(stored.data().isCurrent, true);
    assert.equal(stored.data().supersededBy, null);

    const [exists] = await bucket.file(stored.data().storagePath).exists();
    assert.ok(exists, 'the PDF must be stored');
    assert.ok(stored.data().storagePath.startsWith(`private-bookings/${ALICE}/${id}/summaries/`));
});

test('[11][12] a repeat request reuses the summary and consumes no number', async () => {
    const id = await seed('bk-pb4-idem', ALICE);
    const first = await call(ensureSummary, { token: aliceToken, params: { bookingId: id } });
    const second = await call(ensureSummary, { token: aliceToken, params: { bookingId: id } });
    const third = await call(ensureSummary, { token: aliceToken, params: { bookingId: id } });

    assert.equal(first.statusCode, 201);
    assert.equal(second.statusCode, 200);
    assert.equal(second.body.reused, true);
    assert.equal(third.body.reused, true);
    assert.equal(first.body.summary.summaryNumber, second.body.summary.summaryNumber);
    assert.equal(first.body.summary.summaryId, third.body.summary.summaryId);

    const all = await db.collection('booking_documents').where('bookingId', '==', id).get();
    assert.equal(all.size, 1, 'exactly one summary document');
});

test('a material change issues a new VERSION under the SAME number', async () => {
    const id = await seed('bk-pb4-version', ALICE);
    const first = await call(ensureSummary, { token: aliceToken, params: { bookingId: id } });
    const originalNumber = first.body.summary.summaryNumber;

    await db.collection('bookings').doc(id).update({ departureDate: '2026-06-20' });
    const second = await call(ensureSummary, { token: aliceToken, params: { bookingId: id } });

    assert.equal(second.body.summary.summaryNumber, originalNumber, 'number is stable');
    assert.equal(second.body.summary.version, 2);
    assert.notEqual(second.body.summary.summaryId, first.body.summary.summaryId);

    // The previous version is superseded, not overwritten.
    const prev = await db.collection('booking_documents').doc(first.body.summary.summaryId).get();
    assert.equal(prev.data().isCurrent, false);
    assert.equal(prev.data().supersededBy, second.body.summary.summaryId);
    const [stillThere] = await bucket.file(prev.data().storagePath).exists();
    assert.ok(stillThere, 'the historical PDF must survive');
});

test('[9] concurrent first-issues across bookings get unique sequential numbers', async () => {
    const ids = await Promise.all([1, 2, 3, 4, 5].map((n) => seed(`bk-pb4-conc-${n}`, ALICE)));
    const results = await Promise.all(ids.map((id) => call(ensureSummary, { token: aliceToken, params: { bookingId: id } })));

    const numbers = results.map((r) => r.body.summary.summaryNumber);
    assert.equal(new Set(numbers).size, numbers.length, `numbers must be unique: ${numbers.join(', ')}`);
    numbers.forEach((n) => assert.match(n, SUMMARY_NUMBER));
});

test('[13] another customer cannot generate, read or download your summary', async () => {
    const id = await seed('bk-pb4-cross', ALICE);
    await call(ensureSummary, { token: aliceToken, params: { bookingId: id } });

    for (const h of [ensureSummary, getSummary, downloadSummary]) {
        const res = await call(h, { token: bobToken, params: { bookingId: id } });
        assert.equal(res.statusCode, 404, 'must be indistinguishable from a missing booking');
    }
});

test('[17] the PDF can be downloaded later through the authenticated endpoint', async () => {
    const id = await seed('bk-pb4-dl', ALICE);
    const gen = await call(ensureSummary, { token: aliceToken, params: { bookingId: id } });

    const res = await call(downloadSummary, { token: aliceToken, params: { bookingId: id } });
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers['content-type'], 'application/pdf');
    assert.match(res.headers['content-disposition'], new RegExp(gen.body.summary.summaryNumber));
    assert.equal(res.headers['cache-control'], 'private, no-store');
    assert.ok(res.buffer.length > 1000);
    assert.ok(res.buffer.toString('latin1').startsWith('%PDF'));
    assert.match(pdfText(res.buffer), /PROVISIONAL BOOKING SUMMARY/);
});

test('[15] no permanent public URL or download token is stored', async () => {
    const id = await seed('bk-pb4-nourl', ALICE);
    const gen = await call(ensureSummary, { token: aliceToken, params: { bookingId: id } });
    const stored = (await db.collection('booking_documents').doc(gen.body.summary.summaryId).get()).data();

    const flat = JSON.stringify(stored);
    for (const leak of ['https://', 'firebasestorage.googleapis.com', 'downloadURL', 'downloadTokens', 'alt=media']) {
        assert.ok(!flat.includes(leak), `metadata must not contain ${leak}`);
    }
    const [meta] = await bucket.file(stored.storagePath).getMetadata();
    assert.ok(!meta.metadata?.firebaseStorageDownloadTokens, 'no download token may be minted');
});

test('[16] a caller cannot influence number, amount, kind, owner or path', async () => {
    const id = await seed('bk-pb4-mutate', ALICE);
    const res = await call(ensureSummary, {
        token: aliceToken, params: { bookingId: id },
        body: {
            summaryNumber: 'IY-BS-2026-999999', amountMinor: 1, documentKind: 'TAX_INVOICE',
            customerId: BOB, storagePath: '../../evil', version: 99, issuedAt: '1999-01-01',
        },
    });
    assert.equal(res.statusCode, 201);
    const stored = (await db.collection('booking_documents').doc(res.body.summary.summaryId).get()).data();

    assert.notEqual(stored.summaryNumber, 'IY-BS-2026-999999');
    assert.equal(stored.amountMinor, 3200000, 'amount comes from the booking');
    assert.equal(stored.documentKind, 'BOOKING_SUMMARY', 'kind cannot be escalated to a tax invoice');
    assert.equal(stored.customerId, ALICE, 'owner comes from the booking');
    assert.equal(stored.version, 1);
    assert.ok(stored.storagePath.startsWith(`private-bookings/${ALICE}/${id}/summaries/`));
    assert.ok(!stored.storagePath.includes('..'));
});

test('[18] the booking is untouched when summary generation is requested', async () => {
    const id = await seed('bk-pb4-booking-intact', ALICE);
    const before = (await db.collection('bookings').doc(id).get()).data();
    await call(ensureSummary, { token: aliceToken, params: { bookingId: id } });
    const after = (await db.collection('bookings').doc(id).get()).data();

    assert.equal(after.bookingStatus, before.bookingStatus);
    assert.equal(after.paymentStatus, 'UNPAID', 'a summary must never change payment status');
    assert.equal(after.amountReceivedMinor, 0);
    assert.equal(after.pricing.grossAmountMinor, before.pricing.grossAmountMinor);
});

test('GET returns 404 before any summary has been issued', async () => {
    const id = await seed('bk-pb4-none', ALICE);
    assert.equal((await call(getSummary, { token: aliceToken, params: { bookingId: id } })).statusCode, 404);
});

test('an activity entry records issuance without financial content', async () => {
    const id = await seed('bk-pb4-audit', ALICE);
    await call(ensureSummary, { token: aliceToken, params: { bookingId: id } });
    const act = await db.collection('bookings').doc(id).collection('activity').get();
    const flat = JSON.stringify(act.docs.map((d) => d.data()));
    assert.ok(flat.includes('BOOKING_SUMMARY_ISSUED'));
    for (const leak of ['private-bookings', 'storagePath', 'grossAmountMinor']) {
        assert.ok(!flat.includes(leak), `audit must not contain ${leak}`);
    }
});
