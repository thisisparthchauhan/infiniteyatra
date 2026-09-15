/**
 * PB-3 — Client for secure traveller documents.
 *
 * FLOW
 *   1. The browser uploads the file DIRECTLY to Firebase Storage, at a path
 *      whose first segment is the signed-in user's own uid.
 *   2. storage.rules pins that segment to request.auth.uid, so a customer
 *      physically cannot write into another customer's namespace.
 *   3. The browser then calls the finalize endpoint, which verifies booking
 *      ownership and reads the real object metadata back from Storage before
 *      writing any database record.
 *
 * The file body never passes through Cloud Functions — there is no reason to
 * pay that cost when the rules already enforce the ownership boundary.
 *
 * Nothing here persists a download URL, and no storage path is ever returned
 * to the caller by the server.
 */

import { getAuth } from 'firebase/auth';
import { getStorageAsync } from '../firebase';
import { BookingApiError } from './packageBookingApi';
import { buildBookingApiUrl, BOOKING_API_BASE_URL } from './bookingApiUrl.js';

/** Kept in sync with storage.rules and functions/packageBookingDocuments.js. */
export const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

export const DOCUMENT_TYPES = [
    { value: 'PHOTO', label: 'Photograph' },
    { value: 'PASSPORT', label: 'Passport' },
    { value: 'AADHAAR', label: 'Aadhaar Card' },
    { value: 'PAN', label: 'PAN Card' },
    { value: 'VISA', label: 'Visa' },
    { value: 'DRIVING_LICENCE', label: 'Driving Licence' },
    { value: 'VOTER_ID', label: 'Voter ID' },
    { value: 'OTHER', label: 'Other document' },
];

// CUTOVER - see src/services/bookingApiUrl.js.
const BASE_URL = BOOKING_API_BASE_URL;

let _deps = null;

