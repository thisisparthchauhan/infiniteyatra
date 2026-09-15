/**
 * PB-4 — Provisional Booking Summary.
 *
 *   POST /api/bookings/:bookingId/summary           generate or reuse
 *   GET  /api/bookings/:bookingId/summary           metadata
 *   GET  /api/bookings/:bookingId/summary/download  authenticated stream
 *
 * WHAT THIS DOCUMENT IS, AND IS NOT
 *
 * A Booking Summary records what was booked and what is payable. It is not a
 * payment receipt and not a tax invoice. Nothing here reads, infers or asserts
 * a received payment: the amount received is taken from the booking's
 * server-owned `amountReceivedMinor`, which is 0 until PB-6's payment ledger
 * writes it. There is no fallback, no default and no guess — that is precisely
 * the defect (P0-05) this phase exists to replace.
 *
 * `documentKind` is carried explicitly so PB-6 can add PAYMENT_RECEIPT and a
 * future phase can add TAX_INVOICE without redefining anything. PB-4 issues
 * only BOOKING_SUMMARY.
 */

'use strict';

const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const { isLegacyBooking, LEGACY_ERROR_CODES } = require('./bookingSchema');

const BOOKINGS = 'bookings';
const BOOKING_DOCUMENTS = 'booking_documents';
const DOCUMENT_NUMBERS = 'booking_document_numbers';
const ACTIVITY = 'activity';

/** Document kinds. PB-4 may issue only the first. */
const DOCUMENT_KIND = {
    BOOKING_SUMMARY: 'BOOKING_SUMMARY',
    PAYMENT_RECEIPT: 'PAYMENT_RECEIPT', // PB-6
    TAX_INVOICE: 'TAX_INVOICE',         // blocked on GST/TCS decisions
};

const SUMMARY_NUMBER = /^IY-BS-\d{4}-\d{6}$/;
const FIRESTORE_ID = /^[A-Za-z0-9_-]{1,128}$/;

const MAX_NUMBER_ATTEMPTS = 5;
const NUMBER_COLLISION = Symbol('NUMBER_COLLISION');

// ---------------------------------------------------------------------------
// Dependency seam (same pattern as the other PB modules)
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
        increment: (n) => FieldValue.increment(n),
    };
    return _deps;
}

function __setDepsForTesting(injected) { _deps = injected; }

const db = () => deps().firestore();
const serverTimestamp = () => deps().serverTimestamp();

// ---------------------------------------------------------------------------
// Numbering
// ---------------------------------------------------------------------------

/**
 * Format a sequential summary number: IY-BS-YYYY-NNNNNN.
 *
 * Sequential is a locked business decision (Q14). It is worth recording the
 * tradeoff: a sequential public number discloses roughly how many bookings
 * have been summarised in a year. PB-1's booking reference is random for
 * exactly that reason. The two identifiers serve different purposes and the
 * customer-facing reference remains the random one.
 */
function formatSummaryNumber(year, seq) {
    return `IY-BS-${year}-${String(seq).padStart(6, '0')}`;
}

/**
 * Allocate the next number for a year inside a transaction.
 *
 * The counter is a server-owned document; a customer can neither read it
 * (Firestore rules deny) nor influence it (it is never taken from a request).
 */
async function allocateSummaryNumber(tx, year) {
    const ref = db().collection(DOCUMENT_NUMBERS).doc(`BOOKING_SUMMARY-${year}`);
    const snap = await tx.get(ref);
    const next = (snap.exists ? Number(snap.data().lastSequence || 0) : 0) + 1;
    return { ref, next, exists: snap.exists, number: formatSummaryNumber(year, next) };
}

// ---------------------------------------------------------------------------
// Material-change detection
// ---------------------------------------------------------------------------

/**
 * Fingerprint the booking facts a summary actually states.
 *
 * Two requests for an unchanged booking produce the same fingerprint, so a page
 * refresh reuses the existing PDF and consumes no number. When a stated fact
 * changes, the fingerprint moves and a NEW VERSION is issued under the SAME
 * number — the previous version is superseded, never overwritten, because a
 * financial-adjacent document that silently rewrites itself cannot be trusted.
 *
 * Deliberately excludes amountReceived: PB-4 never states a received payment,
 * so a future ledger entry does not invalidate a summary. PB-6 issues a receipt
 * instead.
 */
