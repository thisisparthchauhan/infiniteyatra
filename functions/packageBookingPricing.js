/**
 * PB-1 — Server-authoritative package booking pricing and availability.
 *
 * Pure functions only: no Firebase, no I/O. Everything here is unit-testable
 * and is the single authority for what a package booking costs.
 *
 * MONEY CONVENTION
 * All authoritative arithmetic is done in integer minor units (paise).
 * Catalogue prices are stored in the existing `packages` / `hotels` documents
 * as major units (rupees), so they are converted at the boundary by toMinor()
 * and never re-enter floating point afterwards.
 *
 * COMMERCIAL FORMULAS
 * These reproduce the existing client-side behaviour in src/pages/BookingPage.jsx
 * exactly. They are NOT a redesign. Where a quirk exists (see the `||` fallback
 * in resolveUnitPriceMinor) it is reproduced deliberately and marked.
 */

'use strict';

const MINOR_UNITS_PER_MAJOR = 100;
const DEFAULT_CURRENCY = 'INR';

/** Bundled-hotel discount, as an integer percentage. Mirrors BookingPage.jsx:581. */
const HOTEL_BUNDLE_DISCOUNT_PERCENT = 15;

/** Hard ceiling on travellers when a package declares no maxGroupSize. */
const ABSOLUTE_MAX_TRAVELLERS = 50;

class PricingError extends Error {
    constructor(code, message, details) {
        super(message);
        this.name = 'PricingError';
        this.code = code;
        this.details = details;
    }
}

/**
 * Convert a catalogue major-unit amount (rupees) to integer minor units (paise).
 * Rejects anything that is not a finite, non-negative, sanely-bounded number so
 * that a malformed catalogue value fails loudly instead of silently pricing at 0.
 */
function toMinor(majorAmount, fieldName) {
    // Guard the coercions that would otherwise pass silently: Number(null) is 0,
    // Number('') is 0, Number([]) is 0 — any of which would price a booking at
    // zero from a malformed catalogue value rather than failing.
    if (typeof majorAmount !== 'number' && typeof majorAmount !== 'string') {
        throw new PricingError(
            'INVALID_CATALOGUE_PRICE',
            `Catalogue price "${fieldName}" is missing or not a number`,
        );
    }
    if (typeof majorAmount === 'string' && majorAmount.trim() === '') {
        throw new PricingError('INVALID_CATALOGUE_PRICE', `Catalogue price "${fieldName}" is empty`);
    }
    const n = Number(majorAmount);
    if (!Number.isFinite(n) || n < 0) {
        throw new PricingError(
            'INVALID_CATALOGUE_PRICE',
            `Catalogue price "${fieldName}" is not a valid non-negative number`,
        );
    }
    const minor = Math.round(n * MINOR_UNITS_PER_MAJOR);
    if (!Number.isSafeInteger(minor)) {
        throw new PricingError('INVALID_CATALOGUE_PRICE', `Catalogue price "${fieldName}" is out of range`);
    }
    return minor;
}

/** Convert integer minor units back to major units for display//legacy fields. */
function toMajor(minorAmount) {
    return minorAmount / MINOR_UNITS_PER_MAJOR;
}

function hasPickupLocations(pkg) {
    return Array.isArray(pkg.pickupLocations) && pkg.pickupLocations.length > 0;
}

/**
 * Resolve the per-traveller price in minor units.
 *
 * Mirrors BookingPage.jsx:576 —
 *   effectivePrice = hasLocations ? (pickupLocations[idx]?.price || pkg.price) : pkg.price
 *
 * NOTE the `||` (not `??`): a pickup location priced at 0 falls back to the
 * package base price. That is existing production behaviour and is reproduced
 * deliberately rather than "fixed" here, because changing it would silently
 * alter what customers are charged.
 */
