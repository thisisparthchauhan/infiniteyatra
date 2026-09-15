/**
 * CUTOVER — runtime capability gate for the PB booking API.
 *
 * Production Firebase Storage is not provisioned yet. Booking creation and
 * booking reads do not need it; traveller documents (PB-3) and the Booking
 * Summary PDF (PB-4) do — both write objects to a bucket.
 *
 * FAILS CLOSED IN PRODUCTION. If the flag is unset on a real Functions runtime
 * the storage-backed features are OFF, because the failure mode of guessing
 * "on" is a customer uploading a passport scan into a bucket that does not
 * exist. In the emulator and in tests the default is ON, so the existing PB-3
 * and PB-4 suites keep exercising the real code paths.
 *
 * Set PB_STORAGE_ENABLED=true only once the bucket genuinely exists.
 */

'use strict';

/** A real deployed Functions runtime, as opposed to the emulator or a test. */
function isProductionRuntime(env = process.env) {
    // The emulator sets FUNCTIONS_EMULATOR; it also sets K_SERVICE, so it must
    // be checked first or the emulator would be mistaken for production.
    if (env.FUNCTIONS_EMULATOR === 'true') return false;
    if (env.NODE_ENV === 'test') return false;
    return env.NODE_ENV === 'production'
        || Boolean(env.K_SERVICE)
        || Boolean(env.FUNCTION_TARGET);
}

/**
 * Is object storage available for traveller documents and summary PDFs?
 * Explicit 'true'/'false' always wins; otherwise production says no.
 */
function isStorageEnabled(env = process.env) {
    const flag = env.PB_STORAGE_ENABLED;
    if (flag === 'true') return true;
    if (flag === 'false') return false;
    return !isProductionRuntime(env);
}

/** What the client may render. Sent by /health and by the booking read. */
function capabilities(env = process.env) {
    const storage = isStorageEnabled(env);
    return {
        // Creating and reading bookings never depends on storage.
        bookingCreate: true,
        bookingRead: true,
        // Both of these put an object in a bucket.
        documentUpload: storage,
        bookingSummary: storage,
    };
}

const STORAGE_UNAVAILABLE = 'BOOKING_STORAGE_UNAVAILABLE';

/**
 * Express guard for the storage-backed routes. 503, not 500: the feature is
 * temporarily unavailable rather than broken, and the message says nothing
 * about buckets, projects or billing.
 */
function requireStorage(env = process.env) {
    return function storageGuard(req, res, next) {
        if (isStorageEnabled(env)) return next();
        return res.status(503).json({
            code: STORAGE_UNAVAILABLE,
            error: 'This feature is temporarily unavailable.',
        });
    };
}

module.exports = {
    isProductionRuntime,
    isStorageEnabled,
    capabilities,
    requireStorage,
    STORAGE_UNAVAILABLE,
};