function deps() {
    if (_deps) return _deps;
    _deps = {
        getUser: () => getAuth().currentUser,
        getStorage: () => getStorageAsync(),
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
    const user = d.getUser();
    if (!user) throw new BookingApiError('AUTH_REQUIRED', { status: 401, serverError: 'AUTH_REQUIRED' });
    const token = await user.getIdToken();

    let res;
    try {
        res = await d.fetch(buildBookingApiUrl(path, d.baseUrl), {
            method,
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: body ? JSON.stringify(body) : undefined,
        });
    } catch (networkErr) {
        throw new BookingApiError('NETWORK', { status: 0, serverError: 'NETWORK', details: [networkErr.message] });
    }

    let data = {};
    try { data = await res.json(); } catch { /* non-JSON */ }

    if (!res.ok) {
        throw new BookingApiError(data.error || `Request failed (${res.status})`, {
            status: res.status,
            serverError: data.error || '',
            details: data.details,
        });
    }
    return data;
}

/** Opaque document id. Deliberately unrelated to the customer's filename. */
export function newDocumentId() {
    const bytes = new Uint8Array(12);
    globalThis.crypto.getRandomValues(bytes);
    return `doc_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * The storage path, derived from ids only.
 *
 * The customer's filename never appears here, so a name like
 * `../../other-user/passport.pdf` cannot escape the namespace — it is carried
 * separately as sanitized metadata and has no bearing on the location.
 */
export function buildStoragePath({ ownerUid, bookingId, travellerId, documentId }) {
    return `private-bookings/${ownerUid}/${bookingId}/travellers/${travellerId}/${documentId}`;
}

/** Client-side pre-checks. UX only — the server and the rules are the authority. */
export function validateFile(file) {
    if (!file) return 'Please choose a file.';
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return 'That file type is not supported. Please upload a PDF, JPEG, PNG or WebP.';
    }
    if (file.size <= 0) return 'That file appears to be empty.';
    if (file.size > MAX_FILE_BYTES) return 'That file is too large. Please upload a file under 10 MB.';
    return null;
}

/**
 * Upload one traveller document and register it.
 *
 * @param {object} args
 * @param {string} args.bookingId
 * @param {string} args.travellerId   stable id from the booking's travellers[]
 * @param {string} args.documentType  one of DOCUMENT_TYPES
 * @param {File}   args.file
 * @param {string} [args.documentId]  supply to REPLACE an existing document
 * @param {(pct:number)=>void} [args.onProgress]
 */
export async function uploadTravellerDocument({ bookingId, travellerId, documentType, file, documentId, onProgress }) {
    const clientError = validateFile(file);
    if (clientError) throw new BookingApiError(clientError, { status: 400, serverError: 'CLIENT_VALIDATION' });

    const d = deps();
    const user = d.getUser();
    if (!user) throw new BookingApiError('AUTH_REQUIRED', { status: 401, serverError: 'AUTH_REQUIRED' });

    const id = documentId || newDocumentId();
    const path = buildStoragePath({ ownerUid: user.uid, bookingId, travellerId, documentId: id });

    const storage = await d.getStorage();
    const { ref, uploadBytesResumable } = await import('firebase/storage');
    const objectRef = ref(storage, path);

    await new Promise((resolve, reject) => {
        const task = uploadBytesResumable(objectRef, file, { contentType: file.type });
        task.on(
            'state_changed',
            (snap) => {
                if (onProgress && snap.totalBytes) {
                    onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
                }
            },
            reject,
            resolve,
        );
    });

    // Registering is what makes the object a document. An upload that is never
    // finalized leaves an orphan with no metadata, invisible to operations.
    return request(`/bookings/${encodeURIComponent(bookingId)}/documents`, {
        method: 'POST',
        body: {
            documentId: id,
            travellerId,
            documentType,
            originalFilename: file.name,
        },
    });
}

export async function listBookingDocuments(bookingId) {
    return request(`/bookings/${encodeURIComponent(bookingId)}/documents`);
}

export async function deleteBookingDocument(bookingId, documentId) {
    return request(`/bookings/${encodeURIComponent(bookingId)}/documents/${encodeURIComponent(documentId)}`, {
        method: 'DELETE',
    });
}

/**
 * Fetch a document for the customer to view.
 *
 * Uses the authenticated Storage SDK, so access is authorized by storage.rules
 * at read time against the caller's own uid. No URL is persisted anywhere and
 * no download token is minted. The caller MUST revoke the returned object URL.
 */
export async function getOwnDocumentObjectUrl({ bookingId, travellerId, documentId }) {
    const d = deps();
    const user = d.getUser();
    if (!user) throw new BookingApiError('AUTH_REQUIRED', { status: 401, serverError: 'AUTH_REQUIRED' });

    const storage = await d.getStorage();
    const { ref, getBlob } = await import('firebase/storage');
    const path = buildStoragePath({ ownerUid: user.uid, bookingId, travellerId, documentId });
    const blob = await getBlob(ref(storage, path));
    return URL.createObjectURL(blob);
}

/** Friendly wording for document failures. Never leaks paths or internals. */
export function toDocumentMessage(err) {
    if (!(err instanceof BookingApiError)) {
        return 'We could not upload your document. Please try again.';
    }
    if (err.serverError === 'CLIENT_VALIDATION') return err.message;
    if (err.serverError === 'NETWORK' || err.status === 0) {
        return 'We could not upload your document. Please check your connection and try again.';
    }
    if (err.status === 401) return 'Please sign in to manage your documents.';
    if (err.status === 404) return 'We could not find that booking or file. Please refresh and try again.';
    if (err.status === 409) return err.message;
    if (err.status === 413) return 'That file is too large. Please upload a file under 10 MB.';
    if (err.status === 415) return 'That file type is not supported. Please upload a PDF, JPEG, PNG or WebP.';
    if (err.status === 400) return 'We could not accept that document. Please check the details and try again.';
    return 'We could not upload your document right now. Please try again in a moment.';
}
