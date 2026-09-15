/**
 * PB-4 — Client for the Provisional Booking Summary.
 *
 * The summary is generated and stored server-side; the browser only asks for
 * it and streams it back through the authenticated endpoint. No signed URL and
 * no download token is ever minted, so there is nothing durable to leak or
 * forward.
 *
 * Terminology is fixed: this is a Booking Summary. It is not a receipt and not
 * an invoice, and no wording here should imply otherwise.
 */

import { getAuth } from 'firebase/auth';
import { BookingApiError } from './packageBookingApi';

const BASE_URL = (import.meta.env?.VITE_BOOKING_API_BASE_URL || '').replace(/\/$/, '');

let _deps = null;

function deps() {
    if (_deps) return _deps;
    _deps = {
        getUser: () => getAuth().currentUser,
        fetch: (...args) => globalThis.fetch(...args),
        baseUrl: BASE_URL,
    };
    return _deps;
}

/** Test-only. Never called from application code. */
export function __setDepsForTesting(injected) { _deps = injected; }

async function authHeaders() {
    const user = deps().getUser();
    if (!user) throw new BookingApiError('AUTH_REQUIRED', { status: 401, serverError: 'AUTH_REQUIRED' });
    return { Authorization: `Bearer ${await user.getIdToken()}` };
}

async function request(path, { method = 'GET' } = {}) {
    const d = deps();
    const headers = { 'Content-Type': 'application/json', ...(await authHeaders()) };

    let res;
    try {
        res = await d.fetch(`${d.baseUrl}/api${path}`, { method, headers });
    } catch (networkErr) {
        throw new BookingApiError('NETWORK', { status: 0, serverError: 'NETWORK', details: [networkErr.message] });
    }

    let data = {};
    try { data = await res.json(); } catch { /* non-JSON */ }

    if (!res.ok) {
        throw new BookingApiError(data.error || `Request failed (${res.status})`, {
            status: res.status, serverError: data.error || '', details: data.details,
        });
    }
    return data;
}

/**
 * Ensure a current summary exists and return its metadata.
 *
 * Safe to call on every page view: the server reuses an unchanged summary and
 * consumes no new number.
 */
export async function ensureBookingSummary(bookingId) {
    return request(`/bookings/${encodeURIComponent(bookingId)}/summary`, { method: 'POST' });
}

export async function getBookingSummary(bookingId) {
    return request(`/bookings/${encodeURIComponent(bookingId)}/summary`);
}

/**
 * Download the PDF through the authenticated endpoint and hand the browser a
 * transient object URL, which is revoked immediately after the save is
 * triggered. Nothing durable is stored.
 */
export async function downloadBookingSummary(bookingId, summaryNumber) {
    const d = deps();
    const headers = await authHeaders();

    let res;
    try {
        res = await d.fetch(`${d.baseUrl}/api/bookings/${encodeURIComponent(bookingId)}/summary/download`, { headers });
    } catch (networkErr) {
        throw new BookingApiError('NETWORK', { status: 0, serverError: 'NETWORK', details: [networkErr.message] });
    }
    if (!res.ok) {
        throw new BookingApiError(`Request failed (${res.status})`, { status: res.status });
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    try {
        const a = document.createElement('a');
        a.href = url;
        a.download = `Booking_Summary_${summaryNumber || bookingId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    } finally {
        setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
}

/**
 * Wording for summary failures.
 *
 * A failure here must never cast doubt on the booking itself — the booking is
 * already recorded server-side, and saying otherwise would be untrue and
 * alarming. It equally must not imply anything about payment.
 */
export function toSummaryMessage(err) {
    if (!(err instanceof BookingApiError)) {
        return 'Your booking is recorded. The Booking Summary is temporarily unavailable. Please try again.';
    }
    if (err.status === 401) return 'Please sign in to download your Booking Summary.';
    if (err.status === 404) return 'Your Booking Summary is being prepared. Please try again in a moment.';
    return 'Your booking is recorded. The Booking Summary is temporarily unavailable. Please try again.';
}
