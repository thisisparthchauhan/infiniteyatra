/**
 * PB-4 — Security rules for Booking Summary storage and metadata.
 *
 * Runs against the real Storage and Firestore emulators with the real rules
 * files, using the client SDK — the surface a browser has.
 *
 * The summary API uses the Admin SDK and so bypasses these rules entirely.
 * These tests prove the complementary half: that a browser cannot reach or
 * forge a summary by going around the API.
 *
 * Run: npm run test:pb4-rules
 */

import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { ref, uploadBytes, getBytes, deleteObject, listAll } from 'firebase/storage';
import { doc, getDoc, getDocs, collection, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const PROJECT_ID = 'demo-infinite-yatra-pb4';
const STORAGE_RULES = readFileSync(new URL('../storage.rules', import.meta.url), 'utf8');
const FIRESTORE_RULES = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');

const ALICE = 'uid-alice';
const BOB = 'uid-bob';
const BOOKING = 'bk-alice-1';
const SUMMARY = 'bs_0123456789abcdef0123';
const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);

let testEnv;

const storageAs = (uid, claims = {}) =>
    uid ? testEnv.authenticatedContext(uid, claims).storage() : testEnv.unauthenticatedContext().storage();
const dbAs = (uid, claims = {}) =>
    uid ? testEnv.authenticatedContext(uid, claims).firestore() : testEnv.unauthenticatedContext().firestore();

const summaryPath = (owner = ALICE, booking = BOOKING, id = SUMMARY) =>
    `private-bookings/${owner}/${booking}/summaries/${id}.pdf`;

before(async () => {
    testEnv = await initializeTestEnvironment({
        projectId: PROJECT_ID,
        storage: { rules: STORAGE_RULES },
        firestore: { rules: FIRESTORE_RULES },
    });
});
after(async () => { await testEnv?.cleanup(); });
beforeEach(async () => { await testEnv.clearStorage(); await testEnv.clearFirestore(); });

async function seedSummaryObject(path = summaryPath()) {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await uploadBytes(ref(ctx.storage(), path), PDF, { contentType: 'application/pdf' });
    });
}
async function seedMetadata(id = SUMMARY) {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), `booking_documents/${id}`), {
            summaryId: id, bookingId: BOOKING, customerId: ALICE,
            documentKind: 'BOOKING_SUMMARY', summaryNumber: 'IY-BS-2026-000001',
            storagePath: summaryPath(), amountMinor: 3200000, isCurrent: true,
        });
    });
}

// ---------------------------------------------------------------------------
// Storage — the summary PDF
// ---------------------------------------------------------------------------

describe('summary storage', () => {
    test('the owner may read their own summary', async () => {
        await seedSummaryObject();
        await assertSucceeds(getBytes(ref(storageAs(ALICE), summaryPath())));
    });

    test('another customer cannot read it', async () => {
        await seedSummaryObject();
        await assertFails(getBytes(ref(storageAs(BOB), summaryPath())));
    });

    test('an anonymous client cannot read it', async () => {
        await seedSummaryObject();
        await assertFails(getBytes(ref(storageAs(null), summaryPath())));
    });

    test('no client may write a summary — a customer must not substitute their own PDF', async () => {
        for (const uid of [ALICE, BOB, null]) {
            await assertFails(
                uploadBytes(ref(storageAs(uid), summaryPath()), PDF, { contentType: 'application/pdf' }),
            );
        }
    });

    test('the owner cannot overwrite or delete their issued summary', async () => {
        await seedSummaryObject();
        await assertFails(uploadBytes(ref(storageAs(ALICE), summaryPath()), PDF, { contentType: 'application/pdf' }));
        await assertFails(deleteObject(ref(storageAs(ALICE), summaryPath())));
    });

    test('a customer cannot list another customer summaries folder', async () => {
        await seedSummaryObject(summaryPath(BOB));
        await assertFails(listAll(ref(storageAs(ALICE), `private-bookings/${BOB}/${BOOKING}/summaries`)));
    });

    test('staff get no ambient read access to summaries', async () => {
        await seedSummaryObject();
        await assertFails(getBytes(ref(storageAs('uid-admin', { admin: true }), summaryPath())));
    });

    test('traveller document uploads still work — PB-3 is unaffected', async () => {
        await assertSucceeds(uploadBytes(
            ref(storageAs(ALICE), `private-bookings/${ALICE}/${BOOKING}/travellers/tr_aaaaaaaaaaaa/doc_0123456789abcdef01234567`),
            PDF, { contentType: 'application/pdf' },
        ));
    });
});

