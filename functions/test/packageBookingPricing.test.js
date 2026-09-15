/**
 * PB-1 — Pricing, departure and traveller-count unit tests.
 * Pure functions: no Firebase, no emulator required.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    toMinor,
    toMajor,
    resolveUnitPriceMinor,
    isPackageBookable,
    validateDeparture,
    validateTravellerCount,
    resolveBundledHotelMinor,
    computeBookingPrice,
    PricingError,
    HOTEL_BUNDLE_DISCOUNT_PERCENT,
} = require('../packageBookingPricing');

const basePackage = {
    id: 'himalaya-trek',
    title: 'Himalaya Trek',
    price: 15000,
    costPrice: 9000,
    tokenPrice: 2000,
    isVisible: true,
    departureType: 'daily',
    maxGroupSize: 12,
    minimumPersons: 4,
    seasonStartDate: '2026-04-01',
    seasonEndDate: '2026-10-31',
};

// --- money conversion -------------------------------------------------------

test('toMinor converts rupees to integer paise', () => {
    assert.equal(toMinor(15000, 'p'), 1500000);
    assert.equal(toMinor(0, 'p'), 0);
    assert.equal(toMinor(1234.56, 'p'), 123456);
});

test('toMinor rounds rather than truncating float artefacts', () => {
    // 0.1 + 0.2 = 0.30000000000000004 in IEEE-754
    assert.equal(toMinor(0.1 + 0.2, 'p'), 30);
});

test('toMinor rejects negative, NaN and non-numeric catalogue prices', () => {
    for (const bad of [-1, NaN, Infinity, 'abc', null, undefined, {}]) {
        assert.throws(() => toMinor(bad, 'p'), PricingError, `should reject ${String(bad)}`);
    }
});

test('toMajor round-trips', () => {
    assert.equal(toMajor(toMinor(15000, 'p')), 15000);
});

// --- unit price resolution --------------------------------------------------

test('unit price uses package.price when there are no pickup locations', () => {
    const { unitPriceMinor, pickupLocation } = resolveUnitPriceMinor(basePackage, 0);
    assert.equal(unitPriceMinor, 1500000);
    assert.equal(pickupLocation, null);
});

test('unit price uses the selected pickup location price', () => {
    const pkg = {
        ...basePackage,
        pickupLocations: [
            { location: 'Delhi', price: 16000, b2bPrice: 11000 },
            { location: 'Rishikesh', price: 14000, b2bPrice: 9500 },
        ],
    };
    assert.equal(resolveUnitPriceMinor(pkg, 1).unitPriceMinor, 1400000);
    assert.equal(resolveUnitPriceMinor(pkg, 1).pickupLocation, 'Rishikesh');
});

test('pickup location priced 0 falls back to package price (existing `||` behaviour preserved)', () => {
    const pkg = { ...basePackage, pickupLocations: [{ location: 'Base', price: 0 }] };
    assert.equal(resolveUnitPriceMinor(pkg, 0).unitPriceMinor, 1500000);
});

test('out-of-range pickup index is rejected, never silently defaulted', () => {
    const pkg = { ...basePackage, pickupLocations: [{ location: 'Delhi', price: 16000 }] };
    assert.throws(() => resolveUnitPriceMinor(pkg, 7), (e) => e.code === 'INVALID_PICKUP');
});

// --- bookability ------------------------------------------------------------

test('isPackageBookable mirrors the isVisible !== false convention', () => {
    assert.equal(isPackageBookable({ isVisible: true }), true);
    assert.equal(isPackageBookable({}), true, 'undefined isVisible means visible');
    assert.equal(isPackageBookable({ isVisible: false }), false);
    assert.equal(isPackageBookable(null), false);
});

// --- departure validation ---------------------------------------------------

test('departure must be a real ISO date', () => {
    assert.equal(validateDeparture(basePackage, '2026/05/01', 1).valid, false);
    assert.equal(validateDeparture(basePackage, 'tomorrow', 1).valid, false);
    assert.equal(validateDeparture(basePackage, '2026-02-31', 1).valid, false);
});

test('departure outside the season window is rejected at both ends', () => {
    assert.equal(validateDeparture(basePackage, '2026-03-31', 1).valid, false);
    assert.equal(validateDeparture(basePackage, '2026-11-01', 1).valid, false);
    assert.equal(validateDeparture(basePackage, '2026-05-15', 1).valid, true);
});

test('daily departures accept any in-season date', () => {
    assert.equal(validateDeparture(basePackage, '2026-06-10', 1).valid, true);
});

test('weekly departures accept only the configured weekday', () => {
    // weeklyDay 5 = Friday. 2026-05-15 is a Friday; 2026-05-16 is a Saturday.
    const pkg = { ...basePackage, departureType: 'weekly', weeklyDay: 5, minimumPersons: 0 };
    assert.equal(validateDeparture(pkg, '2026-05-15', 1).valid, true);
    assert.equal(validateDeparture(pkg, '2026-05-16', 1).valid, false);
});

test('weekly departures also accept an explicitly listed batch date', () => {
    const pkg = {
        ...basePackage,
        departureType: 'weekly',
        weeklyDay: 5,
        minimumPersons: 0,
        batchDates: [{ date: '2026-05-16', availableSeats: 8 }],
    };
    assert.equal(validateDeparture(pkg, '2026-05-16', 1).valid, true);
});

test('batch-only packages reject unlisted dates', () => {
    const pkg = {
        ...basePackage,
        departureType: 'batch',
        minimumPersons: 0,
        batchDates: [{ date: '2026-05-20' }],
    };
    assert.equal(validateDeparture(pkg, '2026-05-20', 1).valid, true);
    assert.equal(validateDeparture(pkg, '2026-05-21', 1).valid, false);
});

test('reaching minimumPersons unlocks any in-season date (private-group rule)', () => {
    const pkg = { ...basePackage, departureType: 'weekly', weeklyDay: 5, minimumPersons: 4 };
    // Saturday — normally rejected for a weekly package…
    assert.equal(validateDeparture(pkg, '2026-05-16', 3).valid, false);
    // …but a group of 4 meets minimumPersons and unlocks it.
    assert.equal(validateDeparture(pkg, '2026-05-16', 4).valid, true);
});

test('the private-group override does not escape the season window', () => {
    const pkg = { ...basePackage, departureType: 'weekly', weeklyDay: 5, minimumPersons: 4 };
    assert.equal(validateDeparture(pkg, '2026-12-01', 10).valid, false);
});

// --- traveller count --------------------------------------------------------

test('traveller count must be a positive whole number', () => {
    for (const bad of [0, -1, 1.5, NaN, '3']) {
        assert.equal(validateTravellerCount(basePackage, bad).valid, false, `should reject ${String(bad)}`);
    }
    assert.equal(validateTravellerCount(basePackage, 1).valid, true);
});

test('traveller count is capped by maxGroupSize', () => {
    assert.equal(validateTravellerCount(basePackage, 12).valid, true);
    assert.equal(validateTravellerCount(basePackage, 13).valid, false);
});

test('packages without maxGroupSize still have an absolute ceiling', () => {
    const pkg = { ...basePackage, maxGroupSize: 0 };
    assert.equal(validateTravellerCount(pkg, 50).valid, true);
    assert.equal(validateTravellerCount(pkg, 51).valid, false);
});

// --- hotel bundle -----------------------------------------------------------

test('bundled room resolves by id, defaulting to the first room', () => {
    const hotel = {
        rooms: [
            { id: 'r1', name: 'Deluxe', price: 4000 },
            { id: 'r2', name: 'Suite', price: 9000 },
        ],
    };
    assert.equal(resolveBundledHotelMinor(hotel, 'r2').roomPriceMinor, 900000);
    assert.equal(resolveBundledHotelMinor(hotel, null).roomPriceMinor, 400000);
});

test('unknown room id and roomless hotel are rejected', () => {
    const hotel = { rooms: [{ id: 'r1', name: 'Deluxe', price: 4000 }] };
    assert.throws(() => resolveBundledHotelMinor(hotel, 'nope'), (e) => e.code === 'INVALID_HOTEL_BUNDLE');
    assert.throws(() => resolveBundledHotelMinor({ rooms: [] }, null), (e) => e.code === 'INVALID_HOTEL_BUNDLE');
});

// --- full price computation -------------------------------------------------

test('tour total is unit price times travellers, in integer paise', () => {
    const p = computeBookingPrice(basePackage, { travellerCount: 3, pickupLocationIndex: 0 }, null);
    assert.equal(p.unitPriceMinor, 1500000);
    assert.equal(p.tourAmountMinor, 4500000);
    assert.equal(p.grossAmountMinor, 4500000);
    assert.equal(p.currency, 'INR');
    assert.equal(toMajor(p.grossAmountMinor), 45000);
});

test('hotel bundle applies exactly 15% off the room price', () => {
    const hotel = { rooms: [{ id: 'r1', name: 'Deluxe', price: 4000 }] };
    const bundle = resolveBundledHotelMinor(hotel, 'r1');
    const p = computeBookingPrice(basePackage, { travellerCount: 2, pickupLocationIndex: 0 }, bundle);

    assert.equal(HOTEL_BUNDLE_DISCOUNT_PERCENT, 15);
    assert.equal(p.tourAmountMinor, 3000000);
    assert.equal(p.hotelGrossMinor, 400000);
    assert.equal(p.hotelDiscountMinor, 60000); // 15% of 4000 = 600
    assert.equal(p.hotelAmountMinor, 340000); // 3400
    assert.equal(p.grossAmountMinor, 3340000); // 33400
});

test('bundle discount rounds to whole paise on awkward amounts', () => {
    const hotel = { rooms: [{ id: 'r1', name: 'Odd', price: 3333.33 }] };
    const bundle = resolveBundledHotelMinor(hotel, 'r1');
    const p = computeBookingPrice(basePackage, { travellerCount: 1, pickupLocationIndex: 0 }, bundle);

    assert.equal(p.hotelGrossMinor, 333333);
    assert.equal(p.hotelDiscountMinor, 50000); // round(333333 * 15 / 100) = round(49999.95)
    assert.ok(Number.isSafeInteger(p.grossAmountMinor));
    assert.ok(Number.isSafeInteger(p.hotelDiscountMinor));
});

test('every computed money field is an integer — no floats reach the total', () => {
    const hotel = { rooms: [{ id: 'r1', name: 'X', price: 4599.99 }] };
    const p = computeBookingPrice(
        { ...basePackage, price: 12345.67 },
        { travellerCount: 7, pickupLocationIndex: 0 },
        resolveBundledHotelMinor(hotel, 'r1'),
    );
    for (const key of [
        'unitPriceMinor',
        'tourAmountMinor',
        'hotelGrossMinor',
        'hotelDiscountMinor',
        'hotelAmountMinor',
        'grossAmountMinor',
    ]) {
        assert.ok(Number.isSafeInteger(p[key]), `${key} must be a safe integer, got ${p[key]}`);
    }
});

test('pricing output carries no cost, token or b2b commercial fields', () => {
    const pkg = {
        ...basePackage,
        pickupLocations: [{ location: 'Delhi', price: 16000, b2bPrice: 11000 }],
    };
    const p = computeBookingPrice(pkg, { travellerCount: 2, pickupLocationIndex: 0 }, null);

    // No private field name may appear as a key.
    for (const key of ['costPrice', 'tokenPrice', 'b2bPrice', 'margin', 'supplierCost']) {
        assert.ok(!(key in p), `pricing output must not expose key "${key}"`);
    }

    // No private amount may appear as a value, in major or minor units.
    const values = new Set(Object.values(p).filter((v) => typeof v === 'number'));
    for (const secret of [9000, 900000, 2000, 200000, 11000, 1100000]) {
        assert.ok(!values.has(secret), `pricing output must not contain private amount ${secret}`);
    }
});
