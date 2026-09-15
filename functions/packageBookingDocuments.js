/**
 * PB-3 — Secure traveller documents.
 *
 *   POST   /api/bookings/:bookingId/documents              finalize an upload
 *   GET    /api/bookings/:bookingId/documents              list own documents
 *   DELETE /api/bookings/:bookingId/documents/:documentId  remove / replace
 *
 * UPLOAD ARCHITECTURE AND WHY IT IS SAFE
 *
 * The file itself never passes through Cloud Functions. The browser uploads
 * directly to Firebase Storage at a path whose first segment is the owner's
 * own uid, and storage.rules pins that segment to `request.auth.uid`. That is
 * what makes customer A unable to reach customer B's documents, and it is
 * enforced by the platform rather than by this code.
 *
 * Storage rules cannot read Firestore, so they cannot check that a bookingId
 * belongs to the uploader. This endpoint closes that gap: it verifies the
 * booking exists and is owned by the caller, that the traveller belongs to that
 * booking, and — crucially — it reads the REAL object metadata back from
 * Storage rather than trusting anything the client says about content type or
 * size. Only then is metadata written. An object with no metadata is invisible
 * to the admin panel and is an orphan, not a document.
 *
 * Nothing here accepts a review decision, an owner id, or a download URL from
 * the browser.
 */

'use strict';

const crypto = require('crypto');
const { isLegacyBooking, LEGACY_ERROR_CODES } = require('./bookingSchema');

const BOOKINGS = 'bookings';
const DOCUMENTS = 'documents'; // subcollection of a booking
const ACTIVITY = 'activity';

/** Allowlisted document types. Reuses the vocabulary already in the booking form. */
const DOCUMENT_TYPES = ['PHOTO', 'PASSPORT', 'AADHAAR', 'PAN', 'VISA', 'DRIVING_LICENCE', 'VOTER_ID', 'OTHER'];

/** Mirrors storage.rules. Excludes SVG (scriptable), HTML and all executables. */
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

/** 10 MB — see storage.rules for the reasoning. Kept in sync with it deliberately. */
const MAX_FILE_BYTES = 10 * 1024 * 1024;

/** Review lifecycle. Only staff may move a document beyond UPLOADED (PB-5). */
const REVIEW_STATUS = {
    UPLOADED: 'UPLOADED',
    UNDER_REVIEW: 'UNDER_REVIEW',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
};

const DOCUMENT_STATUS = {
    NOT_REQUIRED: 'NOT_REQUIRED',
    PENDING: 'PENDING',
    PARTIAL: 'PARTIAL',
    COMPLETE: 'COMPLETE',
};

const DOCUMENT_ID = /^doc_[a-f0-9]{24}$/;
const TRAVELLER_ID = /^tr_[a-f0-9]{12}$/;
const FIRESTORE_ID = /^[A-Za-z0-9_-]{1,128}$/;

// ---------------------------------------------------------------------------
// Dependency seam (same pattern as packageBookings.js)
// ---------------------------------------------------------------------------

let _deps = null;

function deps() {
    if (_deps) return _deps;
    const admin = require('firebase-admin');
    const { FieldValue } = require('firebase-admin/firestore');
    _deps = {
        firestore: () => admin.firestore(),
        storage: () => admin.storage(),
        serverTimestamp: () => FieldValue.serverTimestamp(),
    };
    return _deps;
}

function __setDepsForTesting(injected) {
    _deps = injected;
}

const db = () => deps().firestore();
const serverTimestamp = () => deps().serverTimestamp();

// ---------------------------------------------------------------------------
// Path handling
// ---------------------------------------------------------------------------

/**
 * The single source of truth for where a document lives.
 *
 * Built from server-trusted values only: the uid comes from the verified token
 * and the ids are format-validated. The client never supplies a path — it
 * supplies ids, and the server derives the path. A crafted filename or a
 * "../" segment therefore cannot influence where anything is read or written.
 */
function buildStoragePath({ ownerUid, bookingId, travellerId, documentId }) {
    return `private-bookings/${ownerUid}/${bookingId}/travellers/${travellerId}/${documentId}`;
}

/** New opaque document id. Never derived from the customer's filename. */
function newDocumentId() {
    return `doc_${crypto.randomBytes(12).toString('hex')}`;
}

/**
 * Keep a readable filename for operations without letting it near a path.
 * Strips directory separators, control characters and anything exotic, then
 * caps the length. Stored as metadata only.
 */
