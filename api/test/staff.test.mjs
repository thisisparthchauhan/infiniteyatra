import './env.mjs';
import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, makeClient, resetDatabase, seedCatalogue, bookingBody, query, closePool } from './helpers.mjs';
import { hashPassword, normaliseEmail } from '../src/services/auth.js';
import { publicId } from '../src/lib/ids.js';
import { ALL_STAFF_ROLES, LEGACY_ROLE_VALUES } from '../src/lib/roles.js';

let srv; let cat;
before(async () => { srv = await startServer(); });
after(async () => { await srv.close(); await closePool(); });
beforeEach(async () => { await resetDatabase(); cat = await seedCatalogue(); });

const PW = 'a-long-enough-staff-passphrase';

async function makeStaff(role, email = `${role}@example.invalid`) {
    await query(
        `INSERT INTO staff_users (public_id, email, email_normalised, password_hash, full_name, role)
         VALUES (?,?,?,?,?,?)`,
        [publicId(), email, normaliseEmail(email), await hashPassword(PW), role, role],
    );
    const c = makeClient(srv.base);
    const res = await c.req('/api/staff/auth/login', { method: 'POST', body: { email, password: PW } });
    assert.equal(res.status, 200, `staff login failed for ${role}: ${JSON.stringify(res.body)}`);
    return c;
}

async function signedInCustomer(email = 'cust@example.invalid') {
    const c = makeClient(srv.base);
    await c.req('/api/auth/register', { method: 'POST', body: { email, password: 'a-long-enough-passphrase' } });
    return c;
}