function resolveUnitPriceMinor(pkg, pickupLocationIndex) {
    if (!hasPickupLocations(pkg)) {
        return { unitPriceMinor: toMinor(pkg.price, 'package.price'), pickupLocation: null };
    }

    const location = pkg.pickupLocations[pickupLocationIndex];
    if (!location) {
        throw new PricingError('INVALID_PICKUP', 'Selected pickup location does not exist on this package');
    }

    const locationPrice = Number(location.price);
    const effectiveMajor = locationPrice || pkg.price; // deliberate `||`
    return {
        unitPriceMinor: toMinor(effectiveMajor, 'pickupLocation.price'),
        pickupLocation: location.location || null,
    };
}

/** Normalise a package's publication state. Mirrors PackageContext.jsx:64 (`isVisible !== false`). */
function isPackageBookable(pkg) {
    return Boolean(pkg) && pkg.isVisible !== false;
}

/**
 * Validate a requested departure date against the package's departure rules.
 *
 * Reproduces the combined behaviour of two pieces of existing client code:
 *   1. isDateValidForDepartureType()  — BookingPage.jsx:470-483
 *   2. the DatePicker filterDate + minDate/maxDate props — BookingPage.jsx:854-869
 *
 * The private-group override in (2) is commercially significant: once the
 * traveller count reaches the package's `minimumPersons`, any in-season date
 * becomes bookable. That rule is reproduced here.
 *
 * @returns {{valid: boolean, reason?: string}}
 */
