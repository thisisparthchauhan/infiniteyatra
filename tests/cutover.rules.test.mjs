/**
 * CUTOVER — Firestore rules, transitional and final.
 *
 * Runs BOTH rulesets against the emulator in one process:
 *   firestore.rules          — deployed today, still permits the legacy client create
 *   firestore.rules.cutover  — the final ruleset, client create denied
 *
 * The pairing is the point. Owner reads of the 15 historical bookings must
 * survive the change, and the create path must be the only thing that differs.
 *
 * Run: npm run test:cutover-rules
 */

import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

import { LEGACY_FIXTURES, canonicalBooking } from './fixtures/legacyBookings.mjs';

const LIVE_RULES = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
const CUTOVER_RULES = readFileSync(new URL('../firestore.rules.cutover', import.meta.url), 'utf8');

const OWNER = 'uid-legacy-owner';
const OTHER = 'uid-other-customer';

/** Firestore rejects a JS Date inside the emulator seed only if malformed; these are fine. */
const envs = {};

before(async () => {
    envs.live = await initializeTestEnvironment({
        projectId: 'demo-iy-cutover-live', firestore: { rules: LIVE_RULES },
    });
    envs.cutover = await initializeTestEnvironment({
        projectId: 'demo-iy-cutover-final', firestore: { rules: CUTOVER_RULES },
    });
});
after(async () => { await Promise.all(Object.values(envs).map((e) => e?.cleanup())); });

const dbAs = (env, uid, claims = {}) =>
    uid ? env.authenticatedContext(uid, claims).firestore() : env.unauthenticatedContext().firestore();

async function seed(env) {
    await env.clearFirestore();
    await env.withSecurityRulesDisabled(async (ctx) => {
        const db = ctx.firestore();
        for (const [name, data] of Object.entries(LEGACY_FIXTURES)) {
            await setDoc(doc(db, 'bookings', `legacy-${name}`), data);
        }
        await setDoc(doc(db, 'bookings', 'canonical-1'), canonicalBooking);
        await setDoc(doc(db, 'packages', 'pkg-kashmir-7d'), { title: 'Kashmir', price: 24000 });
    });
}

beforeEach(async () => { await Promise.all([seed(envs.live), seed(envs.cutover)]); });

for (const variant of ['live', 'cutover']) {
    describe(`[1][2][3] ownership — ${variant} ruleset`, () => {
        test('[1] the legacy owner can read every one of their historical bookings', async () => {
            const db = dbAs(envs[variant], OWNER, { email: 'owner@example.invalid' });
            for (const name of Object.keys(LEGACY_FIXTURES)) {
                await assertSucceeds(getDoc(doc(db, 'bookings', `legacy-${name}`)));
            }
        });

        test('[2] a different signed-in customer cannot read them', async () => {
            const db = dbAs(envs[variant], OTHER, { email: 'other@example.invalid' });
            for (const name of Object.keys(LEGACY_FIXTURES)) {
                await assertFails(getDoc(doc(db, 'bookings', `legacy-${name}`)));
            }
        });

        test('[3] an unauthenticated visitor is denied', async () => {
            const db = dbAs(envs[variant], null);
            await assertFails(getDoc(doc(db, 'bookings', 'legacy-A')));
            await assertFails(getDoc(doc(db, 'bookings', 'canonical-1')));
        });

        test('ownership is the uid, never the recorded contact email', async () => {
            // Fixture A records contactEmail a@example.invalid. Someone signed in
            // WITH that address but a different uid must still be refused.
            const db = dbAs(envs[variant], OTHER, { email: 'a@example.invalid', email_verified: true });
            await assertFails(getDoc(doc(db, 'bookings', 'legacy-A')));
        });

        test('a customer cannot edit or delete a historical booking', async () => {
            const db = dbAs(envs[variant], OWNER, { email: 'owner@example.invalid' });
            await assertFails(updateDoc(doc(db, 'bookings', 'legacy-A'), { totalPrice: 1 }));
            await assertFails(deleteDoc(doc(db, 'bookings', 'legacy-A')));
        });

        test('an admin claim can read them; no email grant is involved', async () => {
            const db = dbAs(envs[variant], 'uid-admin', { role: 'admin' });
            await assertSucceeds(getDoc(doc(db, 'bookings', 'legacy-A')));
        });

        test('the catalogue is readable but not writable by a customer', async () => {
            const db = dbAs(envs[variant], OTHER, { email: 'other@example.invalid' });
            await assertSucceeds(getDoc(doc(db, 'packages', 'pkg-kashmir-7d')));
            await assertFails(updateDoc(doc(db, 'packages', 'pkg-kashmir-7d'), { price: 1 }));
            await assertFails(setDoc(doc(db, 'packages', 'pkg-new'), { title: 'Injected' }));
        });
    });
}

describe('the create path is the only difference between the two rulesets', () => {
    const legacyCreate = {
        userId: OWNER, packageId: 'pkg-kashmir-7d', status: 'pending',
        bookingStatus: 'pending', paymentStatus: 'pending', createdAt: new Date(),
    };

    test('transitional: the live client create still works, so the site keeps taking bookings', async () => {
        const db = dbAs(envs.live, OWNER, { email: 'owner@example.invalid' });
        await assertSucceeds(setDoc(doc(db, 'bookings', 'new-legacy-1'), legacyCreate));
    });

    test('final: the browser can no longer create a booking at all', async () => {
        const db = dbAs(envs.cutover, OWNER, { email: 'owner@example.invalid' });
        await assertFails(setDoc(doc(db, 'bookings', 'new-legacy-2'), legacyCreate));
    });

    test('final: a client cannot forge a canonical booking by supplying schemaVersion', async () => {
        const db = dbAs(envs.cutover, OWNER, { email: 'owner@example.invalid' });
        await assertFails(setDoc(doc(db, 'bookings', 'forged'), { ...legacyCreate, schemaVersion: 1 }));
    });

    test('transitional: schemaVersion is not client-writable either', async () => {
        // The legacy allowlist never contained it, so even today a client cannot
        // mint a document that would classify as canonical.
        const db = dbAs(envs.live, OWNER, { email: 'owner@example.invalid' });
        await assertFails(setDoc(doc(db, 'bookings', 'forged-live'), { ...legacyCreate, schemaVersion: 1 }));
    });

    test('the server path is unaffected: the Admin SDK bypasses rules entirely', async () => {
        // This is how canonical bookings are actually written after cutover.
        await envs.cutover.withSecurityRulesDisabled(async (ctx) => {
            await setDoc(doc(ctx.firestore(), 'bookings', 'server-written'), canonicalBooking);
        });
        const db = dbAs(envs.cutover, 'uid-canonical-owner', {});
        await assertSucceeds(getDoc(doc(db, 'bookings', 'server-written')));
    });
});