function sanitizeFilename(name) {
    if (typeof name !== 'string') return null;
    const base = name.split(/[\\/]/).pop() || '';
    const cleaned = base
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u001f\u007f]/g, '')
        .replace(/[^A-Za-z0-9._ -]/g, '_')
        .replace(/^\.+/, '')
        .trim()
        .slice(0, 120);
    return cleaned || null;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateFinalizeRequest(body) {
    const errors = [];
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        return { ok: false, errors: ['Request body must be a JSON object'] };
    }

    const allowed = new Set(['documentId', 'travellerId', 'documentType', 'originalFilename', 'expiryDate']);
    for (const key of Object.keys(body)) {
        if (!allowed.has(key)) errors.push(`${key} is not an accepted field`);
    }

    const documentId = String(body.documentId || '');
    if (!DOCUMENT_ID.test(documentId)) errors.push('documentId is not a valid document identifier');

    const travellerId = String(body.travellerId || '');
    if (!TRAVELLER_ID.test(travellerId)) errors.push('travellerId is not a valid traveller identifier');

    const documentType = String(body.documentType || '').toUpperCase();
    if (!DOCUMENT_TYPES.includes(documentType)) {
        errors.push(`documentType must be one of ${DOCUMENT_TYPES.join(', ')}`);
    }

    const originalFilename = sanitizeFilename(body.originalFilename);

    let expiryDate = null;
    if (body.expiryDate !== undefined && body.expiryDate !== null && body.expiryDate !== '') {
        expiryDate = String(body.expiryDate);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
            errors.push('expiryDate must be an ISO date (YYYY-MM-DD)');
        }
    }

    if (errors.length) return { ok: false, errors };
    return { ok: true, value: { documentId, travellerId, documentType, originalFilename, expiryDate } };
}

// ---------------------------------------------------------------------------
// Booking + traveller resolution
// ---------------------------------------------------------------------------

/**
 * Load a booking and confirm the caller owns it.
 * Absent and not-yours produce the same result so booking ids cannot be probed.
 */
async function loadOwnedBooking(bookingId, uid) {
    if (!FIRESTORE_ID.test(bookingId)) return null;
    const snap = await db().collection(BOOKINGS).doc(bookingId).get();
    if (!snap.exists || snap.data().userId !== uid) return null;
    return { id: snap.id, data: snap.data() };
}

/**
 * CUTOVER - the PB document workflow is unavailable for a legacy booking.
 *
 * Not a policy choice, a data one: every document is filed against a stable
 * `travellerId`, and legacy bookings store travellers as a bare `travelersList`
 * of names with no ids. The only way to address a legacy traveller would be
 * array position, which is NOT an identity — deleting or reordering one entry
 * would silently reassign another person's passport scan. So the flow is
 * refused outright until an explicit, owner-approved enrichment process issues
 * real ids.
 *
 * The historical booking itself stays readable; only upload/list/delete stop.
 *
 * Returns true when the request has been answered and the caller must stop.
 */
function rejectLegacyBooking(res, booking) {
    if (!isLegacyBooking(booking.data)) return false;
    res.status(409).json({
        code: LEGACY_ERROR_CODES.DOCUMENTS_NOT_AVAILABLE,
        error: 'This earlier booking does not support traveller document uploads.',
    });
    return true;
}

/** A traveller must belong to THIS booking; ids from another booking are refused. */
function travellerBelongsToBooking(booking, travellerId) {
    const list = Array.isArray(booking.data.travellers) ? booking.data.travellers : [];
    return list.some((t) => t && t.travellerId === travellerId);
}

// ---------------------------------------------------------------------------
// Document status
// ---------------------------------------------------------------------------

/**
 * Derive booking.documentStatus from the documents actually present.
 *
 * Deliberately conservative: packages do not yet declare which documents they
 * require, so there is no honest way to know when a booking is COMPLETE.
 * Claiming COMPLETE on the first upload would tell operations a booking is
 * ready when it is not, so this never returns COMPLETE. Once package-level
 * requirements exist (see the PB-3 notes in
 * IY_PACKAGE_BOOKING_IMPLEMENTATION.md) this becomes a real comparison.
 *
 * The customer can never set this value; it is recomputed server-side after
 * every document change.
 */
function deriveDocumentStatus({ documentCount, requiredTypes = null }) {
    if (Array.isArray(requiredTypes) && requiredTypes.length === 0) {
        return DOCUMENT_STATUS.NOT_REQUIRED;
    }
    if (documentCount === 0) return DOCUMENT_STATUS.PENDING;
    return DOCUMENT_STATUS.PARTIAL;
}