function bookingFingerprint(b) {
    const facts = {
        bookingReference: b.bookingReference ?? null,
        packageId: b.packageId ?? null,
        packageTitle: b.packageSnapshot?.title ?? null,
        location: b.packageSnapshot?.location ?? null,
        duration: b.packageSnapshot?.duration ?? null,
        pickupLocation: b.packageSnapshot?.pickupLocation ?? null,
        departureDate: b.departureDate ?? null,
        travellerCount: b.travellerCount ?? null,
        currency: b.pricing?.currency ?? null,
        unitPriceMinor: b.pricing?.unitPriceMinor ?? null,
        tourAmountMinor: b.pricing?.tourAmountMinor ?? null,
        hotelAmountMinor: b.pricing?.hotelAmountMinor ?? null,
        grossAmountMinor: b.pricing?.grossAmountMinor ?? null,
        customer: b.customer ?? null,
        travellers: (b.travellers || []).map((t) => ({
            travellerId: t.travellerId ?? null,
            firstName: t.firstName ?? null,
            lastName: t.lastName ?? null,
        })),
    };
    return crypto.createHash('sha256').update(JSON.stringify(facts)).digest('hex');
}

// ---------------------------------------------------------------------------
// Money + text helpers
// ---------------------------------------------------------------------------

const CURRENCY_SYMBOL = { INR: 'Rs.' };

