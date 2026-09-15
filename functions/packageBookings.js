/**
 * PB-1 — Secure package booking foundation.
 *
 *   POST /api/bookings/package   create a booking (server-authoritative)
 *   GET  /api/bookings/:id       read your own booking (customer-safe)
 *
 * SECURITY MODEL
 * The Firebase Admin SDK bypasses Firestore Security Rules entirely. Every
 * authorization decision for these routes is therefore made in this file, in
 * server code — Firestore rules protect the *client* SDK path only and must not
 * be relied on here. Specifically:
 *
 *   - Identity comes from a verified Firebase ID token and nothing else.
 *     `userId` is taken from `decoded.uid`; a `userId` in the request body is
 *     rejected outright by the validator's unknown-key check.
 *   - Ownership on read is enforced by comparing the stored `userId` against
 *     the verified uid before any booking data is serialised.
 *   - Price is computed from the canonical package document. No client-supplied
 *     amount is read, defaulted to, or fallen back on at any point.
 *
 * PB-1 bookings are always UNPAID. No payment is taken, no gateway is called.
 */

'use strict';

const crypto = require('crypto');

const {
    PricingError,
    toMajor,
    isPackageBookable,
    validateDeparture,
    validateTravellerCount,
    resolveBundledHotelMinor,
    computeBookingPrice,
} = require('./packageBookingPricing');

const { generateCandidate } = require('./packageBookingReference');
const { validateCreateBookingRequest } = require('./packageBookingValidation');
const { registerDocumentRoutes } = require('./packageBookingDocuments');

const BOOKINGS = 'bookings';
const REFERENCES = 'booking_references';
const IDEMPOTENCY = 'booking_idempotency';
const ACTIVITY = 'activity'; // subcollection of a booking

/** Canonical status vocabularies. Booking, payment and document state are separate concerns. */
const BOOKING_STATUS = {
    SUBMITTED: 'SUBMITTED',
    UNDER_REVIEW: 'UNDER_REVIEW',
    CONFIRMED: 'CONFIRMED',
    CANCELLED: 'CANCELLED',
    COMPLETED: 'COMPLETED',
};
const PAYMENT_STATUS = {
    UNPAID: 'UNPAID',
    PARTIALLY_PAID: 'PARTIALLY_PAID',
    FULLY_PAID: 'FULLY_PAID',
};
const DOCUMENT_STATUS = {
    NOT_REQUIRED: 'NOT_REQUIRED',
    PENDING: 'PENDING',
    PARTIAL: 'PARTIAL',
    COMPLETE: 'COMPLETE',
};

const MAX_REFERENCE_ATTEMPTS = 5;

/** Sentinel used to force a transaction retry when a reference candidate collides. */
const REFERENCE_COLLISION = Symbol('REFERENCE_COLLISION');

/**
 * Firebase dependency seam.
 *
 * firebase-admin is required lazily so these handlers can be driven against an
 * in-memory store in tests without the SDK being installed or initialised.
 * Production behaviour is unchanged: on first use in the deployed Function the
 * real SDK is resolved exactly once.
 */
let _deps = null;

function deps() {
    if (_deps) return _deps;
    const admin = require('firebase-admin');
    const { FieldValue } = require('firebase-admin/firestore');
    _deps = {
        firestore: () => admin.firestore(),
        auth: () => admin.auth(),
        serverTimestamp: () => FieldValue.serverTimestamp(),
    };
    return _deps;
}

/** Test-only: inject a firestore/auth double. Never called in production code. */
function __setDepsForTesting(injected) {
    _deps = injected;
}

function db() {
    return deps().firestore();
}

function serverTimestamp() {
    return deps().serverTimestamp();
}

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

/**
 * Verify the Firebase ID token and attach the derived identity.
 *
 * The uid is read from the verified token only. Nothing from the body, query
 * string, localStorage-backed header, or Firestore profile influences it.
 */
