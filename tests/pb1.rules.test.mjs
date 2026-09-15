/**
 * PB-1 GATE 1 — Firestore Security Rules tests for the server-owned collections.
 *
 * These run against the real Firestore emulator with the real firestore.rules
 * file loaded, using the CLIENT SDK — i.e. exactly the surface a browser has.
 *
 * The point of these tests is the boundary the Admin SDK does NOT protect:
 * PB-1's booking API bypasses rules entirely (Admin SDK), so its authorization
 * lives in server code. These tests prove the complementary half — that a
 * browser cannot reach the same data directly, going around the API.
 *
 * Run: npm run test:pb1-rules
 */

import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const PROJECT_ID = 'demo-infinite-yatra-pb1';
const RULES = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');

let testEnv;

const customerDb = (uid = 'customer-a') =>
    testEnv.authenticatedContext(uid, { email: `${uid}@example.test` }).firestore();
const adminDb = () =>
    testEnv.authenticatedContext('admin-1', { email: 'admin@example.test', admin: true }).firestore();
const publicDb = () => testEnv.unauthenticatedContext().firestore();

async function seed(path, data) {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), path), data);
    });
}

before(async () => {
    testEnv = await initializeTestEnvironment({
        projectId: PROJECT_ID,
        firestore: { rules: RULES },
    });
});

after(async () => {
    await testEnv?.cleanup();
});

beforeEach(async () => {
    await testEnv.clearFirestore();
});

// ---------------------------------------------------------------------------
// booking_references — server-owned reservation ledger
// ---------------------------------------------------------------------------

describe('booking_references', () => {
    const REF = 'IY-BKG-2026-7K4MQP';

    beforeEach(async () => {
        await seed(`booking_references/${REF}`, { bookingId: 'bk-1', userId: 'customer-a' });
    });

    test('an anonymous client cannot read a reservation', async () => {
        await assertFails(getDoc(doc(publicDb(), `booking_references/${REF}`)));
    });

    test('a signed-in customer cannot read a reservation, even their own', async () => {
        await assertFails(getDoc(doc(customerDb('customer-a'), `booking_references/${REF}`)));
    });

    test('a customer cannot enumerate reservations', async () => {
        await assertFails(getDocs(collection(customerDb(), 'booking_references')));
    });

    test('no client may create a reservation', async () => {
        await assertFails(
            setDoc(doc(customerDb(), 'booking_references/IY-BKG-2026-FORGED'), { bookingId: 'x' }),
        );
        await assertFails(
            setDoc(doc(publicDb(), 'booking_references/IY-BKG-2026-FORGED'), { bookingId: 'x' }),
        );
    });

    test('no client may overwrite or delete a reservation — not even an admin', async () => {
        await assertFails(updateDoc(doc(customerDb(), `booking_references/${REF}`), { bookingId: 'hijack' }));
        await assertFails(updateDoc(doc(adminDb(), `booking_references/${REF}`), { bookingId: 'hijack' }));
        await assertFails(deleteDoc(doc(adminDb(), `booking_references/${REF}`)));
    });

    test('an admin may read a reservation for support purposes', async () => {
        await assertSucceeds(getDoc(doc(adminDb(), `booking_references/${REF}`)));
    });
});

// ---------------------------------------------------------------------------
// booking_idempotency — fully server-owned, invisible to every client
// ---------------------------------------------------------------------------

describe('booking_idempotency', () => {
    const ID = 'a'.repeat(64);

    beforeEach(async () => {
        await seed(`booking_idempotency/${ID}`, { bookingId: 'bk-1', userId: 'customer-a' });
    });

    test('no client may read an idempotency record — including an admin', async () => {
        await assertFails(getDoc(doc(publicDb(), `booking_idempotency/${ID}`)));
        await assertFails(getDoc(doc(customerDb('customer-a'), `booking_idempotency/${ID}`)));
        await assertFails(getDoc(doc(adminDb(), `booking_idempotency/${ID}`)));
    });

    test('no client may write an idempotency record', async () => {
        await assertFails(setDoc(doc(customerDb(), `booking_idempotency/${'b'.repeat(64)}`), { bookingId: 'x' }));
        await assertFails(setDoc(doc(adminDb(), `booking_idempotency/${'b'.repeat(64)}`), { bookingId: 'x' }));
    });

    test('a client cannot pre-seed a record to hijack a future replay', async () => {
        // If this were writable, an attacker could point an idempotency key at
        // someone else's booking and have the API hand it back to them.
        await assertFails(updateDoc(doc(customerDb(), `booking_idempotency/${ID}`), { bookingId: 'victim-booking' }));
    });
});

// ---------------------------------------------------------------------------
// bookings/{id}/activity — audit trail
// ---------------------------------------------------------------------------

