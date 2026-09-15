/**
 * SA-1B — Firestore authorization after the removal of email-based grants.
 *
 * `enquiries`, `newsletter_subscribers` and `travelStories` moderation were
 * gated on request.auth.token.email == '<one hardcoded address>'. They are now
 * gated on the admin custom claim, like every other staff-owned collection.
 *
 * These run against the real Firestore emulator with the real rules file,
 * through the client SDK — the surface a browser actually has.
 *
 * Run: npm run test:sa1b-rules
 */

import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const PROJECT_ID = 'demo-infinite-yatra-sa1b';
const FIRESTORE_RULES = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');

/** The address that used to be a security boundary. It must now be inert. */
const FORMER_ADMIN_EMAIL = 'chauhanparth165@gmail.com';

const STAFF_UID = 'uid-staff';
const CUSTOMER_UID = 'uid-customer';
const AUTHOR_UID = 'uid-author';
/** A profile that does NOT already claim admin, so a promotion is a real diff. */
const PLAIN_UID = 'uid-plain';

/** Collections that were email-gated, plus the sibling that always was admin-only. */
const ADMIN_ONLY = ['enquiries', 'newsletter_subscribers', 'leads'];
const LEGACY_ROLES = ['operations', 'finance', 'guide', 'ops'];

let testEnv;

const dbAs = (uid, claims = {}) =>
    uid ? testEnv.authenticatedContext(uid, claims).firestore() : testEnv.unauthenticatedContext().firestore();

before(async () => {
    testEnv = await initializeTestEnvironment({
        projectId: PROJECT_ID,
        firestore: { rules: FIRESTORE_RULES },
    });
});
after(async () => { await testEnv?.cleanup(); });

beforeEach(async () => {
    await testEnv.clearFirestore();
    // Seed through the admin path so the fixtures themselves are not a rules test.
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
        const db = ctx.firestore();
        for (const c of ADMIN_ONLY) {
            await setDoc(doc(db, c, 'doc-1'), { name: 'Seed', email: 'someone@example.com' });
        }
        await setDoc(doc(db, 'travelStories', 'story-1'), { authorId: AUTHOR_UID, title: 'Seed' });
        // A Firestore profile claiming admin. This must never be an authority.
        await setDoc(doc(db, 'users', CUSTOMER_UID), { email: 'c@example.com', role: 'admin', isAdmin: true });
        await setDoc(doc(db, 'users', STAFF_UID), { email: FORMER_ADMIN_EMAIL, role: 'admin' });
        await setDoc(doc(db, 'users', PLAIN_UID), { email: 'p@example.com', role: 'customer' });
    });
});

// ---------------------------------------------------------------------------
// 1 + 6 — the email is no longer a boundary
// ---------------------------------------------------------------------------

