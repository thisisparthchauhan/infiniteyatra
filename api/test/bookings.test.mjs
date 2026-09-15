import './env.mjs';
import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
    startServer, makeClient, resetDatabase, seedCatalogue, bookingBody, query, closePool,
} from './helpers.mjs';
import { isValidReference } from '../src/lib/ids.js';

let srv;
let cat;
before(async () => { srv = await startServer(); });
after(async () => { await srv.close(); await closePool(); });
beforeEach(async () => { await resetDatabase(); cat = await seedCatalogue(); });

async function signedInCustomer(email = 'cust@example.invalid') {
    const c = makeClient(srv.base);
    const res = await c.req('/api/auth/register', {
        method: 'POST', body: { email, password: 'a-long-enough-passphrase', fullName: 'Cust' },
    });
    assert.equal(res.status, 201, 'registration should succeed');
    return c;
}

describe('PB-1 booking creation', () => {
    test('a booking is created server-side with server-derived pricing', async () => {
        const c = await signedInCustomer();
        const res = await c.req('/api/bookings', { method: 'POST', body: bookingBody({ packageId: cat.packageId }) });
        assert.equal(res.status, 201, JSON.stringify(res.body));
        const b = res.body.booking;

        assert.ok(isValidReference(b.reference), `bad reference: ${b.reference}`);
        assert.equal(b.pricing.currency, 'INR');
        assert.equal(b.pricing.minorUnitsPerMajor, 100);
        // base 15,00,000 minor x 2 travellers, computed from the catalogue row.
        assert.equal(b.pricing.grossAmountMinor, 3000000);
        assert.equal(b.bookingStatus, 'pending');
        assert.equal(b.payment.paymentStatus, 'unpaid');
        assert.equal(b.payment.amountReceivedMinor, 0);
        assert.equal(b.payment.balanceAmountMinor, 3000000);
    });

    test('a pickup option prices the booking, not the base price', async () => {
        const c = await signedInCustomer();
        const res = await c.req('/api/bookings', {
            method: 'POST',
            body: bookingBody({ packageId: cat.packageId, pickupOptionId: cat.pickupOptionId }),
        });
        assert.equal(res.status, 201);
        assert.equal(res.body.booking.pricing.grossAmountMinor, 1600000 * 2);
    });

    test('a client-supplied price is rejected outright', async () => {
        const c = await signedInCustomer();
        for (const poison of [
            { grossAmountMinor: 1 }, { price: 1 }, { totalPrice: 1 },
            { unitPriceMinor: 1 }, { amountReceivedMinor: 999999 },
        ]) {
            const res = await c.req('/api/bookings', {
                method: 'POST', body: { ...bookingBody({ packageId: cat.packageId }), ...poison },
            });
            assert.equal(res.status, 400, `${Object.keys(poison)[0]} must be refused`);
            assert.ok(res.body.details.some((d) => d.includes(Object.keys(poison)[0])));
        }
    });

    test('a client cannot set ownership, status or the booking reference', async () => {
        const c = await signedInCustomer();
        for (const poison of [{ userId: 9999 }, { bookingStatus: 'confirmed' }, { reference: 'IY-BKG-2026-AAAAAA' }]) {
            const res = await c.req('/api/bookings', {
                method: 'POST', body: { ...bookingBody({ packageId: cat.packageId }), ...poison },
            });
            assert.equal(res.status, 400, `${Object.keys(poison)[0]} must be refused`);
        }
    });

    test('travellers get stable ids, never a row index', async () => {
        const c = await signedInCustomer();
        const res = await c.req('/api/bookings', { method: 'POST', body: bookingBody({ packageId: cat.packageId }) });
        const ids = res.body.booking.travellers.map((t) => t.travellerId);
        assert.equal(ids.length, 2);
        assert.equal(new Set(ids).size, 2);
        for (const id of ids) assert.match(id, /^tr_[0-9a-f]{12}$/);
        // Position exists in the database for ordering, but is never the identity.
        const rows = await query('SELECT public_id, position FROM booking_travellers ORDER BY position');
        assert.deepEqual(rows.map((r) => r.position), [0, 1]);
        assert.notEqual(rows[0].public_id, '0');
    });

    test('a retry with the same idempotency key returns the same booking', async () => {
        const c = await signedInCustomer();
        const body = bookingBody({ packageId: cat.packageId });
        const first = await c.req('/api/bookings', { method: 'POST', body });
        const second = await c.req('/api/bookings', { method: 'POST', body });

        assert.equal(first.status, 201);
        assert.equal(second.status, 200, 'a retry is not a new creation');
        assert.equal(second.body.reused, true);
        assert.equal(first.body.booking.id, second.body.booking.id);
        assert.equal(first.body.booking.reference, second.body.booking.reference);
        assert.equal((await query('SELECT COUNT(*) c FROM bookings'))[0].c, 1);
    });

    test('concurrent identical submits create exactly one booking', async () => {
        const c = await signedInCustomer();
        const body = bookingBody({ packageId: cat.packageId });
        const results = await Promise.all([
            c.req('/api/bookings', { method: 'POST', body }),
            c.req('/api/bookings', { method: 'POST', body }),
            c.req('/api/bookings', { method: 'POST', body }),
        ]);
        for (const r of results) assert.ok([200, 201].includes(r.status), `unexpected ${r.status}`);
        const ids = new Set(results.map((r) => r.body.booking.id));
        assert.equal(ids.size, 1, 'all three must resolve to one booking');
        assert.equal((await query('SELECT COUNT(*) c FROM bookings'))[0].c, 1);
    });

    test('every booking reference is unique across many bookings', async () => {
        const c = await signedInCustomer();
        const refs = new Set();
        for (let i = 0; i < 12; i += 1) {
            const res = await c.req('/api/bookings', { method: 'POST', body: bookingBody({ packageId: cat.packageId }) });
            assert.equal(res.status, 201);
            refs.add(res.body.booking.reference);
        }
        assert.equal(refs.size, 12);
        assert.equal((await query('SELECT COUNT(DISTINCT reference) c FROM bookings'))[0].c, 12);
    });

    test('a failed booking leaves nothing behind — the transaction rolls back', async () => {
        const c = await signedInCustomer();
        // A pickup option belonging to no package: valid shape, invalid reference.
        const orphan = await query(
            `INSERT INTO packages (slug, title, base_price_minor) VALUES ('other-pkg','Other',900000)`,
        );
        const otherPickup = await query(
            `INSERT INTO package_pickup_options (package_id, label, price_minor) VALUES (?, 'Elsewhere', 111111)`,
            [orphan.insertId],
        );

        const before = (await query('SELECT COUNT(*) c FROM booking_references'))[0].c;
        const res = await c.req('/api/bookings', {
            method: 'POST',
            body: bookingBody({ packageId: cat.packageId, pickupOptionId: otherPickup.insertId }),
        });
        assert.equal(res.status, 400);

        // No booking, no contact, no travellers, and no reference consumed.
        assert.equal((await query('SELECT COUNT(*) c FROM bookings'))[0].c, 0);
        assert.equal((await query('SELECT COUNT(*) c FROM booking_contacts'))[0].c, 0);
        assert.equal((await query('SELECT COUNT(*) c FROM booking_travellers'))[0].c, 0);
        assert.equal((await query('SELECT COUNT(*) c FROM booking_references'))[0].c, before,
            'a rolled-back booking must not burn a reference');
    });

    test('the database refuses a booking whose arithmetic does not add up', async () => {
        // Defence in depth: even a direct write cannot store inconsistent money.
        await assert.rejects(
            query(
                `INSERT INTO bookings (public_id, reference, user_id, package_id, package_snapshot_json,
                    departure_date, traveller_count, unit_price_minor, tour_amount_minor,
                    hotel_amount_minor, hotel_discount_minor, gross_amount_minor, idempotency_key)
                 VALUES ('X','IY-BKG-2026-ZZZZZZ',1,?, '{}', '2026-01-01', 1, 100, 100, 0, 0, 999999, 'k')`,
                [cat.packageId],
            ),
            /CONSTRAINT|CHECK|foreign key/i,
        );
    });

    test('an unpriced package cannot be booked', async () => {
        const c = await signedInCustomer();
        const free = await query(
            `INSERT INTO packages (slug, title, base_price_minor, is_visible) VALUES ('free-pkg','Free',0,1)`,
        );
        const res = await c.req('/api/bookings', { method: 'POST', body: bookingBody({ packageId: free.insertId }) });
        assert.ok(res.status >= 400, 'a zero-priced package must not produce a booking');
        assert.equal((await query('SELECT COUNT(*) c FROM bookings'))[0].c, 0);
    });

    test('the group-size rules are enforced server-side', async () => {
        const c = await signedInCustomer();
        const tooMany = bookingBody({ packageId: cat.packageId });
        tooMany.travellerCount = 20;
        tooMany.travellers = Array.from({ length: 20 }, (_, i) => ({ firstName: `P${i}`, lastName: 'X' }));
        const res = await c.req('/api/bookings', { method: 'POST', body: tooMany });
        assert.equal(res.status, 400);
    });

    test('an activity row records the creation', async () => {
        const c = await signedInCustomer();
        await c.req('/api/bookings', { method: 'POST', body: bookingBody({ packageId: cat.packageId }) });
        const rows = await query("SELECT event, actor_type FROM booking_activity WHERE event = 'booking.created'");
        assert.equal(rows.length, 1);
        assert.equal(rows[0].actor_type, 'customer');
    });
});