async function recomputeDocumentStatus(bookingId) {
    const docsSnap = await db().collection(BOOKINGS).doc(bookingId).collection(DOCUMENTS).get();
    const status = deriveDocumentStatus({ documentCount: docsSnap.size });
    await db().collection(BOOKINGS).doc(bookingId).update({
        documentStatus: status,
        documentCount: docsSnap.size,
        updatedAt: serverTimestamp(),
    });
    return status;
}

// ---------------------------------------------------------------------------
// Customer-safe projection
// ---------------------------------------------------------------------------

/**
 * Allowlist projection. Note what is absent: storagePath and any download URL
 * or token. A customer never receives a path or a durable link — viewing goes
 * through a short-lived signed URL minted only after authorization.
 */
function toCustomerSafeDocument(id, d) {
    return {
        documentId: id,
        travellerId: d.travellerId,
        documentType: d.documentType,
        originalFilename: d.originalFilename || null,
        mimeType: d.mimeType,
        fileSize: d.fileSize,
        reviewStatus: d.reviewStatus,
        rejectionReason: d.reviewStatus === REVIEW_STATUS.REJECTED ? d.rejectionReason || null : null,
        expiryDate: d.expiryDate || null,
        uploadedAt: d.uploadedAt?.toDate ? d.uploadedAt.toDate().toISOString() : null,
        updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : null,
    };
}

// ---------------------------------------------------------------------------
// POST /api/bookings/:bookingId/documents
// ---------------------------------------------------------------------------

async function finalizeDocument(req, res) {
    const { uid } = req.authUser;
    const bookingId = String(req.params.bookingId || '');

    const parsed = validateFinalizeRequest(req.body);
    if (!parsed.ok) return res.status(400).json({ error: 'Validation failed', details: parsed.errors });
    const input = parsed.value;

    const booking = await loadOwnedBooking(bookingId, uid);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (rejectLegacyBooking(res, booking)) return;

    if (!travellerBelongsToBooking(booking, input.travellerId)) {
        return res.status(400).json({ error: 'Validation failed', details: ['travellerId does not belong to this booking'] });
    }

    // Derived from trusted values only — never from anything the client sent.
    const storagePath = buildStoragePath({
        ownerUid: uid,
        bookingId,
        travellerId: input.travellerId,
        documentId: input.documentId,
    });

    // Read the REAL object metadata back from Storage. Content type and size
    // are taken from the stored object, not from the client's claims, so a
    // lying client cannot register a 500 MB HTML file as a small PDF.
    const file = deps().storage().bucket().file(storagePath);

    let metadata;
    try {
        const [exists] = await file.exists();
        if (!exists) {
            return res.status(404).json({ error: 'Uploaded file not found. Please upload the file and try again.' });
        }
        [metadata] = await file.getMetadata();
    } catch (err) {
        console.error('[pb3] storage metadata read failed:', err.message);
        return res.status(502).json({ error: 'Could not verify the uploaded file. Please try again.' });
    }

    const mimeType = metadata.contentType || '';
    const fileSize = Number(metadata.size || 0);

    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        await file.delete().catch(() => {}); // refuse and clean up rather than leave it
        return res.status(415).json({ error: 'That file type is not supported. Please upload a PDF, JPEG, PNG or WebP.' });
    }
    if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MAX_FILE_BYTES) {
        await file.delete().catch(() => {});
        return res.status(413).json({ error: 'That file is too large. Please upload a file under 10 MB.' });
    }

    const docRef = db().collection(BOOKINGS).doc(bookingId).collection(DOCUMENTS).doc(input.documentId);
    const existing = await docRef.get();

    // Replacing an approved document sends it back for review — a customer
    // must not be able to swap the file behind an approval.
    const isReplacement = existing.exists;
    const previousReview = isReplacement ? existing.data().reviewStatus : null;

    const record = {
        documentId: input.documentId,
        bookingId,
        travellerId: input.travellerId,
        // Ownership is copied from the booking, never from the request.
        customerId: booking.data.userId,
        documentType: input.documentType,
        originalFilename: input.originalFilename,
        storagePath,
        mimeType,
        fileSize,
        expiryDate: input.expiryDate,
        // Review state is server-owned. A customer cannot set or influence it.
        reviewStatus: REVIEW_STATUS.UPLOADED,
        rejectionReason: null,
        reviewedBy: null,
        reviewedAt: null,
        uploadedBy: uid,
        uploadedAt: isReplacement ? existing.data().uploadedAt : serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    await docRef.set(record);

    // Audit: ids and event type only. No filename, no document number, no path.
    await db().collection(BOOKINGS).doc(bookingId).collection(ACTIVITY).add({
        type: isReplacement ? 'DOCUMENT_REPLACED' : 'DOCUMENT_UPLOADED',
        bookingId,
        documentId: input.documentId,
        travellerId: input.travellerId,
        documentType: input.documentType,
        previousReviewStatus: previousReview,
        actorId: uid,
        actorType: 'customer',
        at: serverTimestamp(),
    });

    const documentStatus = await recomputeDocumentStatus(bookingId);

    return res.status(isReplacement ? 200 : 201).json({
        document: toCustomerSafeDocument(input.documentId, { ...record, uploadedAt: null, updatedAt: null }),
        documentStatus,
        replaced: isReplacement,
    });
}