describe('email alone grants nothing', () => {
    test('the formerly hardcoded admin address, with no claim, is denied everywhere', async () => {
        const db = dbAs(STAFF_UID, { email: FORMER_ADMIN_EMAIL, email_verified: true });
        for (const c of ADMIN_ONLY) {
            await assertFails(getDoc(doc(db, c, 'doc-1')));
            await assertFails(updateDoc(doc(db, c, 'doc-1'), { name: 'edited' }));
            await assertFails(deleteDoc(doc(db, c, 'doc-1')));
        }
    });

    test('that address cannot moderate a story it does not own', async () => {
        const db = dbAs(STAFF_UID, { email: FORMER_ADMIN_EMAIL, email_verified: true });
        await assertFails(updateDoc(doc(db, 'travelStories', 'story-1'), { title: 'moderated' }));
        await assertFails(deleteDoc(doc(db, 'travelStories', 'story-1')));
    });

    test('no rule anywhere still compares a literal email address', () => {
        const grants = FIRESTORE_RULES
            .split('\n')
            .filter((l) => !l.trim().startsWith('//'))
            .filter((l) => /token\.email\s*==\s*'/.test(l));
        assert.deepEqual(grants, [], 'a hardcoded email grant survived in firestore.rules');
    });
});

// ---------------------------------------------------------------------------
// 5 — the Firestore profile is not an authority
// ---------------------------------------------------------------------------

describe('users.role alone grants nothing', () => {
    test('a profile document saying role=admin does not grant admin access', async () => {
        const db = dbAs(CUSTOMER_UID, { email: 'c@example.com' });
        for (const c of ADMIN_ONLY) {
            await assertFails(getDoc(doc(db, c, 'doc-1')));
        }
    });

    test('a customer cannot promote their own profile to admin', async () => {
        // Must be a real change: writing back an identical value affects no
        // keys, so the allowlist would pass a no-op and prove nothing.
        const db = dbAs(PLAIN_UID, { email: 'p@example.com' });
        await assertFails(updateDoc(doc(db, 'users', PLAIN_UID), { role: 'admin' }));
        await assertFails(updateDoc(doc(db, 'users', PLAIN_UID), { isAdmin: true }));
        // The permitted profile fields still work, so this is not a blanket deny.
        await assertSucceeds(updateDoc(doc(db, 'users', PLAIN_UID), { name: 'Updated' }));
    });
});

// ---------------------------------------------------------------------------
// 4 — customers
// ---------------------------------------------------------------------------

describe('customers are denied', () => {
    test('a signed-in customer with no claim is denied', async () => {
        const db = dbAs(CUSTOMER_UID, { email: 'c@example.com' });
        for (const c of ADMIN_ONLY) {
            await assertFails(getDoc(doc(db, c, 'doc-1')));
            await assertFails(deleteDoc(doc(db, c, 'doc-1')));
        }
    });

    test('an unauthenticated visitor is denied reads but may still submit a lead', async () => {
        const db = dbAs(null);
        await assertFails(getDoc(doc(db, 'enquiries', 'doc-1')));
        await assertFails(getDoc(doc(db, 'newsletter_subscribers', 'doc-1')));
        // The public capture path must keep working — this is the point of the collection.
        await assertSucceeds(setDoc(doc(db, 'newsletter_subscribers', 'new-sub'), {
            email: 'visitor@example.com',
        }));
    });
});

// ---------------------------------------------------------------------------
// 7 — legacy claim values
// ---------------------------------------------------------------------------

describe('unsupported legacy roles grant nothing', () => {
    for (const role of LEGACY_ROLES) {
        test(`the legacy claim "${role}" is denied on admin-only collections`, async () => {
            const db = dbAs(STAFF_UID, { email: FORMER_ADMIN_EMAIL, role });
            for (const c of ADMIN_ONLY) {
                await assertFails(getDoc(doc(db, c, 'doc-1')));
                await assertFails(deleteDoc(doc(db, c, 'doc-1')));
            }
            await assertFails(updateDoc(doc(db, 'travelStories', 'story-1'), { title: 'x' }));
        });
    }
});

// ---------------------------------------------------------------------------
// 3 — scoped staff roles stay scoped
// ---------------------------------------------------------------------------

describe('booking_manager cannot reach unrelated admin-only collections', () => {
    test('a booking_manager claim is denied on CRM and subscriber data', async () => {
        const db = dbAs(STAFF_UID, { role: 'booking_manager' });
        for (const c of ADMIN_ONLY) {
            await assertFails(getDoc(doc(db, c, 'doc-1')));
            await assertFails(updateDoc(doc(db, c, 'doc-1'), { name: 'edited' }));
            await assertFails(deleteDoc(doc(db, c, 'doc-1')));
        }
    });

    test('a booking_manager claim cannot moderate stories', async () => {
        const db = dbAs(STAFF_UID, { role: 'booking_manager' });
        await assertFails(updateDoc(doc(db, 'travelStories', 'story-1'), { title: 'moderated' }));
        await assertFails(deleteDoc(doc(db, 'travelStories', 'story-1')));
    });

    test('other scoped roles are equally excluded', async () => {
        for (const role of ['hotel_manager', 'finance_manager', 'tour_manager', 'content_manager']) {
            const db = dbAs(STAFF_UID, { role });
            await assertFails(getDoc(doc(db, 'enquiries', 'doc-1')));
        }
    });
});

// ---------------------------------------------------------------------------
// 2 — the admin claim is what works
// ---------------------------------------------------------------------------

describe('the admin claim grants the intended access', () => {
    test('role=admin can read, update and delete the formerly email-gated data', async () => {
        const db = dbAs(STAFF_UID, { role: 'admin' });
        for (const c of ADMIN_ONLY) {
            await assertSucceeds(getDoc(doc(db, c, 'doc-1')));
            await assertSucceeds(updateDoc(doc(db, c, 'doc-1'), { name: 'edited' }));
            await assertSucceeds(deleteDoc(doc(db, c, 'doc-1')));
        }
    });

    test('role=admin can moderate any story', async () => {
        const db = dbAs(STAFF_UID, { role: 'admin' });
        await assertSucceeds(updateDoc(doc(db, 'travelStories', 'story-1'), { title: 'moderated' }));
        await assertSucceeds(deleteDoc(doc(db, 'travelStories', 'story-1')));
    });

    test('the legacy admin:true claim flag still works, matching isAdmin()', async () => {
        const db = dbAs(STAFF_UID, { admin: true });
        await assertSucceeds(getDoc(doc(db, 'enquiries', 'doc-1')));
    });

    test('an admin needs no particular email address', async () => {
        const db = dbAs('uid-new-admin', { role: 'admin', email: 'someone.else@example.com' });
        await assertSucceeds(getDoc(doc(db, 'enquiries', 'doc-1')));
    });
});

// ---------------------------------------------------------------------------
// Authors keep their own story
// ---------------------------------------------------------------------------

describe('story authors are unaffected', () => {
    test('an author may still edit and delete their own story', async () => {
        const db = dbAs(AUTHOR_UID, { email: 'author@example.com' });
        await assertSucceeds(updateDoc(doc(db, 'travelStories', 'story-1'), { title: 'mine' }));
        await assertSucceeds(deleteDoc(doc(db, 'travelStories', 'story-1')));
    });

    test('a different customer still cannot touch it', async () => {
        const db = dbAs(CUSTOMER_UID, { email: 'c@example.com' });
        await assertFails(updateDoc(doc(db, 'travelStories', 'story-1'), { title: 'not mine' }));
    });
});