describe('PB-2 booking access', () => {
    test('a customer reads their own booking', async () => {
        const c = await signedInCustomer();
        const created = await c.req('/api/bookings', { method: 'POST', body: bookingBody({ packageId: cat.packageId }) });
        const id = created.body.booking.id;
        const res = await c.req(`/api/bookings/${id}`);
        assert.equal(res.status, 200);
        assert.equal(res.body.booking.id, id);
    });

    test("another customer cannot read it, and cannot tell it exists", async () => {
        const owner = await signedInCustomer('owner@example.invalid');
        const created = await owner.req('/api/bookings', { method: 'POST', body: bookingBody({ packageId: cat.packageId }) });
        const id = created.body.booking.id;

        const other = await signedInCustomer('other@example.invalid');
        const mine = await other.req(`/api/bookings/${id}`);
        const nonexistent = await other.req('/api/bookings/01ZZZZZZZZZZZZZZZZZZZZZZZZ');
        assert.equal(mine.status, 404);
        assert.deepEqual(mine.body, nonexistent.body, 'not-yours must be indistinguishable from absent');
    });

    test('an unauthenticated read is refused', async () => {
        const owner = await signedInCustomer();
        const created = await owner.req('/api/bookings', { method: 'POST', body: bookingBody({ packageId: cat.packageId }) });
        const anon = makeClient(srv.base);
        assert.equal((await anon.req(`/api/bookings/${created.body.booking.id}`)).status, 401);
    });

    test('the booking list is scoped to the signed-in customer', async () => {
        const a = await signedInCustomer('a@example.invalid');
        await a.req('/api/bookings', { method: 'POST', body: bookingBody({ packageId: cat.packageId }) });
        const b = await signedInCustomer('b@example.invalid');
        await b.req('/api/bookings', { method: 'POST', body: bookingBody({ packageId: cat.packageId }) });

        assert.equal((await a.req('/api/bookings')).body.bookings.length, 1);
        assert.equal((await b.req('/api/bookings')).body.bookings.length, 1);
        assert.equal((await query('SELECT COUNT(*) c FROM bookings'))[0].c, 2);
    });

    test('the customer projection exposes no internal identifiers', async () => {
        const c = await signedInCustomer();
        const res = await c.req('/api/bookings', { method: 'POST', body: bookingBody({ packageId: cat.packageId }) });
        const flat = JSON.stringify(res.body.booking);
        for (const leak of ['user_id', 'password', 'idempotency_key', 'public_id"', 'package_snapshot_json']) {
            assert.ok(!flat.includes(leak), `projection leaked ${leak}`);
        }
        // The exposed id is the public id, not the primary key.
        assert.notEqual(res.body.booking.id, '1');
    });

    test('a booking id cannot be enumerated by guessing small numbers', async () => {
        const c = await signedInCustomer();
        await c.req('/api/bookings', { method: 'POST', body: bookingBody({ packageId: cat.packageId }) });
        for (const guess of ['1', '2', '10']) {
            assert.equal((await c.req(`/api/bookings/${guess}`)).status, 404);
        }
    });
});
