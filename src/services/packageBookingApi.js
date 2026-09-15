/**
 * PB-1/PB-2 — Client for the server-authoritative package booking API.
 *
 * PB-2 wires this into the customer booking form. The browser no longer writes
 * the authoritative booking to Firestore; it posts here and the server derives
 * ownership, price, statuses and the booking reference.
 *
 * API ORIGIN
 * Environment-driven, never hardcoded, because which host serves `/api` in
 * production is still open (see IY_PACKAGE_BOOKING_IMPLEMENTATION.md §3).
 * Set VITE_BOOKING_API_BASE_URL per environment:
 *
 *   local dev     ''                                    (Vite proxies /api to the
 *                                                        Functions emulator)
 *   staging       'https://us-central1-infiniteyatra-iy.cloudfunctions.net/api'
 *   production    '' once /api provably reaches Functions, otherwise as staging
 *
 * Empty means same-origin `/api`.
 *
 * AUTHENTICATION
 * The session is an httpOnly cookie issued by the Infinite Yatra API and sent
 * automatically on the same origin. No token is held in JavaScript, so nothing
 * on the page can read or replay it.
 */

import { bookingApi, API_BASE } from './apiClient.js';


/** Error carrying the server's HTTP status and machine-readable detail. */
export class BookingApiError extends Error {
    constructor(message, { status, serverError, details } = {}) {
        super(message);
        this.name = 'BookingApiError';
        this.status = status ?? 0;
        this.serverError = serverError || '';
        this.details = Array.isArray(details) ? details : [];
    }
}

/**
 * Test seam. The network layer now lives in apiClient, so tests inject a fetch
 * double there; this re-export keeps existing callers working.
 */
export { __setFetchForTesting as __setDepsForTesting } from './apiClient.js';