// ---------------------------------------------------------------------------
// GET /api/bookings/:bookingId/documents
// ---------------------------------------------------------------------------

async function listDocuments(req, res) {
    const { uid } = req.authUser;
    const bookingId = String(req.params.bookingId || '');

    const booking = await loadOwnedBooking(bookingId, uid);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (rejectLegacyBooking(res, booking)) return;

    const snap = await db().collection(BOOKINGS).doc(bookingId).collection(DOCUMENTS).get();
    const documents = snap.docs.map((d) => toCustomerSafeDocument(d.id, d.data()));

    return res.status(200).json({
        documents,
        documentStatus: booking.data.documentStatus || DOCUMENT_STATUS.PENDING,
    });
}

// ---------------------------------------------------------------------------
// DELETE /api/bookings/:bookingId/documents/:documentId
// ---------------------------------------------------------------------------

async function deleteDocument(req, res) {
    const { uid } = req.authUser;
    const bookingId = String(req.params.bookingId || '');
    const documentId = String(req.params.documentId || '');

    if (!DOCUMENT_ID.test(documentId)) return res.status(400).json({ error: 'Invalid document id' });

    const booking = await loadOwnedBooking(bookingId, uid);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (rejectLegacyBooking(res, booking)) return;

    const docRef = db().collection(BOOKINGS).doc(bookingId).collection(DOCUMENTS).doc(documentId);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ error: 'Document not found' });

    const data = snap.data();

    // Once staff have approved a document the customer may not quietly remove
    // it; operations may already be relying on it. PB-5 gives staff the control.
    if (data.reviewStatus === REVIEW_STATUS.APPROVED) {
        return res.status(409).json({
            error: 'This document has already been approved and can no longer be removed. Please contact our team.',
        });
    }

    // Remove the object first: a failure here must not leave metadata pointing
    // at a file that is gone, and an orphaned object is worse than an orphaned
    // record because it is the one holding the customer's identity data.
    try {
        await deps().storage().bucket().file(data.storagePath).delete();
    } catch (err) {
        if (err.code !== 404) {
            console.error('[pb3] storage delete failed:', err.message);
            return res.status(502).json({ error: 'Could not remove the file. Please try again.' });
        }
    }

    await docRef.delete();

    await db().collection(BOOKINGS).doc(bookingId).collection(ACTIVITY).add({
        type: 'DOCUMENT_REMOVED',
        bookingId,
        documentId,
        travellerId: data.travellerId,
        documentType: data.documentType,
        actorId: uid,
        actorType: 'customer',
        at: serverTimestamp(),
    });

    const documentStatus = await recomputeDocumentStatus(bookingId);
    return res.status(200).json({ removed: documentId, documentStatus });
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

function registerDocumentRoutes(app, requireFirebaseUser, asyncRoute, { limiter } = {}) {
    const mw = limiter ? [limiter, requireFirebaseUser] : [requireFirebaseUser];

    app.post(
        ['/bookings/:bookingId/documents', '/api/bookings/:bookingId/documents'],
        ...mw,
        asyncRoute(finalizeDocument),
    );
    app.get(
        ['/bookings/:bookingId/documents', '/api/bookings/:bookingId/documents'],
        ...mw,
        asyncRoute(listDocuments),
    );
    app.delete(
        ['/bookings/:bookingId/documents/:documentId', '/api/bookings/:bookingId/documents/:documentId'],
        ...mw,
        asyncRoute(deleteDocument),
    );
}

module.exports = {
    DOCUMENT_TYPES,
    ALLOWED_MIME_TYPES,
    MAX_FILE_BYTES,
    REVIEW_STATUS,
    DOCUMENT_STATUS,
    buildStoragePath,
    newDocumentId,
    sanitizeFilename,
    validateFinalizeRequest,
    deriveDocumentStatus,
    travellerBelongsToBooking,
    toCustomerSafeDocument,
    finalizeDocument,
    listDocuments,
    deleteDocument,
    registerDocumentRoutes,
    rejectLegacyBooking,
    __setDepsForTesting,
};
