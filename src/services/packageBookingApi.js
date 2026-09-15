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
 * Every call carries a fresh Firebase ID token. This deliberately does NOT use
 * src/lib/api.js: that client targets the separate Node/Express + MongoDB
 * service and authenticates with its own localStorage JWT, which has no
 * authority over Firestore bookings.
 */

import { getAuth } from 'firebase/auth';
import { buildBookingApiUrl, BOOKING_API_BASE_URL as SHARED_BASE_URL } from './bookingApiUrl.js';

// CUTOVER - URL construction is centralised so the '/api' prefix is applied
// exactly once. See src/services/bookingApiUrl.js.
const BASE_URL = SHARED_BASE_URL;

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
 * Seam for tests. Production resolves the real Firebase user; tests inject a
 * token provider and a fetch double so request shaping can be asserted without
 * a browser or a live Firebase project.
 */
let _deps = null;

function deps() {
    if (_deps) return _deps;
    _deps = {
        getIdToken: async () => {
            const user = getAuth().currentUser;
            if (!user) throw new BookingApiError('AUTH_REQUIRED', { status: 401, serverError: 'AUTH_REQUIRED' });
            return user.getIdToken();
        },
        fetch: (...args) => globalThis.fetch(...args),
        baseUrl: BASE_URL,
    };
    return _deps;
}

/** Test-only. Never called from application code. */
export function __setDepsForTesting(injected) {
    _deps = injected;
}

async function request(path, { method = 'GET', body } = {}) {
    const d = deps();
    const token = await d.getIdToken();

    let res;
    try {
        res = await d.fetch(buildBookingApiUrl(path, d.baseUrl), {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: body ? JSON.stringify(body) : undefined,
        });
    } catch (networkErr) {
        throw new BookingApiError('NETWORK', { status: 0, serverError: 'NETWORK', details: [networkErr.message] });
    }

    let data = {};
    try {
        data = await res.json();
    } catch {
        /* non-JSON response — leave data empty */
    }

    if (!res.ok) {
        throw new BookingApiError(data.error || `Request failed (${res.status})`, {
            status: res.status,
            serverError: data.error || '',
            details: data.details,
        });
    }
    return data;
}

/**
 * Generate an idempotency key for ONE booking attempt.
 *
 * Create this once when the customer reaches the review step and reuse it for
 * every retry of that attempt — that is what makes a double-click or a network
 * retry safe. A fresh key per click would defeat the protection entirely.
 */
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
        pickupLocationIndex: selectedLocIdx,
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
export async function createPackageBooking(payload) {
    return request('/bookings/package', { method: 'POST', body: payload });
}

/** Read one of the signed-in customer's own bookings. */
export async function getMyBooking(bookingId) {
    return request(`/bookings/${encodeURIComponent(bookingId)}`);
}

export const BOOKING_API_BASE_URL = BASE_URL;
