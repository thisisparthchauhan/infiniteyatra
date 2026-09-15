/** Customer booking routes. Every one requires a session and scopes to the owner. */

import express from 'express';
import rateLimit from 'express-rate-limit';
import { asyncRoute, requireCustomer } from '../middleware/auth.js';
import { validateCreateBooking } from '../lib/validate.js';
import {
    createBooking, getBookingForUser, listBookingsForUser, toCustomerBooking,
} from '../services/bookings.js';
import { ensureSummary, getCurrentSummary, toCustomerSummary } from '../services/summaries.js';
import { queryOne } from '../db/pool.js';
import { capabilities, config } from '../config.js';

const router = express.Router();

const createLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, max: config.rateLimits.bookingCreateMax,
    standardHeaders: true, legacyHeaders: false,
    message: { error: 'Too many booking attempts, please try again later' },
});

router.use(requireCustomer);

router.post('/', createLimiter, asyncRoute(async (req, res) => {
    const input = validateCreateBooking(req.body);
    const { bookingId, reused } = await createBooking({ userId: req.user.id, input });
    const booking = await getBookingForUser(
        (await queryOne('SELECT public_id FROM bookings WHERE id = ?', [bookingId])).public_id,
        req.user.id,
    );
    res.status(reused ? 200 : 201).json({ booking: toCustomerBooking(booking), reused });
}));

router.get('/', asyncRoute(async (req, res) => {
    const rows = await listBookingsForUser(req.user.id);
    const cap = capabilities();
    res.json({
        bookings: rows.map((b) => {
            const snap = typeof b.package_snapshot_json === 'string'
                ? JSON.parse(b.package_snapshot_json) : (b.package_snapshot_json || {});
            return {
                id: b.public_id,
                reference: b.reference,
                title: snap.title ?? null,
                departureDate: b.departure_date,
                travellerCount: b.traveller_count,
                pricing: {
                    currency: b.currency,
                    minorUnitsPerMajor: b.minor_units_per_major,
                    grossAmountMinor: Number(b.gross_amount_minor),
                },
                payment: {
                    paymentStatus: b.payment_status,
                    amountReceivedMinor: Number(b.amount_received_minor),
                },
                bookingStatus: b.booking_status,
                documentStatus: b.document_status,
                capabilities: { documentUpload: cap.documentUpload, bookingSummaryPdf: cap.bookingSummaryPdf },
                createdAt: b.created_at,
            };
        }),
    });
}));

router.get('/:bookingId', asyncRoute(async (req, res) => {
    const booking = await getBookingForUser(String(req.params.bookingId), req.user.id);
    // Absent and not-yours are indistinguishable, so ids cannot be probed.
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json({ booking: toCustomerBooking(booking) });
}));

// --- PB-4 Booking Summary -------------------------------------------------

router.post('/:bookingId/summary', asyncRoute(async (req, res) => {
    const booking = await getBookingForUser(String(req.params.bookingId), req.user.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    const summary = await ensureSummary(booking.id);
    res.json({ summary: toCustomerSummary(summary) });
}));

router.get('/:bookingId/summary', asyncRoute(async (req, res) => {
    const booking = await getBookingForUser(String(req.params.bookingId), req.user.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    const summary = await getCurrentSummary(booking.id);
    if (!summary) return res.status(404).json({ error: 'No Booking Summary has been issued yet' });
    res.json({ summary: toCustomerSummary(summary) });
}));

/**
 * PB-3 documents. The workflow model is in the schema, but no file is accepted
 * until a private directory outside the web root is configured: an Aadhaar or
 * passport scan under public_html would be world-readable.
 */
router.all('/:bookingId/documents', asyncRoute(async (req, res) => {
    const cap = capabilities();
    if (!cap.documentUpload) {
        return res.status(503).json({
            code: 'DOCUMENT_STORAGE_UNAVAILABLE',
            error: 'Document upload is not available yet.',
        });
    }
    return res.status(501).json({ error: 'Not implemented' });
}));

export default router;
