/**
 * CUTOVER — booking schema classification (client mirror).
 *
 * Kept identical to functions/bookingSchema.js; tests/cutover.schema.test.mjs
 * fails the build if the two drift apart.
 *
 * This is a DISPLAY concern, not a security one. The client cannot authorise
 * anything: a booking read through the API is projected server-side, and a
 * booking read straight from Firestore is already constrained by the owner
 * rule. This module exists so "My Bookings" can render a 2024 record and a PB
 * record in the same list without one shape corrupting the other.
 *
 * Booking history lists documents directly from Firestore, so the shapes here
 * are the RAW stored documents, not the API's customer-safe projections.
 */

/**
 * 2, not 1: PB-1 already shipped `schemaVersion: 2` on canonical bookings.
 * Kept identical to functions/bookingSchema.js.
 */
export const CANONICAL_SCHEMA_VERSION = 2;
export const MIN_CANONICAL_SCHEMA_VERSION = 2;
export const BOOKING_SCHEMA_VERSION = CANONICAL_SCHEMA_VERSION;

export const BOOKING_SCHEMA = Object.freeze({
    CANONICAL_PB: 'CANONICAL_PB',
    LEGACY: 'LEGACY',
});

/** Positive identification, same rule as the server: a number >= 2, never "2". */
export function classifyBooking(data) {
    if (!data || typeof data !== 'object') return BOOKING_SCHEMA.LEGACY;
    const v = data.schemaVersion;
    return typeof v === 'number' && Number.isFinite(v) && v >= MIN_CANONICAL_SCHEMA_VERSION
        ? BOOKING_SCHEMA.CANONICAL_PB
        : BOOKING_SCHEMA.LEGACY;
}

export const isCanonicalBooking = (d) => classifyBooking(d) === BOOKING_SCHEMA.CANONICAL_PB;
export const isLegacyBooking = (d) => classifyBooking(d) === BOOKING_SCHEMA.LEGACY;

function toDate(value) {
    if (!value) return null;
    if (typeof value.toDate === 'function') return value.toDate();
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * One display shape for both schemas, so the list template has no branching
 * beyond `legacy`.
 *
 * `totalDisplay` is a MAJOR-unit number for rendering only:
 *   - canonical divides minor units by the stored minorUnitsPerMajor
 *   - legacy passes the recorded rupee figure through untouched
 * It is never written back, compared across schemas, or treated as settlement.
 * Legacy records get no derived amountReceived and no balance, because nothing
 * in a legacy document records what was actually paid.
 */
export function toDisplayBooking(id, data = {}) {
    const legacy = isLegacyBooking(data);

    if (legacy) {
        return {
            id,
            legacy: true,
            title: data.packageTitle ?? 'Booking',
            packageId: data.packageId ?? null,
            reference: null,
            travelDate: data.bookingDate ?? null,
            travellerCount: data.travelers ?? null,
            totalDisplay: typeof data.totalPrice === 'number' ? data.totalPrice : null,
            statusLabel: data.bookingStatus ?? data.status ?? 'unknown',
            paymentStatusLabel: data.paymentStatus ?? null,
            createdAt: toDate(data.createdAt),
            capabilities: { bookingSummary: false, documentUpload: false },
        };
    }

    const p = data.pricing || {};
    const perMajor = typeof p.minorUnitsPerMajor === 'number' && p.minorUnitsPerMajor > 0
        ? p.minorUnitsPerMajor
        : 100;

    return {
        id,
        legacy: false,
        title: data.packageSnapshot?.title ?? 'Booking',
        packageId: data.packageId ?? null,
        reference: data.bookingReference ?? null,
        travelDate: data.departureDate ?? null,
        travellerCount: data.travellerCount ?? null,
        totalDisplay: typeof p.grossAmountMinor === 'number' ? p.grossAmountMinor / perMajor : null,
        statusLabel: data.bookingStatus ?? 'unknown',
        paymentStatusLabel: data.paymentStatus ?? null,
        createdAt: toDate(data.createdAt),
        // The list view reads raw Firestore documents, so it cannot know whether
        // the server currently has storage. It therefore fails CLOSED: the true
        // values arrive with the API response on the booking detail view. A
        // default of `true` here would render actions that cannot work whenever
        // storage is off.
        capabilities: { bookingSummary: false, documentUpload: false },
    };
}

/** Shown on a legacy booking card. One sentence, no schema vocabulary. */
export const LEGACY_BOOKING_NOTE =
    'This is an earlier booking. Some newer booking features are not available for this booking.';