async function requireFirebaseUser(req, res, next) {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    const idToken = header.slice(7).trim();
    if (!idToken) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const decoded = await deps().auth().verifyIdToken(idToken);
        req.authUser = { uid: decoded.uid, email: decoded.email || null };
        return next();
    } catch (err) {
        console.warn('[pb1] ID token verification failed:', err.code || err.message);
        return res.status(401).json({ error: 'Invalid or expired authentication token' });
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Stable per-traveller id, assigned server-side at booking creation (PB-3). */
function newTravellerId() {
    return `tr_${crypto.randomBytes(6).toString('hex')}`;
}

function idempotencyDocId(uid, key) {
    return crypto.createHash('sha256').update(`${uid}:${key}`).digest('hex');
}

/**
 * Build the package snapshot stored on the booking.
 *
 * Deliberately field-by-field, never a spread of the package document: the
 * package holds private commercial data (`costPrice`, `tokenPrice`, and
 * `pickupLocations[].b2bPrice`) which must never be copied into a booking that
 * the customer can read back. See audit finding P0-01.
 */
function buildPackageSnapshot(pkg, pricing) {
    return {
        packageId: pkg.id,
        title: pkg.title || null,
        slug: pkg.slug || pkg.id,
        location: pkg.location || null,
        duration: pkg.duration || null,
        difficulty: pkg.difficulty || null,
        departureType: pkg.departureType || null,
        pickupDrop: pkg.pickupDrop || null,
        pickupLocation: pricing.pickupLocation,
        inclusions: Array.isArray(pkg.inclusions) ? pkg.inclusions.slice(0, 50) : [],
        exclusions: Array.isArray(pkg.exclusions) ? pkg.exclusions.slice(0, 50) : [],
        cancellationPolicy: Array.isArray(pkg.cancellationPolicy) ? pkg.cancellationPolicy.slice(0, 20) : [],
        generalPolicy: typeof pkg.generalPolicy === 'string' ? pkg.generalPolicy.slice(0, 4000) : null,
        // Retail unit price only. Cost and margin are never snapshotted.
        unitPriceMinor: pricing.unitPriceMinor,
        currency: pricing.currency,
        snapshotAt: new Date().toISOString(),
    };
}

/**
 * Project a stored booking into the customer-safe shape.
 *
 * Allowlist, not denylist: only these fields are ever returned. A future field
 * added to the booking document is invisible to customers until it is named
 * here, so internal notes, supplier cost, margin or audit data cannot leak by
 * being forgotten.
 */
function toCustomerSafeBooking(id, data) {
    const p = data.pricing || {};
    return {
        id,
        bookingReference: data.bookingReference,
        packageId: data.packageId,
        package: {
            title: data.packageSnapshot?.title ?? null,
            slug: data.packageSnapshot?.slug ?? null,
            location: data.packageSnapshot?.location ?? null,
            duration: data.packageSnapshot?.duration ?? null,
            pickupLocation: data.packageSnapshot?.pickupLocation ?? null,
            inclusions: data.packageSnapshot?.inclusions ?? [],
            exclusions: data.packageSnapshot?.exclusions ?? [],
            cancellationPolicy: data.packageSnapshot?.cancellationPolicy ?? [],
        },
        departureDate: data.departureDate,
        travellerCount: data.travellerCount,
        customer: data.customer,
        travellers: data.travellers || [],
        specialRequests: data.specialRequests || '',
        hotelBundle: data.hotelBundle
            ? {
                  hotelId: data.hotelBundle.hotelId,
                  hotelName: data.hotelBundle.hotelName,
                  roomName: data.hotelBundle.roomName,
              }
            : null,
        pricing: {
            currency: p.currency,
            minorUnitsPerMajor: p.minorUnitsPerMajor,
            unitPriceMinor: p.unitPriceMinor,
            tourAmountMinor: p.tourAmountMinor,
            hotelAmountMinor: p.hotelAmountMinor,
            hotelDiscountMinor: p.hotelDiscountMinor,
            grossAmountMinor: p.grossAmountMinor,
        },
        payment: {
            paymentPlan: data.paymentPlan,
            paymentStatus: data.paymentStatus,
            amountReceivedMinor: data.amountReceivedMinor,
            balanceAmountMinor: data.balanceAmountMinor,
        },
        bookingStatus: data.bookingStatus,
        documentStatus: data.documentStatus,
        source: data.source,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : null,
    };
}

// ---------------------------------------------------------------------------
// POST /api/bookings/package
// ---------------------------------------------------------------------------

async function createPackageBooking(req, res) {
    const { uid } = req.authUser;

    const parsed = validateCreateBookingRequest(req.body);
    if (!parsed.ok) {
        return res.status(400).json({ error: 'Validation failed', details: parsed.errors });
    }
    const input = parsed.value;

    // --- 1. Load the canonical package (catalogue read, outside the transaction) ---
    const pkgSnap = await db().collection('packages').doc(input.packageId).get();
    if (!pkgSnap.exists) {
        return res.status(404).json({ error: 'Package not found' });
    }
    const pkg = { id: pkgSnap.id, ...pkgSnap.data() };

    if (!isPackageBookable(pkg)) {
        return res.status(409).json({ error: 'This package is not currently available for booking' });
    }

    // --- 2. Validate the requested selection against the package ---
    const countCheck = validateTravellerCount(pkg, input.travellerCount);
    if (!countCheck.valid) {
        return res.status(400).json({ error: 'Validation failed', details: [countCheck.reason] });
    }

    const departureCheck = validateDeparture(pkg, input.departureDate, input.travellerCount);
    if (!departureCheck.valid) {
        return res.status(400).json({ error: 'Validation failed', details: [departureCheck.reason] });
    }

    // --- 3. Resolve the optional hotel bundle from canonical data ---
    let resolvedHotel = null;
    let hotelDoc = null;
    if (input.hotelBundle) {
        const hotelSnap = await db().collection('hotels').doc(input.hotelBundle.hotelId).get();
        if (!hotelSnap.exists) {
            return res.status(404).json({ error: 'Bundled hotel not found' });
        }
        hotelDoc = { id: hotelSnap.id, ...hotelSnap.data() };
        if (hotelDoc.isVisible === false) {
            return res.status(409).json({ error: 'Bundled hotel is not currently available' });
        }
        try {
            resolvedHotel = resolveBundledHotelMinor(hotelDoc, input.hotelBundle.roomId);
        } catch (err) {
            if (err instanceof PricingError) {
                return res.status(400).json({ error: 'Validation failed', details: [err.message] });
            }
            throw err;
        }
    }

    // --- 4. Compute the authoritative price ---
    let pricing;
    try {
        pricing = computeBookingPrice(
            pkg,
            { travellerCount: input.travellerCount, pickupLocationIndex: input.pickupLocationIndex },
            resolvedHotel,
        );
    } catch (err) {
        if (err instanceof PricingError) {
            const status = err.code === 'INVALID_PICKUP' ? 400 : 409;
            return res.status(status).json({ error: 'Pricing failed', details: [err.message] });
        }
        throw err;
    }

    // --- 5. Create atomically: idempotency + reference reservation + booking + activity ---
    const idemRef = db().collection(IDEMPOTENCY).doc(idempotencyDocId(uid, input.idempotencyKey));
    const packageSnapshot = buildPackageSnapshot(pkg, pricing);

    // PB-3: give every traveller a stable id so uploaded documents attach to a
    // person rather than to an array position, which would silently re-point if
    // the list were ever reordered.
    const travellers = input.travellers.map((t) => ({ ...t, travellerId: newTravellerId() }));

    let attempt = 0;
    let result;

    while (attempt < MAX_REFERENCE_ATTEMPTS) {
        attempt += 1;
        const candidateRef = generateCandidate();

        try {
            result = await db().runTransaction(async (tx) => {
                // All reads first — Firestore requires reads to precede writes.
                const idemSnap = await tx.get(idemRef);
                if (idemSnap.exists) {
                    const existingId = idemSnap.data().bookingId;
                    const existingSnap = await tx.get(db().collection(BOOKINGS).doc(existingId));
                    if (existingSnap.exists) {
                        return { replayed: true, id: existingSnap.id, data: existingSnap.data() };
                    }
                    // Idempotency record without a booking should not happen; fall
                    // through and create, keyed to the same idempotency document.
                }

                const refDocRef = db().collection(REFERENCES).doc(candidateRef);
                const refSnap = await tx.get(refDocRef);
                if (refSnap.exists) throw REFERENCE_COLLISION;

                // --- writes ---
                const bookingRef = db().collection(BOOKINGS).doc();

                const booking = {
                    // identity — userId is derived from the verified token, never the body
                    userId: uid,
                    bookingReference: candidateRef,

                    // package + immutable snapshot
                    packageId: pkg.id,
                    packageSnapshot,

                    // selection
                    departureDate: input.departureDate,
                    travellerCount: input.travellerCount,
                    pickupLocationIndex: input.pickupLocationIndex,

                    // contact snapshot (ownership lives in userId, not here)
                    customer: input.customer,
                    travellers,
                    specialRequests: input.specialRequests,

                    hotelBundle: resolvedHotel
                        ? {
                              hotelId: hotelDoc.id,
                              hotelName: hotelDoc.name || null,
                              roomId: resolvedHotel.roomId,
                              roomName: resolvedHotel.roomName,
                              roomPriceMinor: resolvedHotel.roomPriceMinor,
                          }
                        : null,

                    // authoritative money, integer minor units
                    pricing,
                    amountReceivedMinor: 0,
                    balanceAmountMinor: pricing.grossAmountMinor,

                    // separated status dimensions
                    bookingStatus: BOOKING_STATUS.SUBMITTED,
                    paymentStatus: PAYMENT_STATUS.UNPAID,
                    documentStatus: DOCUMENT_STATUS.PENDING,
                    paymentPlan: input.paymentPlan,

                    // attribution
                    source: input.source,
                    channel: input.channel || null,

                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),

                    // --- transition compatibility (see IY_PACKAGE_BOOKING_IMPLEMENTATION.md) ---
                    // The existing admin UI reads these legacy field names. They are
                    // written so PB-1 bookings remain visible in the current admin
                    // panel, and are retired in PB-5 once the admin UI reads the
                    // canonical fields above. They are derived, never authoritative.
                    schemaVersion: 2,
                    status: 'pending',
                    packageTitle: pkg.title || null,
                    bookingDate: input.departureDate,
                    travelers: input.travellerCount,
                    contactName: input.customer.name,
                    contactEmail: input.customer.email,
                    contactPhone: input.customer.phone,
                    travelersList: travellers,
                    totalPrice: toMajor(pricing.grossAmountMinor),
                    tourAmount: toMajor(pricing.tourAmountMinor),
                    hotelAmount: toMajor(pricing.hotelAmountMinor),
                    pickupLocation: pricing.pickupLocation,
                    bundledHotelId: resolvedHotel ? hotelDoc.id : null,
                    bundledHotelName: resolvedHotel ? hotelDoc.name || null : null,
                };

                tx.create(refDocRef, {
                    bookingId: bookingRef.id,
                    userId: uid,
                    createdAt: serverTimestamp(),
                });
                tx.create(bookingRef, booking);

                // Audit foundation. No traveller document content is ever recorded here.
                tx.create(bookingRef.collection(ACTIVITY).doc(), {
                    type: 'BOOKING_SUBMITTED',
                    bookingId: bookingRef.id,
                    actorId: uid,
                    actorType: 'customer',
                    source: input.source,
                    at: serverTimestamp(),
                });

                tx.set(idemRef, {
                    bookingId: bookingRef.id,
                    userId: uid,
                    createdAt: serverTimestamp(),
                });

                return { replayed: false, id: bookingRef.id, data: booking };
            });

            break; // transaction committed
        } catch (err) {
            if (err === REFERENCE_COLLISION) continue; // retry with a fresh reference
            throw err;
        }
    }

    if (!result) {
        console.error('[pb1] exhausted booking reference attempts for uid', uid);
        return res.status(503).json({ error: 'Could not allocate a booking reference. Please retry.' });
    }

    // A replayed request returns the original booking and 200, so a retried
    // network call is indistinguishable from success without creating a duplicate.
    const stored = result.replayed
        ? result.data
        : { ...result.data, createdAt: null, updatedAt: null }; // serverTimestamp not yet resolved locally

    return res.status(result.replayed ? 200 : 201).json({
        booking: toCustomerSafeBooking(result.id, stored),
        idempotentReplay: result.replayed,
    });
}

