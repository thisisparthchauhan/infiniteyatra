/**
 * PB-1 booking engine on MariaDB.
 *
 * The properties carried over from the Firestore implementation, and how each
 * is now guaranteed:
 *
 *   server-side creation   the browser has no database access at all
 *   authoritative pricing  computed from catalogue rows; the client cannot send one
 *   unique reference       UNIQUE KEY on bookings.reference
 *   stable traveller ids   booking_travellers.public_id, never a row index
 *   idempotency            UNIQUE KEY (user_id, idempotency_key)
 *   all-or-nothing         one transaction for booking + contact + travellers + activity
 *   ownership              bookings.user_id, never an email address
 */

import { withTransaction, queryOne, query, isDuplicateKey } from '../db/pool.js';
import { publicId, travellerId, bookingReference } from '../lib/ids.js';
import { priceBooking } from './pricing.js';
import { capabilities } from '../config.js';

const REFERENCE_ATTEMPTS = 5;

export async function loadPackageForBooking(tx, packageId) {
    const pkg = await tx.queryOne(
        `SELECT id, slug, title, location, duration, base_price_minor, currency,
                minor_units_per_major, min_travellers, max_group_size, is_visible,
                inclusions_json, exclusions_json, cancellation_policy_json
           FROM packages WHERE id = ? AND deleted_at IS NULL`,
        [packageId],
    );
    return pkg;
}

/**
 * Create a booking. Returns { booking, reused } — `reused: true` means the
 * idempotency key matched an existing booking and nothing new was created.
 */
