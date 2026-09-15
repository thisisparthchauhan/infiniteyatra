/**
 * Staff/admin API. This is what replaces the admin UI's direct Firestore access.
 *
 * Every route is behind requireStaffSession + requireRole. The role is read from
 * the database per request; nothing the browser sends influences authorization.
 */

import express from 'express';
import { query, queryOne } from '../db/pool.js';
import { asyncRoute, requireRole, requireStaffSession } from '../middleware/auth.js';
import { getBookingForStaff, toCustomerBooking } from '../services/bookings.js';
import { STAFF_ROLES } from '../lib/roles.js';

const router = express.Router();
router.use(requireStaffSession);

const CATALOGUE_ROLES = [STAFF_ROLES.TOUR_MANAGER, STAFF_ROLES.CONTENT_MANAGER];
const BOOKING_ROLES = [STAFF_ROLES.BOOKING_MANAGER, STAFF_ROLES.TOUR_MANAGER];

const slugify = (s) => String(s).toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 160);

// --- packages -------------------------------------------------------------

router.get('/packages', requireRole(CATALOGUE_ROLES), asyncRoute(async (req, res) => {
    const rows = await query('SELECT * FROM packages WHERE deleted_at IS NULL ORDER BY title');
    res.json({ packages: rows });
}));

router.post('/packages', requireRole(CATALOGUE_ROLES), asyncRoute(async (req, res) => {
    const { title, basePriceMinor } = req.body || {};
    if (!title || !Number.isInteger(Number(basePriceMinor)) || Number(basePriceMinor) <= 0) {
        return res.status(400).json({ error: 'title and a positive integer basePriceMinor are required' });
    }
    const slug = slugify(req.body.slug || title);
    const result = await query(
        `INSERT INTO packages (slug, title, location, duration, description, base_price_minor,
                               min_travellers, max_group_size, hero_image_url, is_visible)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [slug, title, req.body.location || null, req.body.duration || null, req.body.description || null,
         Number(basePriceMinor), Number(req.body.minTravellers) || 1,
         req.body.maxGroupSize ? Number(req.body.maxGroupSize) : null,
         req.body.heroImageUrl || null, req.body.isVisible === false ? 0 : 1],
    );
    return res.status(201).json({ id: result.insertId, slug });
}));

router.patch('/packages/:id', requireRole(CATALOGUE_ROLES), asyncRoute(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    // Column allowlist: the request cannot name an arbitrary column, so there is
    // no dynamic SQL path a caller can steer.
    const ALLOWED = {
        title: 'title', location: 'location', duration: 'duration', description: 'description',
        basePriceMinor: 'base_price_minor', minTravellers: 'min_travellers',
        maxGroupSize: 'max_group_size', heroImageUrl: 'hero_image_url', isVisible: 'is_visible',
    };
    const sets = [];
    const values = [];
    for (const [key, column] of Object.entries(ALLOWED)) {
        if (!(key in (req.body || {}))) continue;
        let v = req.body[key];
        if (key === 'basePriceMinor' || key === 'minTravellers' || key === 'maxGroupSize') {
            v = v == null ? null : Number(v);
            if (v != null && !Number.isInteger(v)) return res.status(400).json({ error: `${key} must be an integer` });
        }
        if (key === 'isVisible') v = v ? 1 : 0;
        sets.push(`${column} = ?`);
        values.push(v);
    }
    if (!sets.length) return res.status(400).json({ error: 'No updatable fields supplied' });

    values.push(id);
    const result = await query(`UPDATE packages SET ${sets.join(', ')} WHERE id = ? AND deleted_at IS NULL`, values);
    if (!result.affectedRows) return res.status(404).json({ error: 'Package not found' });
    return res.json({ updated: true });
}));

router.delete('/packages/:id', requireRole([STAFF_ROLES.ADMIN]), asyncRoute(async (req, res) => {
    // Soft delete: catalogue rows are referenced by historical bookings.
    const result = await query(
        'UPDATE packages SET deleted_at = CURRENT_TIMESTAMP(3) WHERE id = ? AND deleted_at IS NULL',
        [Number(req.params.id)],
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Package not found' });
    return res.status(204).end();
}));

// --- hotels ---------------------------------------------------------------

router.get('/hotels', requireRole([STAFF_ROLES.HOTEL_MANAGER, ...CATALOGUE_ROLES]), asyncRoute(async (req, res) => {
    res.json({ hotels: await query('SELECT * FROM hotels WHERE deleted_at IS NULL ORDER BY name') });
}));

router.patch('/hotels/:id', requireRole([STAFF_ROLES.HOTEL_MANAGER]), asyncRoute(async (req, res) => {
    const ALLOWED = { name: 'name', location: 'location', description: 'description',
        basePriceMinor: 'base_price_minor', starRating: 'star_rating', isVisible: 'is_visible' };
    const sets = []; const values = [];
    for (const [key, column] of Object.entries(ALLOWED)) {
        if (!(key in (req.body || {}))) continue;
        let v = req.body[key];
        if (key === 'basePriceMinor' || key === 'starRating') v = v == null ? null : Number(v);
        if (key === 'isVisible') v = v ? 1 : 0;
        sets.push(`${column} = ?`); values.push(v);
    }
    if (!sets.length) return res.status(400).json({ error: 'No updatable fields supplied' });
    values.push(Number(req.params.id));
    const result = await query(`UPDATE hotels SET ${sets.join(', ')} WHERE id = ? AND deleted_at IS NULL`, values);
    if (!result.affectedRows) return res.status(404).json({ error: 'Hotel not found' });
    return res.json({ updated: true });
}));

// --- bookings -------------------------------------------------------------

router.get('/bookings', requireRole(BOOKING_ROLES), asyncRoute(async (req, res) => {
    const rows = await query(
        `SELECT b.public_id, b.reference, b.departure_date, b.traveller_count, b.currency,
                b.minor_units_per_major, b.gross_amount_minor, b.amount_received_minor,
                b.booking_status, b.payment_status, b.document_status, b.created_at,
                c.full_name, c.email, c.phone
           FROM bookings b LEFT JOIN booking_contacts c ON c.booking_id = b.id
          ORDER BY b.created_at DESC LIMIT 200`,
    );
    res.json({ bookings: rows });
}));

router.get('/bookings/:bookingId', requireRole(BOOKING_ROLES), asyncRoute(async (req, res) => {
    const booking = await getBookingForStaff(String(req.params.bookingId));
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json({ booking: toCustomerBooking(booking) });
}));

router.patch('/bookings/:bookingId/status', requireRole(BOOKING_ROLES), asyncRoute(async (req, res) => {
    const VALID = ['pending', 'confirmed', 'cancelled', 'completed'];
    const status = String(req.body?.bookingStatus || '');
    if (!VALID.includes(status)) return res.status(400).json({ error: 'Invalid booking status' });

    const booking = await queryOne('SELECT id FROM bookings WHERE public_id = ?', [String(req.params.bookingId)]);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    await query('UPDATE bookings SET booking_status = ? WHERE id = ?', [status, booking.id]);
    await query(
        `INSERT INTO booking_activity (booking_id, event, actor_type, actor_id, detail_json)
         VALUES (?, 'booking.status_changed', 'staff', ?, ?)`,
        [booking.id, req.staff.id, JSON.stringify({ to: status })],
    );
    return res.json({ updated: true });
}));

/**
 * Record a payment. Finance only. `amount_received_minor` is recomputed from
 * the payment rows rather than being typed in, so a booking's settled figure is
 * always the sum of real recorded payments — never a status label, never a
 * number an admin entered directly. This is the P0-05 lesson in code.
 */
router.post('/bookings/:bookingId/payments', requireRole([STAFF_ROLES.FINANCE_MANAGER]), asyncRoute(async (req, res) => {
    const amountMinor = Number(req.body?.amountMinor);
    if (!Number.isInteger(amountMinor) || amountMinor <= 0) {
        return res.status(400).json({ error: 'amountMinor must be a positive integer' });
    }
    const booking = await queryOne('SELECT id, gross_amount_minor FROM bookings WHERE public_id = ?', [String(req.params.bookingId)]);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const { publicId } = await import('../lib/ids.js');
    const { withTransaction } = await import('../db/pool.js');

    await withTransaction(async (tx) => {
        await tx.query(
            `INSERT INTO payments (booking_id, public_id, amount_minor, method, status, provider, provider_ref, recorded_by)
             VALUES (?,?,?,?, 'succeeded', ?, ?, ?)`,
            [booking.id, publicId(), amountMinor, req.body?.method || 'manual',
             req.body?.provider || null, req.body?.providerRef || null, req.staff.id],
        );
        const sum = await tx.queryOne(
            `SELECT COALESCE(SUM(CASE WHEN direction='charge' THEN amount_minor ELSE -amount_minor END),0) AS total
               FROM payments WHERE booking_id = ? AND status = 'succeeded'`,
            [booking.id],
        );
        const received = Number(sum.total);
        const gross = Number(booking.gross_amount_minor);
        const paymentStatus = received <= 0 ? 'unpaid' : received >= gross ? 'paid' : 'part_paid';
        await tx.query(
            'UPDATE bookings SET amount_received_minor = ?, payment_status = ? WHERE id = ?',
            [received, paymentStatus, booking.id],
        );
    });
    return res.status(201).json({ recorded: true });
}));

export default router;