// ---------------------------------------------------------------------------
// GET /api/bookings/:bookingId
// ---------------------------------------------------------------------------

async function getOwnBooking(req, res) {
    const { uid } = req.authUser;
    const bookingId = String(req.params.bookingId || '');

    if (!/^[A-Za-z0-9_-]{1,128}$/.test(bookingId)) {
        return res.status(400).json({ error: 'Invalid booking id' });
    }

    const snap = await db().collection(BOOKINGS).doc(bookingId).get();

    // Same response for "absent" and "not yours" so the endpoint cannot be used
    // to probe which booking ids exist.
    if (!snap.exists || snap.data().userId !== uid) {
        return res.status(404).json({ error: 'Booking not found' });
    }

    return res.status(200).json({ booking: toCustomerSafeBooking(snap.id, snap.data()) });
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

/**
 * Register PB-1 routes on the existing Functions Express app.
 *
 * Both the bare and `/api`-prefixed paths are registered, matching the existing
 * convention at functions/index.js:255 — the Vite dev proxy strips `/api` while
 * the Firebase Hosting rewrite preserves it.
 */
function registerPackageBookingRoutes(app, { createLimiter, readLimiter } = {}) {
    const createMw = [requireFirebaseUser];
    if (createLimiter) createMw.unshift(createLimiter);

    const readMw = [requireFirebaseUser];
    if (readLimiter) readMw.unshift(readLimiter);

    app.post(['/bookings/package', '/api/bookings/package'], ...createMw, asyncRoute(createPackageBooking));

    // PB-3 document routes. Registered before the single-segment booking read
    // so the more specific paths are visibly matched first.
    registerDocumentRoutes(app, requireFirebaseUser, asyncRoute, { limiter: readLimiter });

    app.get(['/bookings/:bookingId', '/api/bookings/:bookingId'], ...readMw, asyncRoute(getOwnBooking));
}

/** Wrap an async handler so a rejection becomes a clean 500, never a leaked stack trace. */
function asyncRoute(handler) {
    return (req, res) => {
        Promise.resolve(handler(req, res)).catch((err) => {
            console.error('[pb1] unhandled error:', err);
            if (!res.headersSent) res.status(500).json({ error: 'Internal server error' });
        });
    };
}

module.exports = {
    BOOKING_STATUS,
    PAYMENT_STATUS,
    DOCUMENT_STATUS,
    requireFirebaseUser,
    createPackageBooking,
    getOwnBooking,
    registerPackageBookingRoutes,
    toCustomerSafeBooking,
    buildPackageSnapshot,
    idempotencyDocId,
    newTravellerId,
    __setDepsForTesting,
};
