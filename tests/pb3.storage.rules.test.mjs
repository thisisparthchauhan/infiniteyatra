/**
 * PB-3 — Firebase Storage Security Rules tests.
 *
 * These run against the REAL Storage emulator with the REAL storage.rules file
 * loaded, using the client SDK — the same surface a browser has.
 *
 * This is the boundary that matters most in PB-3: customer A must never reach
 * customer B's identity documents. Because Storage rules cannot read Firestore,
 * that guarantee rests entirely on the uid path segment, so it is tested hard.
 *
 * Run: npm run test:pb3-storage
 */

import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { ref, uploadBytes, getBytes, deleteObject, listAll } from 'firebase/storage';

const PROJECT_ID = 'demo-infinite-yatra-pb3';
const RULES = readFileSync(new URL('../storage.rules', import.meta.url), 'utf8');

const ALICE = 'uid-alice';
const BOB = 'uid-bob';
const BOOKING = 'bk-alice-1';
const TRAVELLER = 'tr_a1b2c3d4e5f6';
const DOCUMENT = 'doc_0123456789abcdef01234567';

const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-
const meta = (contentType) => ({ contentType });

let testEnv;

const storageAs = (uid, claims = {}) =>
    uid ? testEnv.authenticatedContext(uid, claims).storage() : testEnv.unauthenticatedContext().storage();

const docPath = (owner = ALICE, booking = BOOKING, traveller = TRAVELLER, document = DOCUMENT) =>
    `private-bookings/${owner}/${booking}/travellers/${traveller}/${document}`;

before(async () => {
    testEnv = await initializeTestEnvironment({
        projectId: PROJECT_ID,
        storage: { rules: RULES },
    });
});

after(async () => { await testEnv?.cleanup(); });

beforeEach(async () => { await testEnv.clearStorage(); });

async function seedDocument(path = docPath(), contentType = 'application/pdf') {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await uploadBytes(ref(ctx.storage(), path), PDF, meta(contentType));
    });
}

// ---------------------------------------------------------------------------
// [1] Unauthenticated
// ---------------------------------------------------------------------------

describe('unauthenticated access', () => {
    test('[1] an anonymous upload is denied', async () => {
        await assertFails(uploadBytes(ref(storageAs(null), docPath()), PDF, meta('application/pdf')));
    });

    test('an anonymous read is denied, even for an existing document', async () => {
        await seedDocument();
        await assertFails(getBytes(ref(storageAs(null), docPath())));
    });

    test('an anonymous delete is denied', async () => {
        await seedDocument();
        await assertFails(deleteObject(ref(storageAs(null), docPath())));
    });
});

// ---------------------------------------------------------------------------
// [2][3][4][5][6] Ownership boundary
// ---------------------------------------------------------------------------

describe('ownership boundary', () => {
    test('[2] customer A uploads into their own namespace', async () => {
        await assertSucceeds(uploadBytes(ref(storageAs(ALICE), docPath()), PDF, meta('application/pdf')));
    });

    test('[3] customer A cannot upload into customer B namespace', async () => {
        await assertFails(
            uploadBytes(ref(storageAs(ALICE), docPath(BOB)), PDF, meta('application/pdf')),
        );
    });

    test('[4] customer A reads their own document', async () => {
        await seedDocument();
        await assertSucceeds(getBytes(ref(storageAs(ALICE), docPath())));
    });

    test('[5] customer A cannot read a document in customer B namespace', async () => {
        await seedDocument(docPath(BOB));
        await assertFails(getBytes(ref(storageAs(ALICE), docPath(BOB))));
    });

    test('[6] customer A cannot list customer B folder', async () => {
        await seedDocument(docPath(BOB));
        await assertFails(listAll(ref(storageAs(ALICE), `private-bookings/${BOB}`)));
        await assertFails(listAll(ref(storageAs(ALICE), `private-bookings/${BOB}/${BOOKING}`)));
    });

    test('customer A cannot delete or overwrite a document in customer B namespace', async () => {
        await seedDocument(docPath(BOB));
        await assertFails(deleteObject(ref(storageAs(ALICE), docPath(BOB))));
        await assertFails(uploadBytes(ref(storageAs(ALICE), docPath(BOB)), PDF, meta('application/pdf')));
    });

    test('staff and admin do not get ambient read access to private documents', async () => {
        await seedDocument();
        // Admin review goes through a server-authorized signed URL in PB-5, so
        // that every staff access is attributable rather than ambient.
        await assertFails(getBytes(ref(storageAs('uid-admin', { admin: true }), docPath())));
        await assertFails(getBytes(ref(storageAs('uid-staff', { role: 'booking_manager' }), docPath())));
    });
});

