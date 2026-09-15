/**
 * P0-05 — False-invoice containment regression.
 *
 * The admin booking panel used to build a payment object from
 * hardcoded fallbacks and feed it to a PDF generator headed as an amount
 * received. Because the paid-amount field is never written by any code path,
 * every document it produced declared a payment that had not happened.
 *
 * These are source-level assertions. That is deliberate: the property under
 * test is the ABSENCE of a code path, and no behavioural test can prove
 * absence — it can only fail to find the path on the inputs it happens to try.
 *
 * Run: npm run test:p0-05
 */

import { readFileSync, existsSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

const ADMIN_BOOKINGS = read('../src/components/admin/dashboard/Bookings.jsx');
const GENERATOR_PATH = new URL('../src/services/InvoiceGenerator.js', import.meta.url);

// ---------------------------------------------------------------------------
// The fabricated payment is gone
// ---------------------------------------------------------------------------

test('the hardcoded payment-amount fallback is gone from the booking panel', () => {
    assert.ok(
        !ADMIN_BOOKINGS.includes('amountPaid || 1000'),
        'the admin booking panel must not default a paid amount to a hardcoded figure',
    );
    // Guard the shape, not just that one literal, so a different constant fails too.
    assert.doesNotMatch(
        ADMIN_BOOKINGS,
        /amountPaid\s*\|\|\s*\d+/,
        'no numeric fallback may stand in for an unrecorded payment',
    );
});

test('the default "success" payment state is gone from the booking panel', () => {
    assert.ok(
        !ADMIN_BOOKINGS.includes("paymentStatus || 'success'"),
        'payment status must never default to success',
    );
    assert.doesNotMatch(
        ADMIN_BOOKINGS,
        /paymentStatus\s*\|\|\s*['"]?(success|paid|Paid|PAID)['"]?/,
        'payment status must not default to any paid-like value',
    );
});

test('a zero-amount receipt was not substituted for the fabricated one', () => {
    // Printing a 0 receipt would still be a receipt for a payment that does
    // not exist. The action had to be withdrawn, not reworded.
    assert.doesNotMatch(ADMIN_BOOKINGS, /amount:\s*0\b/, 'no zero-amount payment object may be constructed');
});

// ---------------------------------------------------------------------------
// The legacy generator is unreachable from the booking surface
// ---------------------------------------------------------------------------

test('the admin booking panel no longer imports or calls the legacy generator', () => {
    assert.ok(!ADMIN_BOOKINGS.includes('generateInvoicePDF'), 'the generator must not be referenced');
    assert.ok(!ADMIN_BOOKINGS.includes('InvoiceGenerator'), 'the module must not be imported');
    assert.ok(!ADMIN_BOOKINGS.includes('handleDownloadInvoice'), 'the handler must be removed');
    assert.ok(!ADMIN_BOOKINGS.includes('IY_Invoice_'), 'no invoice file may be saved');
});

test('no booking surface can print amount-received language', () => {
    for (const forbidden of ['BOOKING AMOUNT RECEIVED', 'AMOUNT RECEIVED', 'Token Paid', 'PAYMENT RECEIPT']) {
        assert.ok(
            !ADMIN_BOOKINGS.includes(forbidden),
            `the booking panel must not contain "${forbidden}"`,
        );
    }
});

test('the withdrawn action is explained rather than silently missing', () => {
    assert.match(
        ADMIN_BOOKINGS,
        /Booking Summary will be available after the booking-document upgrade/,
        'staff should be told why the action is gone',
    );
    // and it must not be clickable
    assert.doesNotMatch(
        ADMIN_BOOKINGS,
        /onClick=\{handleDownloadInvoice\}/,
        'the replacement must not be an action',
    );
});

// ---------------------------------------------------------------------------
// Honest handling of the fields that remain
// ---------------------------------------------------------------------------

test('exports report an unrecorded payment as absent, not as a number', () => {
    assert.match(
        ADMIN_BOOKINGS,
        /'Amount Paid':\s*b\.amountPaid\s*\?\s*`₹\$\{b\.amountPaid\}`\s*:\s*'N\/A'/,
        'the export must show N/A when no payment is recorded',
    );
});

test('payment status falls back to PENDING, never to a paid-like value', () => {
    assert.match(ADMIN_BOOKINGS, /paymentStatus\?\.toUpperCase\(\)\s*\|\|\s*'PENDING'/);
});

test('the stored payment-backed invoice link is preserved and still conditional', () => {
    // This is a real document produced by a real Razorpay payment, rendered
    // only when the booking actually carries one. It is not the fabrication
    // and must survive containment.
    assert.match(ADMIN_BOOKINGS, /\{booking\.invoice_url\s*&&\s*\(/);
    assert.match(ADMIN_BOOKINGS, /href=\{booking\.invoice_url\}/);
});

// ---------------------------------------------------------------------------
// Repository-wide: nothing else reaches the generator
// ---------------------------------------------------------------------------

test('the legacy generator has no remaining callers anywhere in src/', async () => {
    const { execSync } = await import('node:child_process');
    const root = new URL('..', import.meta.url).pathname;
    const hits = execSync(
        `grep -rln "generateInvoicePDF\\|InvoiceGenerator" "${root}/src" || true`,
        { encoding: 'utf8' },
    )
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        // The module defining the function is not a caller.
        .filter((f) => !f.endsWith('services/InvoiceGenerator.js'));

    assert.deepEqual(hits, [], `unexpected callers still reference the legacy generator: ${hits.join(', ')}`);
});

test('the generator module is left in place, unreferenced, for PB-4 to replace', () => {
    // Deliberately not deleted: containment removes reachability, and PB-4
    // decides what replaces it. Deleting it here would widen a security patch
    // into a refactor.
    assert.ok(existsSync(GENERATOR_PATH), 'InvoiceGenerator.js should remain on disk, simply unreachable');
});