export function newIdempotencyKey() {
    if (globalThis.crypto?.randomUUID) return `bk-${globalThis.crypto.randomUUID()}`;
    // Random, not timestamp-derived: two clicks in the same millisecond must not collide.
    const bytes = new Uint8Array(18);
    globalThis.crypto.getRandomValues(bytes);
    return `bk-${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Build the create-booking request payload from booking-form state.
 *
 * Exported and pure so tests can assert exactly what crosses the wire. Every
 * authoritative field is deliberately absent: no userId, no total, no payment
 * or booking status, no booking reference. The server owns all of those, and
 * PB-1's validator rejects unknown keys, so sending one would fail loudly.
 */
export function buildCreateBookingPayload({
    pkg,
    bookingData,
    selectedLocIdx = 0,
    selectedHotel = null,
    idempotencyKey,
    source = 'web',
}) {
    const travellers = (bookingData.travelersList || []).map((t) => ({
        firstName: (t.firstName || '').trim(),
        middleName: (t.middleName || '').trim(),
        lastName: (t.lastName || '').trim(),
        dateOfBirth: t.dob || '',
        gender: t.gender || '',
        nationality: t.nationality || '',
        contactNumbers: (t.contactNumbers || []).filter(Boolean).map((n) => (n.startsWith('+') ? n : `+${n}`)),
        emergencyContacts: (t.emergencyContacts || [])
            .filter((ec) => ec.firstName || ec.contactNumber)
            .map((ec) => ({
                firstName: (ec.firstName || '').trim(),
                middleName: (ec.middleName || '').trim(),
                lastName: (ec.lastName || '').trim(),
                relation: ec.relation || '',
                contactNumber: ec.contactNumber ? (ec.contactNumber.startsWith('+') ? ec.contactNumber : `+${ec.contactNumber}`) : '',
                email: ec.email || '',
            })),
    }));

    const phone = bookingData.phone || '';

    const payload = {
        packageId: pkg.id,
        departureDate: bookingData.date,
        travellerCount: Number(bookingData.travelers),
        // The selected pickup option's real id, resolved from the package the
        // API returned. An index would break the moment options are reordered.
        pickupOptionId: pkg?.pickupOptions?.[selectedLocIdx]?.id ?? null,
        customer: {
            name: (bookingData.name || '').trim(),
            email: (bookingData.email || '').trim(),
            phone: phone.startsWith('+') ? phone : `+${phone}`,
        },
        travellers,
        idempotencyKey,
        source,
    };

    if (bookingData.specialRequests) payload.specialRequests = bookingData.specialRequests;
    if (selectedHotel) {
        payload.hotelBundle = {
            hotelId: selectedHotel.id,
            roomId: selectedHotel.roomId != null ? String(selectedHotel.roomId) : null,
        };
    }

    return payload;
}

/**
 * Translate an API failure into something a customer can act on.
 * Never surfaces collection names, field paths or stack traces.
 */
export function toCustomerMessage(err) {
    if (!(err instanceof BookingApiError)) {
        return 'We could not submit your booking. Please try again. Your booking will not be duplicated.';
    }

    if (err.serverError === 'NETWORK' || err.status === 0) {
        return 'We could not submit your booking. Please try again. Your booking will not be duplicated.';
    }
    if (err.status === 401) {
        return 'Please sign in to complete your booking.';
    }
    if (err.status === 404) {
        return err.serverError.toLowerCase().includes('hotel')
            ? 'The selected hotel is no longer available. Please remove it and try again.'
            : 'This package is currently unavailable for booking.';
    }
    if (err.status === 409) {
        return 'This package is currently unavailable for booking.';
    }
    if (err.status === 400 && /hotel/i.test(err.serverError)) {
        // The new API reports an unusable hotel as a 400 INVALID_HOTEL.
        return 'The selected hotel is no longer available. Please remove it and try again.';
    }
    if (err.status === 400) {
        const joined = err.details.join(' ').toLowerCase();
        if (joined.includes('departure')) return 'Please select an available departure date.';
        if (joined.includes('pickup')) return 'Please select a valid pickup option.';
        if (joined.includes('travellercount') || joined.includes('travellers'))
            return 'Please check the number of travellers and their details.';
        if (joined.includes('customer.')) return 'Please check your contact details and try again.';
        return 'Some booking details need your attention. Please review and try again.';
    }
    if (err.status >= 500) {
        return 'We could not submit your booking right now. Please try again in a moment. Your booking will not be duplicated.';
    }
    return 'We could not submit your booking. Please try again. Your booking will not be duplicated.';
}

/** Which booking step a failure should send the customer back to, or null to stay. */
export function stepForError(err) {
    if (!(err instanceof BookingApiError) || err.status !== 400) return null;
    const joined = err.details.join(' ').toLowerCase();
    if (joined.includes('departure') || joined.includes('pickup') || joined.includes('customer.')) return 1;
    if (joined.includes('travellers')) return 2;
    return null;
}

/**
 * Create a package booking. The server derives price, booking reference and
 * owner; none of those may be supplied here.
 */
/**
 * FRESH LAUNCH — these now call the Infinite Yatra API on the same origin
 * instead of Firebase Functions. The exported shape is unchanged so BookingPage
 * and BookingSuccess did not need rewriting, but two things are translated here
 * because the new backend models them properly:
 *
 *   pickupLocationIndex -> pickupOptionId   an array index is not an identity;
 *                                           pickup options are real rows now
 *   hotelBundle.hotelId -> hotelId          the bundle is priced server-side
 *
 * `customer` becomes `contact`, matching the booking_contacts table: the person
 * booking is not necessarily the account holder, so their details are stored
 * with the booking rather than overwriting the profile.
 */
function toApiBookingPayload(payload) {
    const travellers = (payload.travellers || []).map((t) => {
        const out = {
            firstName: t.firstName,
            lastName: t.lastName,
        };
        if (t.middleName) out.middleName = t.middleName;
        if (t.dateOfBirth) out.dateOfBirth = t.dateOfBirth;
        if (t.gender) out.gender = t.gender;
        if (t.nationality) out.nationality = t.nationality;
        return out;
    });

    const out = {
        packageId: Number(payload.packageId),
        departureDate: payload.departureDate,
        travellerCount: payload.travellerCount,
        contact: {
            fullName: payload.customer?.name,
            email: payload.customer?.email,
            phone: payload.customer?.phone,
        },
        travellers,
        idempotencyKey: payload.idempotencyKey,
        source: payload.source || 'web',
    };
    if (payload.specialRequests) out.specialRequests = payload.specialRequests;
    if (payload.pickupOptionId != null) out.pickupOptionId = Number(payload.pickupOptionId);
    if (payload.hotelBundle?.hotelId != null) out.hotelId = Number(payload.hotelBundle.hotelId);
    return out;
}

/** Re-wrap an ApiError so existing callers keep seeing BookingApiError. */
function asBookingApiError(err) {
    if (err instanceof BookingApiError) return err;
    return new BookingApiError(err?.message || 'Request failed', {
        status: err?.status ?? 0,
        // Prefer the machine code; fall back to the server's message so the
        // customer-message mapping below can still tell a missing hotel from a
        // missing package.
        serverError: err?.code || (err?.status === 0 ? 'NETWORK' : (err?.message || '')),
        details: err?.details || [],
    });
}

export async function createPackageBooking(payload) {
    try {
        return await bookingApi.create(toApiBookingPayload(payload));
    } catch (err) {
        throw asBookingApiError(err);
    }
}

export async function getMyBooking(bookingId) {
    try {
        return await bookingApi.get(bookingId);
    } catch (err) {
        throw asBookingApiError(err);
    }
}

export { API_BASE as BOOKING_API_BASE_URL };