// ---------------------------------------------------------------------------
// Firestore — summary metadata and the number counter
// ---------------------------------------------------------------------------

describe('booking_documents metadata', () => {
    test('no customer may read summary metadata directly', async () => {
        await seedMetadata();
        // Customers read through the API, which strips storagePath.
        await assertFails(getDoc(doc(dbAs(ALICE), `booking_documents/${SUMMARY}`)));
        await assertFails(getDoc(doc(dbAs(BOB), `booking_documents/${SUMMARY}`)));
        await assertFails(getDoc(doc(dbAs(null), `booking_documents/${SUMMARY}`)));
    });

    test('an admin may read it, for PB-5', async () => {
        await seedMetadata();
        await assertSucceeds(getDoc(doc(dbAs('uid-admin', { admin: true }), `booking_documents/${SUMMARY}`)));
    });

    test('no client may forge a summary record', async () => {
        for (const ctx of [dbAs(ALICE), dbAs('uid-admin', { admin: true })]) {
            await assertFails(setDoc(doc(ctx, 'booking_documents/bs_forged'), {
                bookingId: BOOKING, documentKind: 'BOOKING_SUMMARY', summaryNumber: 'IY-BS-2026-999999',
            }));
        }
    });

    test('no client may alter the amount, number or kind on an issued summary', async () => {
        await seedMetadata();
        const d = dbAs(ALICE);
        await assertFails(updateDoc(doc(d, `booking_documents/${SUMMARY}`), { amountMinor: 1 }));
        await assertFails(updateDoc(doc(d, `booking_documents/${SUMMARY}`), { summaryNumber: 'IY-BS-2026-000999' }));
        await assertFails(updateDoc(doc(d, `booking_documents/${SUMMARY}`), { documentKind: 'TAX_INVOICE' }));
        await assertFails(deleteDoc(doc(d, `booking_documents/${SUMMARY}`)));
    });

    test('a customer cannot enumerate issued summaries', async () => {
        await seedMetadata();
        await assertFails(getDocs(collection(dbAs(ALICE), 'booking_documents')));
    });
});

describe('summary number counter', () => {
    beforeEach(async () => {
        await testEnv.withSecurityRulesDisabled(async (ctx) => {
            await setDoc(doc(ctx.firestore(), 'booking_document_numbers/BOOKING_SUMMARY-2026'), { lastSequence: 41 });
        });
    });

    test('no client may read the counter — it would disclose volume', async () => {
        for (const ctx of [dbAs(ALICE), dbAs(null), dbAs('uid-admin', { admin: true })]) {
            await assertFails(getDoc(doc(ctx, 'booking_document_numbers/BOOKING_SUMMARY-2026')));
        }
    });

    test('no client may write the counter — that is the integrity of the numbering', async () => {
        for (const ctx of [dbAs(ALICE), dbAs('uid-admin', { admin: true })]) {
            await assertFails(updateDoc(doc(ctx, 'booking_document_numbers/BOOKING_SUMMARY-2026'), { lastSequence: 0 }));
        }
    });

    test('no client may pre-reserve a number to hijack it', async () => {
        await assertFails(setDoc(doc(dbAs(ALICE), 'booking_document_numbers/IY-BS-2026-000042'), { reservedFor: 'me' }));
    });
});
