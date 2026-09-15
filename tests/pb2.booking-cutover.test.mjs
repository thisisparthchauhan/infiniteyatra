/**
 * PB-2 — Customer booking API cutover tests.
 *
 * Two kinds of test here, both real:
 *
 *   1. Behavioural — the actual API client runs with an injected token provider
 *      and fetch double, so every assertion about what crosses the wire
 *      (headers, payload keys, idempotency reuse, retry behaviour) exercises
 *      production code paths.
 *
 *   2. Structural — assertions against the real source of the booking page and
 *      success page, proving the direct Firestore create is gone and the
 *      success page no longer depends solely on router state. These are the
 *      honest way to verify a removal; a behavioural test cannot prove the
 *      absence of a code path.
 *
 * Run: npm run test:pb2
 */

import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const {
    buildCreateBookingPayload,
    newIdempotencyKey,
    toCustomerMessage,
    stepForError,
    createPackageBooking,
    getMyBooking,
    BookingApiError,
    __setDepsForTesting,
} = await import('../src/services/packageBookingApi.js');

const src = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const BOOKING_PAGE = src('../src/pages/BookingPage.jsx');
const SUCCESS_PAGE = src('../src/pages/BookingSuccess.jsx');
const LOGIN_PAGE = src('../src/pages/Login.jsx');

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

function harness({ token = 'id-token-abc', responses = [] } = {}) {
    const calls = [];
    let i = 0;
    __setDepsForTesting({
        getIdToken: async () => {
            if (token instanceof Error) throw token;
            return token;
        },
        fetch: async (url, init) => {
            calls.push({ url, init, body: init.body ? JSON.parse(init.body) : null });
            const next = responses[Math.min(i, responses.length - 1)];
            i += 1;
            if (next instanceof Error) throw next;
            return {
                ok: next.ok ?? true,
                status: next.status ?? 200,
                json: async () => next.json,
            };
        },
        baseUrl: '',
    });
    return calls;
}

const PKG = { id: 'himalaya-trek', title: 'Himalaya Trek', price: 15000 };

const BOOKING_DATA = {
    date: '2026-05-15',
    travelers: 2,
    name: 'Alice Kapoor',
    email: 'alice@example.com',
    phone: '919876543210',
    specialRequests: 'Vegetarian meals',
    travelersList: [
        { firstName: 'Alice', lastName: 'Kapoor', dob: '1990-01-01', gender: 'Female', nationality: 'India', contactNumbers: ['919876543210'], emergencyContacts: [] },
        { firstName: 'Ravi', lastName: 'Kapoor', dob: '1988-02-02', gender: 'Male', nationality: 'India', contactNumbers: [], emergencyContacts: [] },
    ],
};

const serverBooking = (over = {}) => ({
    id: 'bk-server-1',
    bookingReference: 'IY-BKG-2026-7K4MQP',
    packageId: 'himalaya-trek',
    package: { title: 'Himalaya Trek' },
    departureDate: '2026-05-15',
    travellerCount: 2,
    pricing: { currency: 'INR', minorUnitsPerMajor: 100, grossAmountMinor: 3000000 },
    payment: { paymentPlan: 'UNDECIDED', paymentStatus: 'UNPAID', amountReceivedMinor: 0, balanceAmountMinor: 3000000 },
    bookingStatus: 'SUBMITTED',
    documentStatus: 'PENDING',
    ...over,
});

const okCreate = (over) => ({ ok: true, status: 201, json: { booking: serverBooking(over), idempotentReplay: false } });

const payload = (key = 'bk-test-key-0000000000000000') =>
    buildCreateBookingPayload({ pkg: PKG, bookingData: BOOKING_DATA, selectedLocIdx: 0, selectedHotel: null, idempotencyKey: key });

// ---------------------------------------------------------------------------
// [1] Login required at final submit
// ---------------------------------------------------------------------------

test('[1] an unauthenticated submit surfaces a sign-in message, not a crash', async () => {
    harness({ token: new BookingApiError('AUTH_REQUIRED', { status: 401, serverError: 'AUTH_REQUIRED' }) });
    await assert.rejects(() => createPackageBooking(payload()), (err) => {
        assert.equal(toCustomerMessage(err), 'Please sign in to complete your booking.');
        return true;
    });
});