// ---------------------------------------------------------------------------
// [7][8] Content type and size
// ---------------------------------------------------------------------------

describe('file constraints', () => {
    for (const ok of ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']) {
        test(`${ok} is accepted`, async () => {
            await assertSucceeds(uploadBytes(ref(storageAs(ALICE), docPath()), PDF, meta(ok)));
        });
    }

    for (const bad of ['image/svg+xml', 'text/html', 'application/javascript',
                       'application/x-msdownload', 'application/octet-stream', 'text/plain']) {
        test(`[7] ${bad} is denied`, async () => {
            await assertFails(uploadBytes(ref(storageAs(ALICE), docPath()), PDF, meta(bad)));
        });
    }

    test('[7b] an upload with no declared content type is denied', async () => {
        await assertFails(uploadBytes(ref(storageAs(ALICE), docPath()), PDF));
    });

    test('[8] a file over 10 MB is denied', async () => {
        const tooBig = new Uint8Array(10 * 1024 * 1024 + 1024);
        await assertFails(uploadBytes(ref(storageAs(ALICE), docPath()), tooBig, meta('application/pdf')));
    });

    test('[8b] a file just under the limit is accepted', async () => {
        const nearLimit = new Uint8Array(9 * 1024 * 1024);
        await assertSucceeds(uploadBytes(ref(storageAs(ALICE), docPath()), nearLimit, meta('application/pdf')));
    });

    test('[8c] an empty file is denied', async () => {
        await assertFails(uploadBytes(ref(storageAs(ALICE), docPath()), new Uint8Array(0), meta('application/pdf')));
    });
});

// ---------------------------------------------------------------------------
// [9] Path shape
// ---------------------------------------------------------------------------

describe('path shape', () => {
    test('[9] a loose file at the customer or booking level is denied', async () => {
        await assertFails(uploadBytes(ref(storageAs(ALICE), `private-bookings/${ALICE}/stray.pdf`), PDF, meta('application/pdf')));
        await assertFails(uploadBytes(ref(storageAs(ALICE), `private-bookings/${ALICE}/${BOOKING}/stray.pdf`), PDF, meta('application/pdf')));
    });

    test('[9b] deeper nesting beyond the document id is denied', async () => {
        await assertFails(uploadBytes(
            ref(storageAs(ALICE), `${docPath()}/extra/deeper.pdf`), PDF, meta('application/pdf'),
        ));
    });

    test('[9c] the legacy pre-PB-2 booking document path is closed', async () => {
        // The removed flow wrote identity documents here and left them orphaned.
        await assertFails(uploadBytes(ref(storageAs(ALICE), `bookings/${BOOKING}/traveler_0/passport.jpg`), PDF, meta('image/jpeg')));
        await assertFails(getBytes(ref(storageAs(ALICE), `bookings/${BOOKING}/traveler_0/passport.jpg`)));
    });
});

// ---------------------------------------------------------------------------
// Deny by default, and existing production paths
// ---------------------------------------------------------------------------

describe('other paths', () => {
    test('an unrelated path is denied for everyone', async () => {
        for (const uid of [null, ALICE, 'uid-admin']) {
            await assertFails(uploadBytes(ref(storageAs(uid, { admin: true }), 'random/place.pdf'), PDF, meta('application/pdf')));
        }
    });

    test('existing car and transport image paths still work for staff', async () => {
        const staff = storageAs('uid-staff', { role: 'content_manager' });
        await assertSucceeds(uploadBytes(ref(staff, 'iy_cars/car-1/front.jpg'), PDF, meta('image/jpeg')));
        await assertSucceeds(uploadBytes(ref(staff, 'transport/content/hero.png'), PDF, meta('image/png')));
    });

    test('a customer cannot write car or transport images', async () => {
        const cust = storageAs(ALICE);
        await assertFails(uploadBytes(ref(cust, 'iy_cars/car-1/front.jpg'), PDF, meta('image/jpeg')));
        await assertFails(uploadBytes(ref(cust, 'transport/content/hero.png'), PDF, meta('image/png')));
    });

    test('car and transport images remain publicly readable', async () => {
        await testEnv.withSecurityRulesDisabled(async (ctx) => {
            await uploadBytes(ref(ctx.storage(), 'iy_cars/car-1/front.jpg'), PDF, meta('image/jpeg'));
        });
        await assertSucceeds(getBytes(ref(storageAs(null), 'iy_cars/car-1/front.jpg')));
    });
});
