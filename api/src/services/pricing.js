/**
 * Server-authoritative pricing.
 *
 * The client sends a package, a pickup option and a traveller count. It never
 * sends a price, and if it does the value is ignored — the request validator
 * rejects unknown fields outright. Every figure below is read from the
 * database and computed here in minor units.
 */

export const HOTEL_BUNDLE_DISCOUNT_BP = 1500; // 15%, in basis points; integer maths only

export function priceBooking({ pkg, pickupOption, travellerCount, hotel }) {
    const unitPriceMinor = pickupOption
        ? Number(pickupOption.price_minor)
        : Number(pkg.base_price_minor);

    if (!Number.isInteger(unitPriceMinor) || unitPriceMinor <= 0) {
        throw Object.assign(new Error('Package is not priced'), { code: 'PACKAGE_NOT_PRICED' });
    }

    const tourAmountMinor = unitPriceMinor * travellerCount;

    let hotelAmountMinor = 0;
    let hotelDiscountMinor = 0;
    if (hotel && hotel.base_price_minor != null) {
        hotelAmountMinor = Number(hotel.base_price_minor);
        // Integer arithmetic: no floating point ever touches money.
        hotelDiscountMinor = Math.floor((hotelAmountMinor * HOTEL_BUNDLE_DISCOUNT_BP) / 10000);
    }

    const grossAmountMinor = tourAmountMinor + hotelAmountMinor - hotelDiscountMinor;

    return {
        currency: pkg.currency || 'INR',
        minorUnitsPerMajor: Number(pkg.minor_units_per_major) || 100,
        unitPriceMinor,
        tourAmountMinor,
        hotelAmountMinor,
        hotelDiscountMinor,
        grossAmountMinor,
    };
}

/** Display only. The database never stores a major-unit value. */
export const toMajor = (minor, perMajor = 100) => Number(minor) / perMajor;