export async function createBooking({ userId, input }) {
    // An idempotent retry must not even start the work.
    const existing = await queryOne(
        'SELECT id FROM bookings WHERE user_id = ? AND idempotency_key = ?',
        [userId, input.idempotencyKey],
    );
    if (existing) return { bookingId: existing.id, reused: true };

    try {
        const bookingId = await withTransaction(async (tx) => {
            const pkg = await loadPackageForBooking(tx, input.packageId);
            if (!pkg || !pkg.is_visible) {
                throw Object.assign(new Error('Package not available'), { status: 404, code: 'PACKAGE_NOT_FOUND' });
            }

            let pickupOption = null;
            if (input.pickupOptionId != null) {
                pickupOption = await tx.queryOne(
                    'SELECT id, label, price_minor FROM package_pickup_options WHERE id = ? AND package_id = ?',
                    [input.pickupOptionId, pkg.id],
                );
                // A pickup option from another package would otherwise price this one.
                if (!pickupOption) {
                    throw Object.assign(new Error('Invalid pickup option'), { status: 400, code: 'INVALID_PICKUP' });
                }
            }

            let hotel = null;
            if (input.hotelId != null) {
                hotel = await tx.queryOne(
                    'SELECT id, name, base_price_minor FROM hotels WHERE id = ? AND deleted_at IS NULL AND is_visible = 1',
                    [input.hotelId],
                );
                if (!hotel) {
                    throw Object.assign(new Error('Invalid hotel'), { status: 400, code: 'INVALID_HOTEL' });
                }
            }

            if (input.travellerCount < (pkg.min_travellers || 1)) {
                throw Object.assign(new Error('Below minimum group size'), { status: 400, code: 'BELOW_MIN_TRAVELLERS' });
            }
            if (pkg.max_group_size && input.travellerCount > pkg.max_group_size) {
                throw Object.assign(new Error('Above maximum group size'), { status: 400, code: 'ABOVE_MAX_TRAVELLERS' });
            }

            const pricing = priceBooking({ pkg, pickupOption, travellerCount: input.travellerCount, hotel });

            // Frozen at sale time: a later catalogue edit cannot rewrite history.
            const snapshot = {
                packageId: pkg.id,
                slug: pkg.slug,
                title: pkg.title,
                location: pkg.location,
                duration: pkg.duration,
                pickupLabel: pickupOption?.label ?? null,
                hotelName: hotel?.name ?? null,
                inclusions: pkg.inclusions_json ?? [],
                exclusions: pkg.exclusions_json ?? [],
                cancellationPolicy: pkg.cancellation_policy_json ?? [],
                capturedAt: new Date().toISOString(),
            };

            // Reference collisions are astronomically unlikely but not impossible;
            // the unique index is the authority and we retry on its rejection.
            let reference = null;
            for (let attempt = 0; attempt < REFERENCE_ATTEMPTS; attempt += 1) {
                const candidate = bookingReference();
                try {
                    await tx.query('INSERT INTO booking_references (reference) VALUES (?)', [candidate]);
                    reference = candidate;
                    break;
                } catch (err) {
                    if (!isDuplicateKey(err)) throw err;
                }
            }
            if (!reference) {
                throw Object.assign(new Error('Could not allocate a booking reference'), { status: 503 });
            }

            const bPublicId = publicId();
            const res = await tx.query(
                `INSERT INTO bookings
                   (public_id, reference, user_id, package_id, pickup_option_id, package_snapshot_json,
                    departure_date, traveller_count, special_requests,
                    currency, minor_units_per_major, unit_price_minor, tour_amount_minor,
                    hotel_amount_minor, hotel_discount_minor, gross_amount_minor,
                    hotel_id, source, idempotency_key)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    bPublicId, reference, userId, pkg.id, pickupOption?.id ?? null, JSON.stringify(snapshot),
                    input.departureDate, input.travellerCount, input.specialRequests || null,
                    pricing.currency, pricing.minorUnitsPerMajor, pricing.unitPriceMinor, pricing.tourAmountMinor,
                    pricing.hotelAmountMinor, pricing.hotelDiscountMinor, pricing.grossAmountMinor,
                    hotel?.id ?? null, input.source || 'web', input.idempotencyKey,
                ],
            );
            const newId = res.insertId;

            await tx.query('UPDATE booking_references SET booking_id = ? WHERE reference = ?', [newId, reference]);

            await tx.query(
                'INSERT INTO booking_contacts (booking_id, full_name, email, phone) VALUES (?,?,?,?)',
                [newId, input.contact.fullName, input.contact.email, input.contact.phone],
            );

            for (const [i, t] of input.travellers.entries()) {
                await tx.query(
                    `INSERT INTO booking_travellers
                       (booking_id, public_id, position, first_name, middle_name, last_name,
                        date_of_birth, gender, nationality)
                     VALUES (?,?,?,?,?,?,?,?,?)`,
                    [newId, travellerId(), i, t.firstName, t.middleName || null, t.lastName,
                     t.dateOfBirth || null, t.gender || null, t.nationality || null],
                );
            }

            await tx.query(
                `INSERT INTO booking_activity (booking_id, event, actor_type, actor_id, detail_json)
                 VALUES (?, 'booking.created', 'customer', ?, ?)`,
                [newId, userId, JSON.stringify({ reference, grossAmountMinor: pricing.grossAmountMinor })],
            );

            return newId;
        });

        return { bookingId, reused: false };
    } catch (err) {
        // Two simultaneous submits with the same key: the loser reads the winner's row.
        if (isDuplicateKey(err)) {
            const row = await queryOne(
                'SELECT id FROM bookings WHERE user_id = ? AND idempotency_key = ?',
                [userId, input.idempotencyKey],
            );
            if (row) return { bookingId: row.id, reused: true };
        }
        throw err;
    }
}

/** Full booking for its owner. Returns null for "absent" and "not yours" alike. */
export async function getBookingForUser(bookingPublicId, userId) {
    const booking = await queryOne(
        `SELECT * FROM bookings WHERE public_id = ? AND user_id = ?`,
        [bookingPublicId, userId],
    );
    if (!booking) return null;
    return hydrate(booking);
}

export async function getBookingForStaff(bookingPublicId) {
    const booking = await queryOne('SELECT * FROM bookings WHERE public_id = ?', [bookingPublicId]);
    if (!booking) return null;
    return hydrate(booking);
}

async function hydrate(booking) {
    const [contact, travellers] = await Promise.all([
        queryOne('SELECT full_name, email, phone FROM booking_contacts WHERE booking_id = ?', [booking.id]),
        query(
            `SELECT public_id, position, first_name, middle_name, last_name, date_of_birth, gender, nationality
               FROM booking_travellers WHERE booking_id = ? ORDER BY position`,
            [booking.id],
        ),
    ]);
    return { ...booking, contact, travellers };
}

export async function listBookingsForUser(userId) {
    return query(
        `SELECT public_id, reference, departure_date, traveller_count, currency,
                minor_units_per_major, gross_amount_minor, amount_received_minor,
                booking_status, payment_status, document_status, package_snapshot_json, created_at
           FROM bookings WHERE user_id = ? ORDER BY created_at DESC`,
        [userId],
    );
}

/**
 * Customer-facing projection. An ALLOWLIST: a column added to `bookings` later
 * is invisible until named here, so internal notes, cost or margin cannot leak
 * by being forgotten. Primary keys are never exposed.
 */
export function toCustomerBooking(b) {
    const snap = typeof b.package_snapshot_json === 'string'
        ? JSON.parse(b.package_snapshot_json) : (b.package_snapshot_json || {});
    const cap = capabilities();
    return {
        id: b.public_id,
        reference: b.reference,
        package: {
            title: snap.title ?? null,
            slug: snap.slug ?? null,
            location: snap.location ?? null,
            duration: snap.duration ?? null,
            pickupLabel: snap.pickupLabel ?? null,
            inclusions: snap.inclusions ?? [],
            exclusions: snap.exclusions ?? [],
            cancellationPolicy: snap.cancellationPolicy ?? [],
        },
        departureDate: b.departure_date,
        travellerCount: b.traveller_count,
        specialRequests: b.special_requests || '',
        contact: b.contact
            ? { fullName: b.contact.full_name, email: b.contact.email, phone: b.contact.phone }
            : null,
        travellers: (b.travellers || []).map((t) => ({
            travellerId: t.public_id,
            firstName: t.first_name,
            middleName: t.middle_name,
            lastName: t.last_name,
            dateOfBirth: t.date_of_birth,
            gender: t.gender,
            nationality: t.nationality,
        })),
        hotelName: snap.hotelName ?? null,
        pricing: {
            currency: b.currency,
            minorUnitsPerMajor: b.minor_units_per_major,
            unitPriceMinor: Number(b.unit_price_minor),
            tourAmountMinor: Number(b.tour_amount_minor),
            hotelAmountMinor: Number(b.hotel_amount_minor),
            hotelDiscountMinor: Number(b.hotel_discount_minor),
            grossAmountMinor: Number(b.gross_amount_minor),
        },
        payment: {
            paymentStatus: b.payment_status,
            amountReceivedMinor: Number(b.amount_received_minor),
            balanceAmountMinor: Number(b.gross_amount_minor) - Number(b.amount_received_minor),
        },
        bookingStatus: b.booking_status,
        documentStatus: b.document_status,
        capabilities: {
            documentUpload: cap.documentUpload,
            bookingSummaryPdf: cap.bookingSummaryPdf,
        },
        createdAt: b.created_at,
    };
}