function money(minor, currency, minorPerMajor = 100) {
    const major = (Number(minor) || 0) / minorPerMajor;
    const sym = CURRENCY_SYMBOL[currency] || `${currency} `;
    return `${sym}${major.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function isoDate(value) {
    if (!value) return 'To be confirmed';
    const d = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

// ---------------------------------------------------------------------------
// PDF
// ---------------------------------------------------------------------------

const NAVY = '#1e293b';
const SLATE = '#64748b';
const LINE = '#e2e8f0';

/**
 * Render the Booking Summary.
 *
 * Every figure comes from the booking's server-owned fields. There is no
 * parameter through which a caller can influence an amount or a status.
 */
function renderSummaryPdf({ booking, summaryNumber, issuedAt, version }) {
    // compress:false keeps the text layer greppable. These documents are a few
    // kilobytes, and being able to assert in tests that no payment-claim wording
    // ever reaches a customer is worth more than the saving.
    const doc = new PDFDocument({ size: 'A4', margin: 50, compress: false });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));

    const currency = booking.pricing?.currency || 'INR';
    const minorPer = booking.pricing?.minorUnitsPerMajor || 100;
    const total = booking.pricing?.grossAmountMinor ?? 0;
    const received = booking.amountReceivedMinor ?? 0;
    const balance = booking.balanceAmountMinor ?? total;
    const paymentStatus = booking.paymentStatus || 'UNPAID';

    const left = 50;
    const right = 545;
    const width = right - left;

    // ── Header ──
    doc.rect(0, 0, 595, 96).fill(NAVY);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(20).text('INFINITE YATRA', left, 30);
    doc.font('Helvetica').fontSize(11).text('PROVISIONAL BOOKING SUMMARY', left, 56);
    doc.fontSize(8).fillColor('#cbd5e1')
        .text('Not a payment receipt or tax invoice', left, 74);

    let y = 120;

    // ── Identifiers ──
    const idRow = (label, value, x) => {
        doc.fillColor(SLATE).font('Helvetica').fontSize(8).text(label.toUpperCase(), x, y);
        doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(11).text(value, x, y + 12);
    };
    idRow('Summary Number', summaryNumber, left);
    idRow('Booking Reference', booking.bookingReference || '-', left + 190);
    idRow('Issued', issuedAt, left + 380);
    y += 40;
    if (version > 1) {
        doc.fillColor(SLATE).font('Helvetica').fontSize(8)
            .text(`Version ${version} - supersedes earlier versions of this summary`, left, y);
        y += 14;
    }

    doc.moveTo(left, y).lineTo(right, y).strokeColor(LINE).stroke();
    y += 20;

    const section = (title) => {
        doc.fillColor(SLATE).font('Helvetica-Bold').fontSize(9).text(title.toUpperCase(), left, y);
        y += 16;
    };
    const kv = (label, value) => {
        doc.fillColor(SLATE).font('Helvetica').fontSize(9).text(label, left, y, { width: 150 });
        doc.fillColor(NAVY).font('Helvetica').fontSize(10).text(String(value ?? '-'), left + 150, y, { width: width - 150 });
        y += 16;
    };

    // ── Trip ──
    section('Trip Details');
    kv('Package', booking.packageSnapshot?.title || '-');
    if (booking.packageSnapshot?.location) kv('Destination', booking.packageSnapshot.location);
    kv('Travel Date', isoDate(booking.departureDate));
    if (booking.packageSnapshot?.duration) kv('Duration', booking.packageSnapshot.duration);
    if (booking.packageSnapshot?.pickupLocation) kv('Pickup', booking.packageSnapshot.pickupLocation);
    y += 8;

    // ── Customer ──
    section('Customer');
    kv('Name', booking.customer?.name || '-');
    kv('Email', booking.customer?.email || '-');
    kv('Phone', booking.customer?.phone || '-');
    y += 8;

    // ── Travellers ──
    const travellers = Array.isArray(booking.travellers) ? booking.travellers : [];
    section(`Travellers (${booking.travellerCount ?? travellers.length})`);
    if (travellers.length === 0) {
        doc.fillColor(SLATE).font('Helvetica').fontSize(9)
            .text('Traveller details will be confirmed with our team.', left, y);
        y += 16;
    } else {
        travellers.forEach((t, i) => {
            const name = `${t.firstName || ''} ${t.lastName || ''}`.trim() || `Traveller ${i + 1}`;
            doc.fillColor(NAVY).font('Helvetica').fontSize(10).text(`${i + 1}.  ${name}`, left, y);
            y += 15;
        });
    }
    y += 10;

    // ── Pricing ──
    doc.moveTo(left, y).lineTo(right, y).strokeColor(LINE).stroke();
    y += 16;
    section('Pricing Summary');

    const amountRow = (label, value, bold = false, color = NAVY) => {
        doc.fillColor(bold ? NAVY : SLATE).font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 11 : 9)
            .text(label, left, y, { width: 300 });
        doc.fillColor(color).font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 11 : 10)
            .text(value, left + 300, y, { width: width - 300, align: 'right' });
        y += bold ? 20 : 16;
    };

    if (booking.pricing?.unitPriceMinor != null && booking.travellerCount) {
        amountRow(
            `Package  (${booking.travellerCount} x ${money(booking.pricing.unitPriceMinor, currency, minorPer)})`,
            money(booking.pricing.tourAmountMinor ?? 0, currency, minorPer),
        );
    }
    if (booking.pricing?.hotelAmountMinor) {
        amountRow('Bundled accommodation (after discount)', money(booking.pricing.hotelAmountMinor, currency, minorPer));
    }

    doc.moveTo(left, y + 2).lineTo(right, y + 2).strokeColor(LINE).stroke();
    y += 12;
    amountRow('Total Amount Payable', money(total, currency, minorPer), true);

    // Only shown once a payment genuinely exists. Until PB-6 records one this
    // stays absent rather than printing a zero that reads like a receipt line.
    if (received > 0) {
        amountRow('Amount Received', money(received, currency, minorPer));
        amountRow('Balance Payable', money(balance, currency, minorPer), true);
    }
    y += 6;

    // ── Status ──
    doc.fillColor(SLATE).font('Helvetica').fontSize(9).text('Payment Status', left, y, { width: 150 });
    doc.fillColor(paymentStatus === 'UNPAID' ? '#b45309' : NAVY).font('Helvetica-Bold').fontSize(10)
        .text(paymentStatus, left + 150, y);
    y += 16;
    if (booking.documentStatus) {
        doc.fillColor(SLATE).font('Helvetica').fontSize(9).text('Traveller Documents', left, y, { width: 150 });
        doc.fillColor(NAVY).font('Helvetica').fontSize(10).text(booking.documentStatus, left + 150, y);
        y += 16;
    }
    y += 14;

    // ── Notice ──
    doc.rect(left, y, width, 46).fill('#f8fafc');
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(8).text('PLEASE NOTE', left + 12, y + 10);
    doc.fillColor(SLATE).font('Helvetica').fontSize(8.5).text(
        'This Booking Summary records the booking details and the amount payable. '
        + 'It is not a payment receipt or a tax invoice, and does not confirm that any '
        + 'payment has been received.',
        left + 12, y + 22, { width: width - 24 },
    );
    y += 62;

    doc.fillColor(SLATE).font('Helvetica').fontSize(8)
        .text('Infinite Yatra  |  info@infiniteyatra.com  |  infiniteyatra.com', left, y, { width, align: 'center' });

    doc.end();

    return new Promise((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
    });
}

// ---------------------------------------------------------------------------
// Booking access
// ---------------------------------------------------------------------------

/** Absent and not-yours are indistinguishable so booking ids cannot be probed. */
async function loadOwnedBooking(bookingId, uid) {
    if (!FIRESTORE_ID.test(bookingId)) return null;
    const snap = await db().collection(BOOKINGS).doc(bookingId).get();
    if (!snap.exists || snap.data().userId !== uid) return null;
    return { id: snap.id, data: snap.data() };
}

/**
 * CUTOVER - a Booking Summary cannot be issued for a legacy booking.
 *
 * Legacy records have no canonical pricing, so every amount the PDF needs is
 * absent. Rendering one anyway would produce a document showing a total of
 * zero over the customer's real trip, which is worse than refusing: it looks
 * like an authoritative financial statement. The block is therefore explicit
 * rather than left to the renderer's nullish fallbacks.
 *
 * 409 rather than 404: the booking exists and the customer owns it. Distinct
 * from the 404 above, which deliberately hides existence.
 *
 * Returns true when the request has been answered and the caller must stop.
 */
function rejectLegacyBooking(res, booking) {
    if (!isLegacyBooking(booking.data)) return false;
    res.status(409).json({
        // Availability, not schema internals. The client maps this code to copy.
        code: LEGACY_ERROR_CODES.SUMMARY_NOT_AVAILABLE,
        error: 'This earlier booking does not have the new Booking Summary format.',
    });
    return true;
}

function storagePathFor({ ownerUid, bookingId, summaryId }) {
    return `private-bookings/${ownerUid}/${bookingId}/summaries/${summaryId}.pdf`;
}

/**
 * Allowlist projection. No storagePath, no URL, no token, no counter state.
 */
function toCustomerSafeSummary(d) {
    return {
        summaryId: d.summaryId,
        documentKind: d.documentKind,
        summaryNumber: d.summaryNumber,
        bookingId: d.bookingId,
        version: d.version,
        currency: d.currency,
        amountMinor: d.amountMinor,
        minorUnitsPerMajor: d.minorUnitsPerMajor,
        issuedAt: d.issuedAt?.toDate ? d.issuedAt.toDate().toISOString() : d.issuedAtIso || null,
        supersededBy: d.supersededBy || null,
    };
}

// ---------------------------------------------------------------------------
// POST /api/bookings/:bookingId/summary
// ---------------------------------------------------------------------------

async function ensureSummary(req, res) {
    const { uid } = req.authUser;
    const bookingId = String(req.params.bookingId || '');

    const booking = await loadOwnedBooking(bookingId, uid);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (rejectLegacyBooking(res, booking)) return;

    const fingerprint = bookingFingerprint(booking.data);

    // Reuse an unchanged current summary: a refresh must not mint a number.
    const currentQ = await db().collection(BOOKING_DOCUMENTS)
        .where('bookingId', '==', bookingId)
        .where('documentKind', '==', DOCUMENT_KIND.BOOKING_SUMMARY)
        .where('isCurrent', '==', true)
        .limit(1)
        .get();

    const current = currentQ.empty ? null : currentQ.docs[0];

    if (current && current.data().bookingFingerprint === fingerprint) {
        return res.status(200).json({
            summary: toCustomerSafeSummary(current.data()),
            reused: true,
        });
    }

    // Either the first summary, or the booking's stated facts changed: issue a
    // new VERSION under the SAME number. Historical versions are superseded,
    // never rewritten.
    const year = new Date().getUTCFullYear();
    const summaryId = `bs_${crypto.randomBytes(10).toString('hex')}`;
    const issuedAtIso = new Date().toISOString();

    let allocated;
    let attempt = 0;
    while (attempt < MAX_NUMBER_ATTEMPTS) {
        attempt += 1;
        try {
            allocated = await db().runTransaction(async (tx) => {
                let summaryNumber;
                let version;
                let counterRef = null;
                let nextSeq = null;

                if (current) {
                    // Same logical document, next version — no number consumed.
                    summaryNumber = current.data().summaryNumber;
                    version = Number(current.data().version || 1) + 1;
                } else {
                    const a = await allocateSummaryNumber(tx, year);
                    counterRef = a.ref;
                    nextSeq = a.next;
                    summaryNumber = a.number;
                    version = 1;

                    // Reserved in the counter's own collection, not alongside
                    // the documents: this is bookkeeping, and a summary query
                    // must never return it. The counter transaction already
                    // serialises allocation; this additionally catches reissue
                    // if the counter were ever restored from a backup.
                    const numberRef = db().collection(DOCUMENT_NUMBERS).doc(summaryNumber);
                    const taken = await tx.get(numberRef);
                    if (taken.exists) throw NUMBER_COLLISION;
                    tx.create(numberRef, {
                        reservedFor: summaryId,
                        bookingId,
                        documentKind: DOCUMENT_KIND.BOOKING_SUMMARY,
                        createdAt: serverTimestamp(),
                    });
                }

                if (counterRef) {
                    tx.set(counterRef, { lastSequence: nextSeq, updatedAt: serverTimestamp() }, { merge: true });
                }
                return { summaryNumber, version };
            });
            break;
        } catch (err) {
            if (err === NUMBER_COLLISION) continue;
            throw err;
        }
    }

    if (!allocated) {
        console.error('[pb4] exhausted summary number attempts for booking', bookingId);
        return res.status(503).json({ error: 'Could not allocate a summary number. Please retry.' });
    }

    const { summaryNumber, version } = allocated;

    // Render and store. A failure here must leave no metadata claiming a
    // document that does not exist.
    const storagePath = storagePathFor({ ownerUid: uid, bookingId, summaryId });
    let pdf;
    try {
        pdf = await renderSummaryPdf({
            booking: booking.data,
            summaryNumber,
            issuedAt: new Date(issuedAtIso).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
            }),
            version,
        });
        await deps().storage().bucket().file(storagePath).save(pdf, {
            contentType: 'application/pdf',
            resumable: false,
            metadata: { cacheControl: 'private, max-age=0, no-store' },
        });
    } catch (err) {
        console.error('[pb4] summary render/store failed:', err.message);
        return res.status(502).json({ error: 'The Booking Summary could not be produced. Please try again.' });
    }

    const record = {
        summaryId,
        bookingId,
        documentKind: DOCUMENT_KIND.BOOKING_SUMMARY,
        summaryNumber,
        version,
        isCurrent: true,
        bookingFingerprint: fingerprint,
        // Ownership copied from the booking, never from the request.
        customerId: booking.data.userId,
        storagePath,
        currency: booking.data.pricing?.currency || 'INR',
        amountMinor: booking.data.pricing?.grossAmountMinor ?? 0,
        minorUnitsPerMajor: booking.data.pricing?.minorUnitsPerMajor || 100,
        fileSize: pdf.length,
        issuedBy: 'system',
        issuedAt: serverTimestamp(),
        issuedAtIso,
        supersededBy: null,
    };

    const batch = db().batch();
    batch.set(db().collection(BOOKING_DOCUMENTS).doc(summaryId), record);
    if (current) {
        batch.update(current.ref, { isCurrent: false, supersededBy: summaryId, updatedAt: serverTimestamp() });
    }
    batch.set(db().collection(BOOKINGS).doc(bookingId).collection(ACTIVITY).doc(), {
        type: current ? 'BOOKING_SUMMARY_REISSUED' : 'BOOKING_SUMMARY_ISSUED',
        bookingId,
        summaryId,
        summaryNumber,
        version,
        actorId: uid,
        actorType: 'customer',
        at: serverTimestamp(),
    });
    await batch.commit();

    return res.status(current ? 200 : 201).json({
        summary: toCustomerSafeSummary({ ...record, issuedAt: null }),
        reused: false,
    });
}

// ---------------------------------------------------------------------------
// GET /api/bookings/:bookingId/summary
// ---------------------------------------------------------------------------

async function getSummary(req, res) {
    const { uid } = req.authUser;
    const bookingId = String(req.params.bookingId || '');

    const booking = await loadOwnedBooking(bookingId, uid);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (rejectLegacyBooking(res, booking)) return;

    const q = await db().collection(BOOKING_DOCUMENTS)
        .where('bookingId', '==', bookingId)
        .where('documentKind', '==', DOCUMENT_KIND.BOOKING_SUMMARY)
        .where('isCurrent', '==', true)
        .limit(1)
        .get();

    if (q.empty) return res.status(404).json({ error: 'No Booking Summary has been issued yet' });
    return res.status(200).json({ summary: toCustomerSafeSummary(q.docs[0].data()) });
}

// ---------------------------------------------------------------------------
// GET /api/bookings/:bookingId/summary/download
// ---------------------------------------------------------------------------

async function downloadSummary(req, res) {
    const { uid } = req.authUser;
    const bookingId = String(req.params.bookingId || '');

    const booking = await loadOwnedBooking(bookingId, uid);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (rejectLegacyBooking(res, booking)) return;

    const q = await db().collection(BOOKING_DOCUMENTS)
        .where('bookingId', '==', bookingId)
        .where('documentKind', '==', DOCUMENT_KIND.BOOKING_SUMMARY)
        .where('isCurrent', '==', true)
        .limit(1)
        .get();

    if (q.empty) return res.status(404).json({ error: 'No Booking Summary has been issued yet' });
    const meta = q.docs[0].data();

    // Streamed through the authenticated endpoint. No signed URL is minted and
    // no download token is created, so nothing durable can leak or be shared.
    let buf;
    try {
        [buf] = await deps().storage().bucket().file(meta.storagePath).download();
    } catch (err) {
        console.error('[pb4] summary download failed:', err.message);
        return res.status(502).json({ error: 'The Booking Summary could not be retrieved. Please try again.' });
    }

    res.status(200);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Booking_Summary_${meta.summaryNumber}.pdf"`);
    res.setHeader('Cache-Control', 'private, no-store');
    return res.send(buf);
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

function registerSummaryRoutes(app, requireFirebaseUser, asyncRoute, { limiter } = {}) {
    const mw = limiter ? [limiter, requireFirebaseUser] : [requireFirebaseUser];

    app.post(['/bookings/:bookingId/summary', '/api/bookings/:bookingId/summary'], ...mw, asyncRoute(ensureSummary));
    app.get(['/bookings/:bookingId/summary/download', '/api/bookings/:bookingId/summary/download'], ...mw, asyncRoute(downloadSummary));
    app.get(['/bookings/:bookingId/summary', '/api/bookings/:bookingId/summary'], ...mw, asyncRoute(getSummary));
}

module.exports = {
    DOCUMENT_KIND,
    SUMMARY_NUMBER,
    BOOKING_DOCUMENTS,
    DOCUMENT_NUMBERS,
    formatSummaryNumber,
    bookingFingerprint,
    storagePathFor,
    toCustomerSafeSummary,
    renderSummaryPdf,
    money,
    ensureSummary,
    getSummary,
    downloadSummary,
    registerSummaryRoutes,
    rejectLegacyBooking,
    __setDepsForTesting,
};