describe('booking activity subcollection', () => {
    beforeEach(async () => {
        await seed('bookings/bk-1', { userId: 'customer-a', packageId: 'p1' });
        await seed('bookings/bk-1/activity/act-1', {
            type: 'BOOKING_SUBMITTED',
            actorId: 'customer-a',
        });
    });

    test('the booking owner cannot read the audit trail directly', async () => {
        // Customers see booking state through the API projection, not the raw
        // audit trail — which will later carry staff actor ids and internal notes.
        await assertFails(getDoc(doc(customerDb('customer-a'), 'bookings/bk-1/activity/act-1')));
    });

    test('another customer cannot read the audit trail', async () => {
        await assertFails(getDoc(doc(customerDb('customer-b'), 'bookings/bk-1/activity/act-1')));
    });

    test('an anonymous client cannot read the audit trail', async () => {
        await assertFails(getDoc(doc(publicDb(), 'bookings/bk-1/activity/act-1')));
    });

    test('an admin may read the audit trail', async () => {
        await assertSucceeds(getDoc(doc(adminDb(), 'bookings/bk-1/activity/act-1')));
    });

    test('no client may append to or tamper with the audit trail', async () => {
        await assertFails(
            setDoc(doc(customerDb('customer-a'), 'bookings/bk-1/activity/forged'), { type: 'PAYMENT_RECEIVED' }),
        );
        await assertFails(
            setDoc(doc(adminDb(), 'bookings/bk-1/activity/forged'), { type: 'PAYMENT_RECEIVED' }),
        );
        await assertFails(updateDoc(doc(adminDb(), 'bookings/bk-1/activity/act-1'), { actorId: 'someone-else' }));
        await assertFails(deleteDoc(doc(adminDb(), 'bookings/bk-1/activity/act-1')));
    });
});

// ---------------------------------------------------------------------------
// bookings — ownership still holds for PB-1 (schemaVersion 2) documents
// ---------------------------------------------------------------------------

describe('bookings ownership for PB-1 records', () => {
    beforeEach(async () => {
        await seed('bookings/bk-alice', {
            userId: 'customer-a',
            schemaVersion: 2,
            bookingReference: 'IY-BKG-2026-7K4MQP',
            packageId: 'himalaya-trek',
            bookingStatus: 'SUBMITTED',
            paymentStatus: 'UNPAID',
            amountReceivedMinor: 0,
            balanceAmountMinor: 3200000,
            pricing: { grossAmountMinor: 3200000, currency: 'INR' },
        });
    });

    test('the owner may read their own PB-1 booking', async () => {
        await assertSucceeds(getDoc(doc(customerDb('customer-a'), 'bookings/bk-alice')));
    });

    test('another customer may not read it', async () => {
        await assertFails(getDoc(doc(customerDb('customer-b'), 'bookings/bk-alice')));
    });

    test('an anonymous client may not read it', async () => {
        await assertFails(getDoc(doc(publicDb(), 'bookings/bk-alice')));
    });

    test('the owner cannot mark their own booking paid', async () => {
        await assertFails(
            updateDoc(doc(customerDb('customer-a'), 'bookings/bk-alice'), { paymentStatus: 'FULLY_PAID' }),
        );
    });

    test('the owner cannot alter the authoritative total or balance', async () => {
        await assertFails(
            updateDoc(doc(customerDb('customer-a'), 'bookings/bk-alice'), { balanceAmountMinor: 0 }),
        );
        await assertFails(
            updateDoc(doc(customerDb('customer-a'), 'bookings/bk-alice'), {
                pricing: { grossAmountMinor: 1, currency: 'INR' },
            }),
        );
    });

    test('the owner cannot confirm their own booking', async () => {
        await assertFails(
            updateDoc(doc(customerDb('customer-a'), 'bookings/bk-alice'), { bookingStatus: 'CONFIRMED' }),
        );
    });

    test('a customer cannot delete a booking', async () => {
        await assertFails(deleteDoc(doc(customerDb('customer-a'), 'bookings/bk-alice')));
    });

    test('a client cannot create a PB-1 shaped booking directly, bypassing the API', async () => {
        // The legacy create contract is still open for PB-2's sake, but it pins
        // the three lowercase status fields and a closed key set — so a v2-shaped
        // document with server-owned fields cannot be written from a browser.
        await assertFails(
            setDoc(doc(customerDb('customer-a'), 'bookings/forged'), {
                userId: 'customer-a',
                packageId: 'himalaya-trek',
                status: 'pending',
                bookingStatus: 'pending',
                paymentStatus: 'pending',
                createdAt: new Date(),
                bookingReference: 'IY-BKG-2026-FORGED',
                pricing: { grossAmountMinor: 1 },
            }),
        );
    });
});
