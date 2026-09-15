/**
 * CUTOVER — booking schema classification and the legacy read projection.
 *
 * Production holds 15 bookings written by the pre-PB frontend directly from the
 * browser. They are historical records and are never migrated, repriced or
 * enriched. New bookings are created server-side by the PB API and carry a
 * server-owned `schemaVersion`.
 *
 * Classification is POSITIVE and server-owned: a booking is canonical only if
 * it carries the marker this server writes. Anything else is LEGACY. That
 * direction matters — an unrecognised or partially-written document degrades to
 * the read-only historical path rather than into the canonical path, where
 * missing fields would silently render as zero amounts.
 *
 * A client can never set `schemaVersion`:
 *   - the PB create API rejects unknown body keys (packageBookingValidation)
 *   - firestore.rules `hasOnly` on /bookings create omits it
 * Both are covered by tests.
 */

'use strict';

/**
 * The marker this server writes on every canonical booking.
 *
 * It is 2, not 1, because PB-1 already shipped `schemaVersion: 2` on canonical
 * bookings and production readers may already depend on that value. Inventing a
 * fresh numbering here would have produced two competing meanings for one field.
 */
const CANONICAL_SCHEMA_VERSION = 2;

/**
 * The lowest version that counts as canonical. Classification is `>=` rather
 * than `===` so a future shape bump does not silently reclassify every existing
 * canonical booking as legacy — which would strip customers of their Booking
 * Summary and documents without a single failing test.
 */
const MIN_CANONICAL_SCHEMA_VERSION = 2;

/** Backwards-compatible alias. Prefer CANONICAL_SCHEMA_VERSION. */
const BOOKING_SCHEMA_VERSION = CANONICAL_SCHEMA_VERSION;

const BOOKING_SCHEMA = Object.freeze({
    CANONICAL_PB: 'CANONICAL_PB',
    LEGACY: 'LEGACY',
});

/** Stable, customer-safe codes. They name availability, never schema internals. */
const LEGACY_ERROR_CODES = Object.freeze({
    SUMMARY_NOT_AVAILABLE: 'BOOKING_SUMMARY_NOT_AVAILABLE',
    DOCUMENTS_NOT_AVAILABLE: 'BOOKING_DOCUMENTS_NOT_AVAILABLE',
});

/**
 * Classify a raw booking document.
 *
 * Must be an actual number: the string "2" is not the marker, because only this
 * server writes the field and it always writes a number. A client could only
 * ever supply a string, and a loose compare would let one pass.
 */
function classifyBooking(data) {
    if (!data || typeof data !== 'object') return BOOKING_SCHEMA.LEGACY;
    const v = data.schemaVersion;
    return typeof v === 'number' && Number.isFinite(v) && v >= MIN_CANONICAL_SCHEMA_VERSION
        ? BOOKING_SCHEMA.CANONICAL_PB
        : BOOKING_SCHEMA.LEGACY;
}

const isCanonicalBooking = (data) => classifyBooking(data) === BOOKING_SCHEMA.CANONICAL_PB;
const isLegacyBooking = (data) => classifyBooking(data) === BOOKING_SCHEMA.LEGACY;

/** ISO string from a Firestore Timestamp, an ISO string, or a Date. Never invents one. */
function isoOrNull(value) {
    if (!value) return null;
    if (typeof value.toDate === 'function') return value.toDate().toISOString();
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string') return value;
    return null;
}

/**
 * Allowlisted projection of a LEGACY booking.
 *
 * Deliberately NOT shaped like the canonical projection. There is no `pricing`
 * object, no `payment` object, and no *Minor field anywhere, so a caller cannot
 * accidentally read a historical rupee figure as canonical minor units or treat
 * a legacy status label as settlement truth. Everything historical sits under
 * `historical` and is labelled as recorded, not computed.
 *
 * What is deliberately absent:
 *   - amountReceivedMinor / balanceAmountMinor — never derived from a status
 *   - bookingReference — legacy records have none; one is never generated
 *   - travellerId — legacy travellers have no stable identity (see below)
 *   - currency — legacy documents store none, so none is invented
 */
function toLegacyCustomerBooking(id, data = {}) {
    return {
        id,
        legacy: true,
        schema: BOOKING_SCHEMA.LEGACY,

        // Catalogue pointer. Safe: already public, and the customer's own
        // history links to the package page with it.
        packageId: data.packageId ?? null,
        packageTitle: data.packageTitle ?? null,

        // Travel date as recorded. Legacy stored this as a plain string.
        travelDate: data.bookingDate ?? null,
        travellerCount: data.travelers ?? null,

        contact: {
            name: data.contactName ?? null,
            email: data.contactEmail ?? null,
            phone: data.contactPhone ?? null,
        },

        // Names only, exactly as recorded. No traveller ids: legacy travellers
        // have no stable identity, and array position is not one — reordering
        // or deleting an entry would silently reassign a person's documents.
        travellers: Array.isArray(data.travelersList)
            ? data.travelersList.map((t) => ({
                  name: typeof t === 'string' ? t : (t?.name ?? null),
              }))
            : [],

        pickupLocation: data.pickupLocation ?? null,
        specialRequests: data.specialRequests ?? '',
        hotelName: data.bundledHotelName ?? null,

        /**
         * HISTORICAL RECORD ONLY — NOT FINANCIAL TRUTH.
         *
         * These are the figures stored at the time, in whatever units the old
         * frontend wrote (rupees as a plain number). They are not converted,
         * not recomputed against today's package price, and carry no implication
         * that money was received. `paymentStatusLabel` is a label the old UI
         * displayed; it is not evidence of settlement.
         */
        historical: {
            recordedTotal: data.totalPrice ?? null,
            recordedTourAmount: data.tourAmount ?? null,
            recordedHotelAmount: data.hotelAmount ?? null,
            bookingStatusLabel: data.bookingStatus ?? data.status ?? null,
            paymentStatusLabel: data.paymentStatus ?? null,
        },

        createdAt: isoOrNull(data.createdAt),

        /**
         * What this booking cannot do, stated by the server so the UI never has
         * to infer it from a missing field.
         */
        capabilities: {
            bookingSummary: false,
            documentUpload: false,
        },
    };
}

module.exports = {
    CANONICAL_SCHEMA_VERSION,
    MIN_CANONICAL_SCHEMA_VERSION,
    BOOKING_SCHEMA_VERSION,
    BOOKING_SCHEMA,
    LEGACY_ERROR_CODES,
    classifyBooking,
    isCanonicalBooking,
    isLegacyBooking,
    toLegacyCustomerBooking,
};
