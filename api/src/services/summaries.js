/**
 * PB-4 Booking Summary, ported to MariaDB.
 *
 * TERMINOLOGY IS LOAD-BEARING. This is a "Booking Summary" — a provisional
 * record of what was booked. It is NOT a tax invoice and NOT evidence that
 * money was received. P0-05 was exactly this failure: an admin action produced
 * a document that looked like a paid invoice for a booking with no payment.
 * `amount_minor` is the booking's gross price, never its received amount.
 *
 * Numbering: one sequence per calendar year, allocated under a row lock, so two
 * concurrent requests cannot mint the same Summary Number. A refresh of an
 * unchanged booking reuses its summary and consumes no number.
 */

import crypto from 'node:crypto';
import { withTransaction, queryOne, query } from '../db/pool.js';
import { publicId, summaryNumber } from '../lib/ids.js';
import { config } from '../config.js';

export const SUMMARY_DISCLAIMER =
    'This is a Booking Summary, not a tax invoice, and is not evidence of payment received.';

/** Changes here mean the summary is stale and a new version is issued. */
export function bookingFingerprint(b) {
    const material = JSON.stringify({
        reference: b.reference,
        departureDate: b.departure_date,
        travellerCount: b.traveller_count,
        currency: b.currency,
        gross: String(b.gross_amount_minor),
        tour: String(b.tour_amount_minor),
        hotel: String(b.hotel_amount_minor),
        discount: String(b.hotel_discount_minor),
        status: b.booking_status,
    });
    return crypto.createHash('sha256').update(material).digest('hex');
}

async function allocateNumber(tx, year) {
    // The counter row is created OUTSIDE the locking read (see ensureSummary),
    // because doing the upsert inside two concurrent transactions is itself what
    // makes them collide. Here we only take the lock.
    const row = await tx.queryOne('SELECT next_value FROM summary_counters WHERE issued_year = ? FOR UPDATE', [year]);
    if (!row) {
        throw Object.assign(new Error('counter row missing'), { code: 'ER_CHECKREAD' });  // retried by withTransaction
    }
    const seq = Number(row.next_value);
    await tx.query('UPDATE summary_counters SET next_value = next_value + 1 WHERE issued_year = ?', [year]);
    return seq;
}

/**
 * Return the current summary for a booking, issuing one if the booking has
 * changed since the last. Metadata only — no PDF is written while private
 * storage is gated off, and `storage_path` stays NULL.
 */
export async function ensureSummary(bookingId) {
    // Ensure this year's counter row exists before any transaction locks it.
    // Idempotent, and safe to run concurrently.
    const year = new Date().getUTCFullYear();
    await query(
        'INSERT IGNORE INTO summary_counters (issued_year, next_value) VALUES (?, 1)',
        [year],
    );

    return withTransaction(async (tx) => {
        const booking = await tx.queryOne('SELECT * FROM bookings WHERE id = ? FOR UPDATE', [bookingId]);
        if (!booking) return null;

        const fingerprint = bookingFingerprint(booking);

        const current = await tx.queryOne(
            `SELECT * FROM booking_summaries
              WHERE booking_id = ? AND superseded_by IS NULL
              ORDER BY version DESC LIMIT 1`,
            [bookingId],
        );
        // Unchanged booking: reuse. A refresh must never mint a number.
        if (current && current.fingerprint === fingerprint) return current;

        const seq = await allocateNumber(tx, year);
        const number = summaryNumber(year, seq);
        const version = current ? Number(current.version) + 1 : 1;
        const pid = publicId();

        const res = await tx.query(
            `INSERT INTO booking_summaries
               (booking_id, public_id, summary_number, issued_year, sequence, version, fingerprint,
                currency, minor_units_per_major, amount_minor, storage_path)
             VALUES (?,?,?,?,?,?,?,?,?,?,NULL)`,
            [bookingId, pid, number, year, seq, version, fingerprint,
             booking.currency, booking.minor_units_per_major, booking.gross_amount_minor],
        );

        if (current) {
            await tx.query('UPDATE booking_summaries SET superseded_by = ? WHERE id = ?', [res.insertId, current.id]);
        }

        await tx.query(
            `INSERT INTO booking_activity (booking_id, event, actor_type, detail_json)
             VALUES (?, 'summary.issued', 'system', ?)`,
            [bookingId, JSON.stringify({ summaryNumber: number, version })],
        );

        return tx.queryOne('SELECT * FROM booking_summaries WHERE id = ?', [res.insertId]);
    });
}

export async function getCurrentSummary(bookingId) {
    return queryOne(
        `SELECT * FROM booking_summaries WHERE booking_id = ? AND superseded_by IS NULL
          ORDER BY version DESC LIMIT 1`,
        [bookingId],
    );
}

/** Allowlist projection. No storage path, no counter state, no primary key. */
export function toCustomerSummary(s) {
    if (!s) return null;
    return {
        summaryId: s.public_id,
        summaryNumber: s.summary_number,
        version: Number(s.version),
        currency: s.currency,
        minorUnitsPerMajor: Number(s.minor_units_per_major),
        amountMinor: Number(s.amount_minor),
        issuedAt: s.issued_at,
        documentKind: 'booking_summary',
        disclaimer: SUMMARY_DISCLAIMER,
        // A downloadable PDF exists only once private storage is approved.
        pdfAvailable: config.storage.enabled && Boolean(s.storage_path),
    };
}