describe('staff authentication and RBAC', () => {
    test('the role vocabulary is the canonical six, and the column refuses anything else', async () => {
        assert.deepEqual([...ALL_STAFF_ROLES].sort(), [
            'admin', 'booking_manager', 'content_manager', 'finance_manager', 'hotel_manager', 'tour_manager',
        ]);
        for (const legacy of LEGACY_ROLE_VALUES) {
            await assert.rejects(
                query(
                    `INSERT INTO staff_users (public_id, email, email_normalised, password_hash, role)
                     VALUES (?,?,?,?,?)`,
                    [publicId(), `x${legacy}@e.invalid`, `x${legacy}@e.invalid`, 'h', legacy],
                ),
                /Data truncated|Incorrect|invalid/i,
                `the database must refuse the legacy role "${legacy}"`,
            );
        }
    });

    test('a customer session is not a staff session', async () => {
        const cust = await signedInCustomer();
        // Holding a valid customer cookie grants nothing on the staff surface.
        assert.equal((await cust.req('/api/staff/auth/me')).status, 401);
        assert.equal((await cust.req('/api/admin/packages')).status, 401);
    });

    test('an admin reaches every staff surface', async () => {
        const admin = await makeStaff('admin');
        assert.equal((await admin.req('/api/admin/packages')).status, 200);
        assert.equal((await admin.req('/api/admin/hotels')).status, 200);
        assert.equal((await admin.req('/api/admin/bookings')).status, 200);
    });

    test('a scoped role is confined to its own area', async () => {
        const hotel = await makeStaff('hotel_manager');
        assert.equal((await hotel.req('/api/admin/hotels')).status, 200, 'own area allowed');
        assert.equal((await hotel.req('/api/admin/packages')).status, 403, 'packages are not theirs');
        assert.equal((await hotel.req('/api/admin/bookings')).status, 403, 'bookings are not theirs');
    });

    test('content_manager cannot touch bookings; booking_manager cannot touch the catalogue', async () => {
        const content = await makeStaff('content_manager');
        assert.equal((await content.req('/api/admin/bookings')).status, 403);

        const booking = await makeStaff('booking_manager');
        assert.equal((await booking.req('/api/admin/bookings')).status, 200);
        const create = await booking.req('/api/admin/packages', { method: 'POST', body: { title: 'X', basePriceMinor: 100 } });
        assert.equal(create.status, 403, 'booking staff must not edit the catalogue');
    });

    test('only an admin can delete a package, and the delete is soft', async () => {
        const tour = await makeStaff('tour_manager');
        assert.equal((await tour.req(`/api/admin/packages/${cat.packageId}`, { method: 'DELETE' })).status, 403);

        const admin = await makeStaff('admin', 'admin2@example.invalid');
        assert.equal((await admin.req(`/api/admin/packages/${cat.packageId}`, { method: 'DELETE' })).status, 204);
        const row = (await query('SELECT deleted_at FROM packages WHERE id = ?', [cat.packageId]))[0];
        assert.ok(row.deleted_at, 'the row must survive for historical bookings');
    });

    test('a suspended staff account loses access immediately', async () => {
        const admin = await makeStaff('admin');
        assert.equal((await admin.req('/api/admin/packages')).status, 200);
        await query("UPDATE staff_users SET status = 'suspended' WHERE role = 'admin'");
        assert.equal((await admin.req('/api/admin/packages')).status, 401, 'the role is re-read per request');
    });

    test('changing the role in the database changes access on the next request', async () => {
        const staff = await makeStaff('hotel_manager');
        assert.equal((await staff.req('/api/admin/packages')).status, 403);
        await query("UPDATE staff_users SET role = 'admin' WHERE role = 'hotel_manager'");
        assert.equal((await staff.req('/api/admin/packages')).status, 200,
            'authorization must come from the database, never from the session payload');
    });

    test('a customer cannot modify the catalogue', async () => {
        const cust = await signedInCustomer();
        assert.equal((await cust.req(`/api/admin/packages/${cat.packageId}`, { method: 'PATCH', body: { title: 'Hacked' } })).status, 401);
        const anon = makeClient(srv.base);
        assert.equal((await anon.req(`/api/admin/packages/${cat.packageId}`, { method: 'PATCH', body: { title: 'Hacked' } })).status, 401);
        const row = (await query('SELECT title FROM packages WHERE id = ?', [cat.packageId]))[0];
        assert.equal(row.title, 'Himalaya Trek', 'the catalogue must be untouched');
    });

    test('an authorised staff member can update a package', async () => {
        const tour = await makeStaff('tour_manager');
        const res = await tour.req(`/api/admin/packages/${cat.packageId}`, {
            method: 'PATCH', body: { title: 'Himalaya Trek 2026', basePriceMinor: 1750000 },
        });
        assert.equal(res.status, 200);
        const row = (await query('SELECT title, base_price_minor FROM packages WHERE id = ?', [cat.packageId]))[0];
        assert.equal(row.title, 'Himalaya Trek 2026');
        assert.equal(Number(row.base_price_minor), 1750000);
    });

    test('a package update cannot name an arbitrary column', async () => {
        const tour = await makeStaff('tour_manager');
        const res = await tour.req(`/api/admin/packages/${cat.packageId}`, {
            method: 'PATCH', body: { deleted_at: '2020-01-01', id: 999, slug: 'hijacked' },
        });
        assert.equal(res.status, 400, 'no updatable field was supplied');
        const row = (await query('SELECT slug, deleted_at FROM packages WHERE id = ?', [cat.packageId]))[0];
        assert.equal(row.slug, 'himalaya-trek');
        assert.equal(row.deleted_at, null);
    });

    test('staff can read a booking they are authorised for; finance records payment', async () => {
        const cust = await signedInCustomer();
        const created = await cust.req('/api/bookings', { method: 'POST', body: bookingBody({ packageId: cat.packageId }) });
        const id = created.body.booking.id;

        const bm = await makeStaff('booking_manager');
        assert.equal((await bm.req(`/api/admin/bookings/${id}`)).status, 200);

        // Booking staff must not be able to record money.
        const bmPay = await bm.req(`/api/admin/bookings/${id}/payments`, { method: 'POST', body: { amountMinor: 100000 } });
        assert.equal(bmPay.status, 403);

        const fin = await makeStaff('finance_manager');
        const pay = await fin.req(`/api/admin/bookings/${id}/payments`, { method: 'POST', body: { amountMinor: 1000000 } });
        assert.equal(pay.status, 201);

        const after = await cust.req(`/api/bookings/${id}`);
        assert.equal(after.body.booking.payment.amountReceivedMinor, 1000000);
        assert.equal(after.body.booking.payment.paymentStatus, 'part_paid');
        assert.equal(after.body.booking.payment.balanceAmountMinor, 2000000);
    });

    test('the received amount is the sum of recorded payments, never a typed-in figure', async () => {
        const cust = await signedInCustomer();
        const created = await cust.req('/api/bookings', { method: 'POST', body: bookingBody({ packageId: cat.packageId }) });
        const id = created.body.booking.id;
        const fin = await makeStaff('finance_manager');

        await fin.req(`/api/admin/bookings/${id}/payments`, { method: 'POST', body: { amountMinor: 1200000 } });
        await fin.req(`/api/admin/bookings/${id}/payments`, { method: 'POST', body: { amountMinor: 1800000 } });

        const after = await cust.req(`/api/bookings/${id}`);
        assert.equal(after.body.booking.payment.amountReceivedMinor, 3000000);
        assert.equal(after.body.booking.payment.paymentStatus, 'paid');
        assert.equal(after.body.booking.payment.balanceAmountMinor, 0);
    });

    test('a status label alone never moves money', async () => {
        const cust = await signedInCustomer();
        const created = await cust.req('/api/bookings', { method: 'POST', body: bookingBody({ packageId: cat.packageId }) });
        const id = created.body.booking.id;

        const bm = await makeStaff('booking_manager');
        assert.equal((await bm.req(`/api/admin/bookings/${id}/status`, { method: 'PATCH', body: { bookingStatus: 'confirmed' } })).status, 200);

        const after = await cust.req(`/api/bookings/${id}`);
        assert.equal(after.body.booking.bookingStatus, 'confirmed');
        assert.equal(after.body.booking.payment.amountReceivedMinor, 0, 'confirming a booking is not a payment');
        assert.equal(after.body.booking.payment.paymentStatus, 'unpaid');
    });
});