function validateDeparture(pkg, departureDate, travellerCount) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(departureDate)) {
        return { valid: false, reason: 'departureDate must be an ISO date (YYYY-MM-DD)' };
    }

    const date = new Date(`${departureDate}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) {
        return { valid: false, reason: 'departureDate is not a real date' };
    }

    // Season window applies to every departure type (DatePicker minDate/maxDate).
    if (pkg.seasonStartDate && date < new Date(`${pkg.seasonStartDate}T00:00:00Z`)) {
        return { valid: false, reason: 'departureDate is before the package season starts' };
    }
    if (pkg.seasonEndDate && date > new Date(`${pkg.seasonEndDate}T00:00:00Z`)) {
        return { valid: false, reason: 'departureDate is after the package season ends' };
    }

    // Private-group override: meeting minimumPersons unlocks any in-season date.
    const minimumPersons = Number(pkg.minimumPersons) || 0;
    if (minimumPersons > 1 && travellerCount >= minimumPersons) {
        return { valid: true };
    }

    if (pkg.departureType === 'daily') {
        return { valid: true };
    }

    const batchDates = Array.isArray(pkg.batchDates) ? pkg.batchDates : [];

    if (pkg.departureType === 'weekly') {
        const isWeeklyDay =
            pkg.weeklyDay !== null &&
            pkg.weeklyDay !== undefined &&
            date.getUTCDay() === Number(pkg.weeklyDay);
        const isSpecialBatch = batchDates.some((b) => b.date === departureDate);
        if (isWeeklyDay || isSpecialBatch) return { valid: true };
        return { valid: false, reason: 'departureDate is not an available weekly departure for this package' };
    }

    if (batchDates.length === 0) {
        return { valid: true };
    }
    if (batchDates.some((b) => b.date === departureDate)) {
        return { valid: true };
    }
    return { valid: false, reason: 'departureDate is not an available batch departure for this package' };
}

/**
 * Validate the requested traveller count against the package.
 *
 * `maxGroupSize` exists on every package but was never enforced by the client
 * (see audit P0-04 / Part 7). PB-1 enforces it server-side. This is validation,
 * not a change to a pricing formula.
 */
function validateTravellerCount(pkg, travellerCount) {
    if (!Number.isInteger(travellerCount) || travellerCount < 1) {
        return { valid: false, reason: 'travellerCount must be a positive whole number' };
    }

    const maxGroupSize = Number(pkg.maxGroupSize) || 0;
    const ceiling = maxGroupSize > 0 ? Math.min(maxGroupSize, ABSOLUTE_MAX_TRAVELLERS) : ABSOLUTE_MAX_TRAVELLERS;

    if (travellerCount > ceiling) {
        return { valid: false, reason: `travellerCount exceeds the maximum of ${ceiling} for this package` };
    }
    return { valid: true };
}

/**
 * Resolve the bundled-hotel room price from the canonical hotel document.
 *
 * The client previously sent the room price it had computed
 * (BookingPage.jsx:534). The server must never trust that, so the room is
 * re-resolved here from the hotel document. When no roomId is supplied the
 * first room is used, matching the existing client default
 * (`hotel.rooms?.[0]`, BookingPage.jsx:530).
 */
function resolveBundledHotelMinor(hotel, roomId) {
    const rooms = Array.isArray(hotel.rooms) ? hotel.rooms : [];
    if (rooms.length === 0) {
        throw new PricingError('INVALID_HOTEL_BUNDLE', 'Selected hotel has no bookable rooms');
    }

    const room =
        roomId != null
            ? rooms.find((r) => String(r.id) === String(roomId))
            : rooms[0];

    if (!room) {
        throw new PricingError('INVALID_HOTEL_BUNDLE', 'Selected room does not exist at this hotel');
    }

    return {
        roomId: room.id != null ? String(room.id) : null,
        roomName: room.name || null,
        roomPriceMinor: toMinor(room.price, 'hotel.room.price'),
    };
}

/**
 * Compute the authoritative booking price.
 *
 * Mirrors BookingPage.jsx:574-583 in integer minor units:
 *   tourTotal      = effectivePrice * travellers
 *   hotelTotal     = room price
 *   bundleDiscount = hotelTotal * 15%
 *   finalTotal     = tourTotal + (hotelTotal - bundleDiscount)
 *
 * @param {object} pkg              canonical package document
 * @param {object} input            { travellerCount, pickupLocationIndex }
 * @param {object|null} hotelBundle resolved output of resolveBundledHotelMinor, or null
 */
function computeBookingPrice(pkg, input, hotelBundle) {
    const { travellerCount, pickupLocationIndex = 0 } = input;

    const { unitPriceMinor, pickupLocation } = resolveUnitPriceMinor(pkg, pickupLocationIndex);

    const tourAmountMinor = unitPriceMinor * travellerCount;
    if (!Number.isSafeInteger(tourAmountMinor)) {
        throw new PricingError('PRICE_OUT_OF_RANGE', 'Computed tour amount is out of range');
    }

    let hotelGrossMinor = 0;
    let hotelDiscountMinor = 0;
    if (hotelBundle) {
        hotelGrossMinor = hotelBundle.roomPriceMinor;
        // Integer-safe percentage: (amount * 15) / 100, rounded once.
        hotelDiscountMinor = Math.round((hotelGrossMinor * HOTEL_BUNDLE_DISCOUNT_PERCENT) / 100);
    }
    const hotelAmountMinor = hotelGrossMinor - hotelDiscountMinor;

    const grossAmountMinor = tourAmountMinor + hotelAmountMinor;
    if (!Number.isSafeInteger(grossAmountMinor) || grossAmountMinor < 0) {
        throw new PricingError('PRICE_OUT_OF_RANGE', 'Computed booking total is out of range');
    }

    return {
        currency: DEFAULT_CURRENCY,
        minorUnitsPerMajor: MINOR_UNITS_PER_MAJOR,
        unitPriceMinor,
        travellerCount,
        tourAmountMinor,
        hotelGrossMinor,
        hotelDiscountMinor,
        hotelDiscountPercent: hotelBundle ? HOTEL_BUNDLE_DISCOUNT_PERCENT : 0,
        hotelAmountMinor,
        grossAmountMinor,
        pickupLocation,
    };
}

module.exports = {
    MINOR_UNITS_PER_MAJOR,
    DEFAULT_CURRENCY,
    HOTEL_BUNDLE_DISCOUNT_PERCENT,
    ABSOLUTE_MAX_TRAVELLERS,
    PricingError,
    toMinor,
    toMajor,
    hasPickupLocations,
    resolveUnitPriceMinor,
    isPackageBookable,
    validateDeparture,
    validateTravellerCount,
    resolveBundledHotelMinor,
    computeBookingPrice,
};