test('[1b] the booking page sends an expired session to login, preserving the return path', () => {
    assert.match(BOOKING_PAGE, /if \(!currentUser\)/, 'submit must check auth');
    assert.match(BOOKING_PAGE, /navigate\('\/login',\s*\{\s*state:\s*\{\s*from:\s*location\s*\}\s*\}\)/,
        'must redirect to login carrying the return location');
    assert.match(BOOKING_PAGE, /Please sign in to complete your booking/);
    // …and Login must honour it, otherwise the customer lands on the homepage.
    assert.match(LOGIN_PAGE, /location\.state\?\.from/, 'Login must read the saved return path');
    assert.match(LOGIN_PAGE, /navigate\(redirectTo/, 'Login must navigate to the saved return path');
});

test('[1c] the login redirect only accepts in-app paths', () => {
    assert.match(LOGIN_PAGE, /startsWith\('\/'\)/, 'an off-site `from` must not be honoured');
});

// ---------------------------------------------------------------------------
// [2] Firebase ID token
// ---------------------------------------------------------------------------

test('[2] the request carries the Firebase ID token as a bearer header', async () => {
    const calls = harness({ token: 'id-token-abc', responses: [okCreate()] });
    await createPackageBooking(payload());

    assert.equal(calls.length, 1);
    assert.equal(calls[0].init.headers.Authorization, 'Bearer id-token-abc');
    assert.equal(calls[0].init.method, 'POST');
    assert.match(calls[0].url, /\/api\/bookings\/package$/);
});

// ---------------------------------------------------------------------------
// [3][4][5] Authoritative fields are never sent
// ---------------------------------------------------------------------------

test('[3][4][5] the payload contains no owner, price, status or reference field', async () => {
    const calls = harness({ responses: [okCreate()] });
    await createPackageBooking(payload());
    const sent = calls[0].body;

    const forbidden = [
        'userId', 'customerId', 'ownerId', 'uid', 'role',
        'totalPrice', 'grossAmountMinor', 'tourAmount', 'hotelAmount', 'amount', 'pricing',
        'paymentStatus', 'bookingStatus', 'documentStatus',
        'amountReceivedMinor', 'balanceAmountMinor',
        'bookingReference', 'createdAt', 'adminNotes', 'internalNotes', 'costPrice', 'margin',
    ];
    for (const key of forbidden) {
        assert.ok(!(key in sent), `payload must not contain "${key}"`);
    }

    // and nothing nested carries a price either
    const flat = JSON.stringify(sent);
    assert.ok(!flat.includes('15000'), 'no catalogue price may be echoed back');
    assert.ok(!flat.includes('30000'), 'no computed total may be sent');
});

test('[3b] the payload sends only the keys the server contract accepts', async () => {
    const calls = harness({ responses: [okCreate()] });
    await createPackageBooking(payload());
    const allowed = new Set([
        'packageId', 'departureDate', 'travellerCount', 'pickupLocationIndex',
        'customer', 'travellers', 'specialRequests', 'hotelBundle',
        'paymentPlan', 'idempotencyKey', 'source', 'channel',
    ]);
    for (const key of Object.keys(calls[0].body)) {
        assert.ok(allowed.has(key), `unexpected payload key "${key}"`);
    }
});

test('[3c] customer contact is a snapshot only — ownership is not derived from it', async () => {
    const calls = harness({ responses: [okCreate()] });
    await createPackageBooking(payload());
    assert.deepEqual(Object.keys(calls[0].body.customer).sort(), ['email', 'name', 'phone']);
});

test('[3d] traveller entries carry no document content', async () => {
    const withFiles = {
        ...BOOKING_DATA,
        travelersList: [
            { ...BOOKING_DATA.travelersList[0], docFiles: { aadhaar_Front: { name: 'x.jpg' } }, docPreviews: { aadhaar_Front: 'blob:x' }, selectedDocType: 'aadhaar' },
            BOOKING_DATA.travelersList[1],
        ],
    };
    const calls = harness({ responses: [okCreate()] });
    await createPackageBooking(
        buildCreateBookingPayload({ pkg: PKG, bookingData: withFiles, idempotencyKey: 'bk-k-0000000000000000' }),
    );
    const flat = JSON.stringify(calls[0].body);
    for (const leak of ['docFiles', 'docPreviews', 'blob:', 'base64', 'aadhaar']) {
        assert.ok(!flat.includes(leak), `payload must not contain "${leak}"`);
    }
});

// ---------------------------------------------------------------------------
// [6][7][8] Server response is the source of truth
// ---------------------------------------------------------------------------

test('[6][7][8] the server booking reference, total and UNPAID status come back intact', async () => {
    harness({ responses: [okCreate()] });
    const { booking } = await createPackageBooking(payload());

    assert.equal(booking.bookingReference, 'IY-BKG-2026-7K4MQP');
    assert.match(booking.bookingReference, /^IY-BKG-\d{4}-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{6}$/);
    assert.equal(booking.pricing.grossAmountMinor / booking.pricing.minorUnitsPerMajor, 30000);
    assert.equal(booking.payment.paymentStatus, 'UNPAID');
    assert.equal(booking.payment.amountReceivedMinor, 0);
    assert.equal(booking.bookingStatus, 'SUBMITTED');
});

test('[6b] the success page renders the server reference and payment status', () => {
    assert.match(SUCCESS_PAGE, /booking\?\.bookingReference/, 'reference must come from the server booking');
    assert.match(SUCCESS_PAGE, /Booking Reference/);
    assert.match(SUCCESS_PAGE, /paymentStatus/);
    assert.match(SUCCESS_PAGE, /booking\?\.payment\?\.paymentStatus \|\| 'UNPAID'/);
});

test('[8b] no paid/receipt/gateway language appears on the confirmation', () => {
    for (const forbidden of ['Razorpay', 'razorpay', 'Payment Successful', 'Transaction ID', 'PAID</']) {
        assert.ok(!SUCCESS_PAGE.includes(forbidden), `success page must not contain "${forbidden}"`);
    }

    // PB-4 moved document generation to the server, so the confirmation page no
    // longer composes a financial document at all. The "not a payment receipt"
    // wording now lives in the server renderer, where PB-4's own tests assert it
    // against the actually-rendered PDF rather than against source text.
    for (const clientPdf of ['jsPDF', 'jspdf', 'autoTable']) {
        assert.ok(!SUCCESS_PAGE.includes(clientPdf),
            `the confirmation page must not generate a document client-side (found "${clientPdf}")`);
    }
    const SUMMARY_RENDERER = src('../functions/packageBookingSummary.js');
    assert.ok(SUMMARY_RENDERER.includes('Not a payment receipt'),
        'the server-rendered summary must state that it is not a receipt');
});

test('[8c] the review step shows UNPAID before submission', () => {
    assert.match(BOOKING_PAGE, /Payment Status/);
    assert.match(BOOKING_PAGE, /UNPAID/);
    assert.match(BOOKING_PAGE, /No payment is collected now/);
});

// ---------------------------------------------------------------------------
// [9][10] Idempotency
// ---------------------------------------------------------------------------

test('[9] repeated submits with one key produce one booking, second replayed', async () => {
    const calls = harness({
        responses: [
            okCreate(),
            { ok: true, status: 200, json: { booking: serverBooking(), idempotentReplay: true } },
        ],
    });
    const key = 'bk-same-key-000000000000';
    const first = await createPackageBooking(payload(key));
    const second = await createPackageBooking(payload(key));

    assert.equal(calls[0].body.idempotencyKey, calls[1].body.idempotencyKey, 'the key must be reused');
    assert.equal(first.booking.id, second.booking.id);
    assert.equal(second.idempotentReplay, true);
});

test('[10] a retry after failure reuses the same key', async () => {
    const calls = harness({
        responses: [
            { ok: false, status: 500, json: { error: 'Internal server error' } },
            okCreate(),
        ],
    });
    const key = 'bk-retry-key-00000000000';
    await assert.rejects(() => createPackageBooking(payload(key)));
    await createPackageBooking(payload(key));

    assert.equal(calls.length, 2);
    assert.equal(calls[0].body.idempotencyKey, key);
    assert.equal(calls[1].body.idempotencyKey, key, 'the retry must not mint a new key');
});

test('[10b] keys are random, not timestamp-derived, and unique', () => {
    const keys = new Set();
    for (let i = 0; i < 2000; i += 1) keys.add(newIdempotencyKey());
    assert.equal(keys.size, 2000, 'all keys must be unique');
    for (const k of [...keys].slice(0, 20)) {
        assert.match(k, /^bk-[0-9a-f-]{20,}$/i);
        assert.ok(!/^bk-\d{13}$/.test(k), 'a timestamp-only key would collide on fast double-clicks');
    }
});

test('[10c] the page mints one key at review and replaces it only on material change', () => {
    assert.match(BOOKING_PAGE, /step === 3 && !idempotencyKeyRef\.current/, 'minted once at the review step');
    assert.match(BOOKING_PAGE, /idempotencyKeyRef\.current \|\| newIdempotencyKey\(\)/, 'reused on submit');
    assert.match(BOOKING_PAGE, /const resetBookingAttempt = \(\) => \{/);
    // Replaced only when a commercial input actually changes.
    const resets = BOOKING_PAGE.match(/resetBookingAttempt\(\)/g) || [];
    assert.ok(resets.length >= 4, `expected the reset on date, travellers, pickup and hotel; saw ${resets.length}`);
});

test('[9b] the submit button is disabled while submitting, preventing double-click', () => {
    assert.match(BOOKING_PAGE, /disabled=\{submitting \|\| !!priceNotice\}/);
    assert.match(BOOKING_PAGE, /aria-busy=\{submitting\}/);
    assert.match(BOOKING_PAGE, /Submitting\.\.\./);
});

// ---------------------------------------------------------------------------
// [11][12][13][14] Error handling
// ---------------------------------------------------------------------------

test('[11] a network failure is safe to retry and says so', async () => {
    harness({ responses: [new TypeError('Failed to fetch')] });
    await assert.rejects(() => createPackageBooking(payload()), (err) => {
        assert.equal(err.serverError, 'NETWORK');
        assert.equal(
            toCustomerMessage(err),
            'We could not submit your booking. Please try again. Your booking will not be duplicated.',
        );
        return true;
    });
});

test('[12] a validation error is shown safely, with no internals leaked', async () => {
    harness({
        responses: [{
            ok: false, status: 400,
            json: { error: 'Validation failed', details: ['customer.email is not a valid email address'] },
        }],
    });
    await assert.rejects(() => createPackageBooking(payload()), (err) => {
        const msg = toCustomerMessage(err);
        assert.equal(msg, 'Please check your contact details and try again.');
        for (const leak of ['bookings', 'firestore', 'collection', 'at Object', 'undefined']) {
            assert.ok(!msg.toLowerCase().includes(leak), `message must not leak "${leak}"`);
        }
        assert.equal(stepForError(err), 1, 'should return the customer to the contact step');
        return true;
    });
});

test('[13] an invalid departure returns the customer to the trip step', async () => {
    harness({
        responses: [{
            ok: false, status: 400,
            json: { error: 'Validation failed', details: ['departureDate is not an available batch departure for this package'] },
        }],
    });
    await assert.rejects(() => createPackageBooking(payload()), (err) => {
        assert.equal(toCustomerMessage(err), 'Please select an available departure date.');
        assert.equal(stepForError(err), 1);
        return true;
    });
});

test('[13b] an invalid pickup is reported distinctly', async () => {
    harness({
        responses: [{ ok: false, status: 400, json: { error: 'Validation failed', details: ['Selected pickup location does not exist on this package'] } }],
    });
    await assert.rejects(() => createPackageBooking(payload()), (err) => {
        assert.equal(toCustomerMessage(err), 'Please select a valid pickup option.');
        return true;
    });
});

test('[14] an unavailable or missing package is reported plainly', async () => {
    harness({ responses: [{ ok: false, status: 409, json: { error: 'This package is not currently available for booking' } }] });
    await assert.rejects(() => createPackageBooking(payload()), (err) => {
        assert.equal(toCustomerMessage(err), 'This package is currently unavailable for booking.');
        return true;
    });

    harness({ responses: [{ ok: false, status: 404, json: { error: 'Package not found' } }] });
    await assert.rejects(() => createPackageBooking(payload()), (err) => {
        assert.equal(toCustomerMessage(err), 'This package is currently unavailable for booking.');
        return true;
    });
});

test('[14b] a missing bundled hotel is distinguished from a missing package', async () => {
    harness({ responses: [{ ok: false, status: 404, json: { error: 'Bundled hotel not found' } }] });
    await assert.rejects(() => createPackageBooking(payload()), (err) => {
        assert.match(toCustomerMessage(err), /hotel is no longer available/);
        return true;
    });
});

test('[12b] no customer-facing message exposes a stack trace or collection name', () => {
    const errors = [
        new BookingApiError('x', { status: 400, details: ['bookings/abc at Object.<anonymous>'] }),
        new BookingApiError('x', { status: 500 }),
        new BookingApiError('x', { status: 0, serverError: 'NETWORK' }),
        new Error('raw failure'),
    ];
    for (const e of errors) {
        const msg = toCustomerMessage(e);
        for (const leak of ['at Object', 'node_modules', 'bookings/', 'firestore', 'undefined']) {
            assert.ok(!msg.includes(leak), `"${msg}" must not leak "${leak}"`);
        }
    }
});

// ---------------------------------------------------------------------------
// Price-change handling
// ---------------------------------------------------------------------------

test('a server total differing from the estimate is surfaced, not silently accepted', () => {
    assert.match(BOOKING_PAGE, /grossAmountMinor \/ booking\.pricing\.minorUnitsPerMajor/);
    assert.match(BOOKING_PAGE, /setPriceNotice\(/);
    assert.match(BOOKING_PAGE, /Your booking amount has been updated based on the latest package details/);
    assert.match(BOOKING_PAGE, /Accept revised amount/, 'the customer must explicitly accept');
    // …and submitting is blocked until they do.
    assert.match(BOOKING_PAGE, /disabled=\{submitting \|\| !!priceNotice\}/);
});

// ---------------------------------------------------------------------------
// [15][16] Own-booking read and refresh safety
// ---------------------------------------------------------------------------

test('[15] the own-booking read is authenticated and targets a single booking', async () => {
    const calls = harness({ responses: [{ ok: true, status: 200, json: { booking: serverBooking() } }] });
    const { booking } = await getMyBooking('bk-server-1');

    assert.equal(calls[0].init.headers.Authorization, 'Bearer id-token-abc');
    assert.match(calls[0].url, /\/api\/bookings\/bk-server-1$/);
    assert.equal(calls[0].init.method, 'GET');
    assert.equal(booking.bookingReference, 'IY-BKG-2026-7K4MQP');
});

test('[15b] a booking id is URL-encoded, never interpolated raw', async () => {
    const calls = harness({ responses: [{ ok: true, status: 200, json: { booking: serverBooking() } }] });
    await getMyBooking('../packages/himalaya-trek');
    assert.ok(!calls[0].url.includes('../'), 'path traversal must not reach the URL');
    assert.match(calls[0].url, /%2F/, 'slashes must be encoded');
});

test('[16] the success page survives refresh by re-fetching, not relying on router state', () => {
    assert.match(SUCCESS_PAGE, /useSearchParams/, 'the booking id must be readable from the URL');
    assert.match(SUCCESS_PAGE, /searchParams\.get\('id'\)/);
    assert.match(SUCCESS_PAGE, /getMyBooking\(idFromUrl\)/, 'it must re-fetch through the own-booking API');
    assert.match(BOOKING_PAGE, /\/booking-success\?id=\$\{encodeURIComponent\(booking\.id\)\}/,
        'the booking page must put the id in the URL');
});

test('[16b] the success page no longer fabricates booking data client-side', () => {
    assert.ok(!SUCCESS_PAGE.includes('isRequest'), 'the old synthetic flag must be gone');
    assert.match(SUCCESS_PAGE, /booking\?\.pricing/, 'amounts must come from the server booking');
    assert.match(BOOKING_PAGE, /goToSuccess\(booking\)/, 'navigation must pass the server booking');
});

// ---------------------------------------------------------------------------
// [17] The direct Firestore create is gone
// ---------------------------------------------------------------------------

test('[17] the booking page performs no Firestore write of any kind', () => {
    for (const forbidden of ['setDoc(', 'addDoc(', 'updateDoc(', 'serverTimestamp(', 'deleteDoc(']) {
        assert.ok(!BOOKING_PAGE.includes(forbidden), `BookingPage must not call ${forbidden}`);
    }
    assert.ok(!BOOKING_PAGE.includes("collection(db, 'bookings')"), 'the direct bookings create must be gone');
    assert.ok(!BOOKING_PAGE.includes("collection(db, 'hotel_bookings')"), 'the client hotel-bundle write must be gone');
});

test('[17b] the submit path goes through the booking API', () => {
    assert.match(BOOKING_PAGE, /import \{[\s\S]*?createPackageBooking[\s\S]*?\} from '\.\.\/services\/packageBookingApi'/);
    assert.match(BOOKING_PAGE, /await createPackageBooking\(payload\)/);
});

test('[17c] Firestore reads the page legitimately needs are preserved', () => {
    // The page still reads the package and suggested hotels — only the
    // authoritative CREATE was removed, not Firestore usage generally.
    assert.match(BOOKING_PAGE, /getDoc\(docRef\)/, 'package lookup must still work');
    assert.match(BOOKING_PAGE, /getDocs\(q\)/, 'hotel suggestions must still work');
});

test('[17d] no document upload is attempted during booking submission (PB-3 dependency)', () => {
    for (const forbidden of ['uploadBytes', 'getDownloadURL', 'getStorageAsync', 'firebase/storage']) {
        assert.ok(!BOOKING_PAGE.includes(forbidden), `BookingPage must not reference ${forbidden}`);
    }
    // The customer is told rather than silently misled.
    assert.match(BOOKING_PAGE, /not<\/strong> submitted with this request/);
});

test('[17e] no payment gateway is reachable from the booking page', () => {
    for (const forbidden of ['payWithRazorpay', 'razorpay', 'Razorpay', 'paymentGateway']) {
        assert.ok(!BOOKING_PAGE.includes(forbidden), `BookingPage must not reference ${forbidden}`);
    }
});
