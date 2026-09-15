/**
 * PB-3 — Document API integration tests against the real emulators.
 *
 * Real Firebase Admin SDK, real Firestore, real Auth, real Storage. The
 * handlers under test run exactly as deployed; only the emulator stands in for
 * production infrastructure.
 *
 * Run: npm run test:pb3
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const admin = require('firebase-admin');

const PROJECT_ID = process.env.GCLOUD_PROJECT || 'demo-infinite-yatra-pb3';
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
    finalizeDocument,
    listDocuments,
    deleteDocument,
    buildStoragePath,
    sanitizeFilename,
    deriveDocumentStatus,
    validateFinalizeRequest,
    toCustomerSafeDocument,
    newDocumentId,
} = require('../../packageBookingDocuments');

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

const mockReq = ({ body = {}, params = {}, headers = {} } = {}) => ({ body, params, headers });

function mockRes() {
    return {
        statusCode: null, body: null, headersSent: false,
        status(c) { this.statusCode = c; return this; },
        json(p) { this.body = p; this.headersSent = true; return this; },
    };
}

async function call(handler, { token, params = {}, body = {} } = {}) {
    const req = mockReq({ body, params, headers: token ? { authorization: `Bearer ${token}` } : {} });
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
    const customToken = await admin.auth().createCustomToken(uid);
    const r = await fetch(
        `http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake-api-key`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: customToken, returnSecureToken: true }) },
    );
    const d = await r.json();
    assert.ok(d.idToken, `no ID token: ${JSON.stringify(d)}`);
    return d.idToken;
}

const PDF = Buffer.from('%PDF-1.4 test document');

async function putObject(path, contentType = 'application/pdf', body = PDF) {
    await bucket.file(path).save(body, { contentType, resumable: false });
}

const ALICE = 'pb3-alice';
const BOB = 'pb3-bob';
const T_ALICE = 'tr_aaaaaaaaaaaa';
const T_BOB = 'tr_bbbbbbbbbbbb';
const BK_ALICE = 'bk-pb3-alice';
const BK_BOB = 'bk-pb3-bob';

let aliceToken, bobToken;

async function seedBooking(id, uid, travellerId) {
    await db.collection('bookings').doc(id).set({
        userId: uid,
        bookingReference: `IY-BKG-2026-${id.slice(-6).toUpperCase()}`,
        packageId: 'himalaya-trek',
        travellers: [{ travellerId, firstName: 'T', lastName: 'One' }],
        travellerCount: 1,
        bookingStatus: 'SUBMITTED',
        paymentStatus: 'UNPAID',
        documentStatus: 'PENDING',
        schemaVersion: 2,
    });
}

test.before(async () => {
    aliceToken = await mintIdToken(ALICE, 'alice@pb3.test');
    bobToken = await mintIdToken(BOB, 'bob@pb3.test');
    await seedBooking(BK_ALICE, ALICE, T_ALICE);
    await seedBooking(BK_BOB, BOB, T_BOB);
});

/** Upload an object then finalize it, the way the browser does. */
async function uploadAndFinalize({ token, uid, bookingId, travellerId, documentType = 'PASSPORT',
                                   contentType = 'application/pdf', body = PDF, documentId, filename = 'passport.pdf' }) {
    const id = documentId || newDocumentId();
    const path = buildStoragePath({ ownerUid: uid, bookingId, travellerId, documentId: id });
    await putObject(path, contentType, body);
    const res = await call(finalizeDocument, {
        token, params: { bookingId },
        body: { documentId: id, travellerId, documentType, originalFilename: filename },
    });
    return { res, documentId: id, path };
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

test('[9] a path-like filename cannot influence the storage path', () => {
    const path = buildStoragePath({
        ownerUid: ALICE, bookingId: BK_ALICE, travellerId: T_ALICE, documentId: 'doc_0123456789abcdef01234567',
    });
    assert.equal(path, `private-bookings/${ALICE}/${BK_ALICE}/travellers/${T_ALICE}/doc_0123456789abcdef01234567`);
    assert.ok(!path.includes('..'));

    // The filename is metadata only, and is sanitized before it is stored.
    assert.equal(sanitizeFilename('../../../etc/passwd'), 'passwd');
    assert.equal(sanitizeFilename('a/b/c/evil.pdf'), 'evil.pdf');
    assert.equal(sanitizeFilename('..hidden.pdf'), 'hidden.pdf');
    assert.ok(sanitizeFilename('x'.repeat(500)).length <= 120);
    const withNul = `nul${String.fromCharCode(0)}byte.pdf`;
    assert.equal(sanitizeFilename(withNul), 'nulbyte.pdf');
});

test('[21] document status is derived conservatively and never faked COMPLETE', () => {
    assert.equal(deriveDocumentStatus({ documentCount: 0 }), 'PENDING');
    assert.equal(deriveDocumentStatus({ documentCount: 1 }), 'PARTIAL');
    assert.equal(deriveDocumentStatus({ documentCount: 99 }), 'PARTIAL');
    // Only an explicit "this package needs nothing" yields NOT_REQUIRED.
    assert.equal(deriveDocumentStatus({ documentCount: 0, requiredTypes: [] }), 'NOT_REQUIRED');
});

test('[11][12] the finalize contract refuses review and ownership fields', () => {
    for (const field of ['reviewStatus', 'reviewedBy', 'reviewedAt', 'customerId', 'userId', 'storagePath', 'rejectionReason']) {
        const r = validateFinalizeRequest({
            documentId: 'doc_0123456789abcdef01234567', travellerId: T_ALICE,
            documentType: 'PASSPORT', [field]: 'x',
        });
        assert.equal(r.ok, false, `${field} must be rejected`);
        assert.ok(r.errors.some((e) => e.includes(field)));
    }
});

test('[22] the customer-safe projection exposes no storage path or URL', () => {
    const safe = toCustomerSafeDocument('doc_1', {
        travellerId: T_ALICE, documentType: 'PASSPORT', storagePath: 'private-bookings/x/y/z',
        mimeType: 'application/pdf', fileSize: 10, reviewStatus: 'UPLOADED',
        reviewedBy: 'admin-1', customerId: ALICE, originalFilename: 'p.pdf',
    });
    const flat = JSON.stringify(safe);
    for (const leak of ['storagePath', 'private-bookings', 'reviewedBy', 'admin-1', 'downloadURL', 'token']) {
        assert.ok(!flat.includes(leak), `must not expose ${leak}`);
    }
    assert.equal(safe.reviewStatus, 'UPLOADED');
});

// ---------------------------------------------------------------------------
// Auth + ownership
// ---------------------------------------------------------------------------

test('[1] an unauthenticated finalize is rejected', async () => {
    const res = await call(finalizeDocument, { token: null, params: { bookingId: BK_ALICE }, body: {} });
    assert.equal(res.statusCode, 401);
});

test('[2][16] a valid upload finalizes and creates correct metadata', async () => {
    const { res, documentId, path } = await uploadAndFinalize({
        token: aliceToken, uid: ALICE, bookingId: BK_ALICE, travellerId: T_ALICE,
    });
    assert.equal(res.statusCode, 201, JSON.stringify(res.body));

    const snap = await db.collection('bookings').doc(BK_ALICE).collection('documents').doc(documentId).get();
    assert.ok(snap.exists);
    const d = snap.data();
    assert.equal(d.customerId, ALICE, 'owner must come from the booking, not the request');
    assert.equal(d.uploadedBy, ALICE);
    assert.equal(d.travellerId, T_ALICE);
    assert.equal(d.storagePath, path);
    assert.equal(d.mimeType, 'application/pdf');
    assert.equal(d.fileSize, PDF.length, 'size must come from the real object');
    assert.equal(d.reviewStatus, 'UPLOADED');
    assert.equal(d.reviewedBy, null);

    // [15] metadata points only into the private namespace for this owner
    assert.ok(d.storagePath.startsWith(`private-bookings/${ALICE}/${BK_ALICE}/`));
});

test('[3][14] finalizing against another customer booking is refused', async () => {
    const id = newDocumentId();
    await putObject(buildStoragePath({ ownerUid: ALICE, bookingId: BK_BOB, travellerId: T_BOB, documentId: id }));
    const res = await call(finalizeDocument, {
        token: aliceToken, params: { bookingId: BK_BOB },
        body: { documentId: id, travellerId: T_BOB, documentType: 'PASSPORT' },
    });
    assert.equal(res.statusCode, 404, 'must be indistinguishable from a missing booking');

    const docs = await db.collection('bookings').doc(BK_BOB).collection('documents').get();
    assert.equal(docs.size, 0, 'no metadata may be created in another customer booking');
});

test('[13] an unknown traveller id is refused', async () => {
    const id = newDocumentId();
    await putObject(buildStoragePath({ ownerUid: ALICE, bookingId: BK_ALICE, travellerId: 'tr_ffffffffffff', documentId: id }));
    const res = await call(finalizeDocument, {
        token: aliceToken, params: { bookingId: BK_ALICE },
        body: { documentId: id, travellerId: 'tr_ffffffffffff', documentType: 'PASSPORT' },
    });
    assert.equal(res.statusCode, 400);
    assert.ok(res.body.details.join(' ').includes('does not belong'));
});

test('[14b] a traveller belonging to another booking is refused', async () => {
    const id = newDocumentId();
    await putObject(buildStoragePath({ ownerUid: ALICE, bookingId: BK_ALICE, travellerId: T_BOB, documentId: id }));
    const res = await call(finalizeDocument, {
        token: aliceToken, params: { bookingId: BK_ALICE },
        body: { documentId: id, travellerId: T_BOB, documentType: 'PASSPORT' },
    });
    assert.equal(res.statusCode, 400);
});

// ---------------------------------------------------------------------------
// Real object metadata is authoritative
// ---------------------------------------------------------------------------

test('[7] a disallowed content type is refused and the object is removed', async () => {
    const { res, path } = await uploadAndFinalize({
        token: aliceToken, uid: ALICE, bookingId: BK_ALICE, travellerId: T_ALICE,
        contentType: 'text/html', body: Buffer.from('<script>alert(1)</script>'),
    });
    assert.equal(res.statusCode, 415);
    const [exists] = await bucket.file(path).exists();
    assert.equal(exists, false, 'the refused object must not be left behind');
});

test('[8] an oversized object is refused and removed', async () => {
    const big = Buffer.alloc(10 * 1024 * 1024 + 1024, 0x41);
    const { res, path } = await uploadAndFinalize({
        token: aliceToken, uid: ALICE, bookingId: BK_ALICE, travellerId: T_ALICE, body: big,
    });
    assert.equal(res.statusCode, 413);
    const [exists] = await bucket.file(path).exists();
    assert.equal(exists, false);
});

test('finalizing with no uploaded object is refused', async () => {
    const res = await call(finalizeDocument, {
        token: aliceToken, params: { bookingId: BK_ALICE },
        body: { documentId: newDocumentId(), travellerId: T_ALICE, documentType: 'PHOTO' },
    });
    assert.equal(res.statusCode, 404);
});

// ---------------------------------------------------------------------------
// Listing, replace, delete
// ---------------------------------------------------------------------------

test('[4][5] listing returns only your own documents', async () => {
    await uploadAndFinalize({ token: aliceToken, uid: ALICE, bookingId: BK_ALICE, travellerId: T_ALICE, documentType: 'PAN' });

    const mine = await call(listDocuments, { token: aliceToken, params: { bookingId: BK_ALICE } });
    assert.equal(mine.statusCode, 200);
    assert.ok(mine.body.documents.length >= 1);

    const theirs = await call(listDocuments, { token: bobToken, params: { bookingId: BK_ALICE } });
    assert.equal(theirs.statusCode, 404, 'another customer must not list this booking');
});

test('[18][19] replacing reuses the same document id and resets review', async () => {
    const first = await uploadAndFinalize({
        token: aliceToken, uid: ALICE, bookingId: BK_ALICE, travellerId: T_ALICE, documentType: 'VISA',
    });
    assert.equal(first.res.statusCode, 201);

    await db.collection('bookings').doc(BK_ALICE).collection('documents').doc(first.documentId)
        .update({ reviewStatus: 'UNDER_REVIEW' });

    const replaced = await uploadAndFinalize({
        token: aliceToken, uid: ALICE, bookingId: BK_ALICE, travellerId: T_ALICE,
        documentType: 'VISA', documentId: first.documentId, filename: 'visa-v2.pdf',
    });
    assert.equal(replaced.res.statusCode, 200);
    assert.equal(replaced.res.body.replaced, true);

    const snap = await db.collection('bookings').doc(BK_ALICE).collection('documents').doc(first.documentId).get();
    assert.equal(snap.data().reviewStatus, 'UPLOADED', 'a replacement must go back for review');
    assert.equal(snap.data().originalFilename, 'visa-v2.pdf');

    const activity = await db.collection('bookings').doc(BK_ALICE).collection('activity')
        .where('documentId', '==', first.documentId).get();
    const types = activity.docs.map((d) => d.data().type);
    assert.ok(types.includes('DOCUMENT_UPLOADED'));
    assert.ok(types.includes('DOCUMENT_REPLACED'));
});

test('[20] deleting removes both the object and the metadata', async () => {
    const { documentId, path } = await uploadAndFinalize({
        token: aliceToken, uid: ALICE, bookingId: BK_ALICE, travellerId: T_ALICE, documentType: 'PHOTO',
    });
    const res = await call(deleteDocument, { token: aliceToken, params: { bookingId: BK_ALICE, documentId } });
    assert.equal(res.statusCode, 200);

    const [exists] = await bucket.file(path).exists();
    assert.equal(exists, false, 'no orphaned object may remain');
    const snap = await db.collection('bookings').doc(BK_ALICE).collection('documents').doc(documentId).get();
    assert.equal(snap.exists, false);
});

test('an approved document cannot be removed by the customer', async () => {
    const { documentId } = await uploadAndFinalize({
        token: aliceToken, uid: ALICE, bookingId: BK_ALICE, travellerId: T_ALICE, documentType: 'DRIVING_LICENCE',
    });
    await db.collection('bookings').doc(BK_ALICE).collection('documents').doc(documentId)
        .update({ reviewStatus: 'APPROVED' });

    const res = await call(deleteDocument, { token: aliceToken, params: { bookingId: BK_ALICE, documentId } });
    assert.equal(res.statusCode, 409);

    const snap = await db.collection('bookings').doc(BK_ALICE).collection('documents').doc(documentId).get();
    assert.equal(snap.exists, true, 'the approved document must survive');
});

test('another customer cannot delete your document', async () => {
    const { documentId } = await uploadAndFinalize({
        token: aliceToken, uid: ALICE, bookingId: BK_ALICE, travellerId: T_ALICE, documentType: 'AADHAAR',
    });
    const res = await call(deleteDocument, { token: bobToken, params: { bookingId: BK_ALICE, documentId } });
    assert.equal(res.statusCode, 404);
    const snap = await db.collection('bookings').doc(BK_ALICE).collection('documents').doc(documentId).get();
    assert.equal(snap.exists, true);
});

// ---------------------------------------------------------------------------
// Booking status + audit
// ---------------------------------------------------------------------------

test('[21b] booking.documentStatus is recomputed server-side and moves PENDING to PARTIAL', async () => {
    const bk = 'bk-pb3-status';
    await seedBooking(bk, ALICE, T_ALICE);

    let snap = await db.collection('bookings').doc(bk).get();
    assert.equal(snap.data().documentStatus, 'PENDING');

    const { res, documentId } = await uploadAndFinalize({
        token: aliceToken, uid: ALICE, bookingId: bk, travellerId: T_ALICE, documentType: 'PASSPORT',
    });
    assert.equal(res.body.documentStatus, 'PARTIAL');

    snap = await db.collection('bookings').doc(bk).get();
    assert.equal(snap.data().documentStatus, 'PARTIAL');
    assert.equal(snap.data().documentCount, 1);

    await call(deleteDocument, { token: aliceToken, params: { bookingId: bk, documentId } });
    snap = await db.collection('bookings').doc(bk).get();
    assert.equal(snap.data().documentStatus, 'PENDING', 'removing the last document returns it to PENDING');
});

test('[17] a failed document upload never creates or alters a booking', async () => {
    const before = (await db.collection('bookings').get()).size;
    await call(finalizeDocument, {
        token: aliceToken, params: { bookingId: BK_ALICE },
        body: { documentId: newDocumentId(), travellerId: T_ALICE, documentType: 'PASSPORT' },
    });
    const after = (await db.collection('bookings').get()).size;
    assert.equal(after, before, 'no booking may be created by a document operation');
});

test('audit entries record ids and types, never document content', async () => {
    const bk = 'bk-pb3-audit';
    await seedBooking(bk, ALICE, T_ALICE);
    await uploadAndFinalize({
        token: aliceToken, uid: ALICE, bookingId: bk, travellerId: T_ALICE,
        documentType: 'PASSPORT', filename: 'my-passport-number-Z1234567.pdf',
    });

    const activity = await db.collection('bookings').doc(bk).collection('activity').get();
    assert.ok(activity.size >= 1);
    const flat = JSON.stringify(activity.docs.map((d) => d.data()));

    assert.ok(flat.includes('DOCUMENT_UPLOADED'));
    for (const leak of ['Z1234567', 'my-passport-number', 'private-bookings', 'storagePath', '%PDF']) {
        assert.ok(!flat.includes(leak), `audit must not contain "${leak}"`);
    }
});
