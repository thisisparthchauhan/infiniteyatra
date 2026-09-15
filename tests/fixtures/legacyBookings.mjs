/**
 * CUTOVER — synthetic legacy booking fixtures.
 *
 * SYNTHETIC. No real customer data: production was never read to build these,
 * and reading it to build them would have been the wrong way to get fixtures.
 * They are derived from the two things that DO describe the legacy contract:
 *
 *   - the `hasOnly` allowlist on /bookings create in firestore.rules, which is
 *     the exact set of fields the old browser client was ever permitted to write
 *   - the fields src/pages/MyBookings.jsx read before the cutover
 *
 * The four variants span that allowlist from the sparsest plausible record to
 * the richest, so a projection or a UI change is exercised against absence as
 * well as presence. The point of A in particular is missing fields: it is the
 * shape most likely to render as "₹0" if anything treats legacy as canonical.
 *
 * None of them carries `schemaVersion`, which is what makes them LEGACY.
 */

/** A — earliest, sparsest. Predates bookingStatus/paymentStatus; no travellers. */
export const legacyA = {
    userId: 'uid-legacy-owner',
    packageId: 'pkg-kashmir-7d',
    packageTitle: 'Kashmir Valley — 7 Days',
    bookingDate: '2024-04-18',
    travelers: 2,
    contactName: 'Test Person A',
    contactEmail: 'a@example.invalid',
    contactPhone: '+910000000001',
    totalPrice: 48000,
    status: 'confirmed',
    createdAt: new Date('2024-03-02T09:15:00Z'),
};

/** B — adds the traveller name list, special requests and the status pair. */
export const legacyB = {
    userId: 'uid-legacy-owner',
    packageId: 'pkg-goa-4d',
    packageTitle: 'Goa Beaches — 4 Days',
    bookingDate: '2024-11-02',
    travelers: 3,
    contactName: 'Test Person B',
    contactEmail: 'b@example.invalid',
    contactPhone: '+910000000002',
    specialRequests: 'Vegetarian meals',
    travelersList: ['Test Person B', 'Companion One', 'Companion Two'],
    totalPrice: 61500,
    status: 'pending',
    bookingStatus: 'pending',
    paymentStatus: 'pending',
    createdAt: new Date('2024-10-01T11:00:00Z'),
};

/** C — hotel-bundled: the split amounts and the bundled hotel pointer. */
export const legacyC = {
    userId: 'uid-legacy-owner',
    packageId: 'pkg-manali-5d',
    packageTitle: 'Manali Adventure — 5 Days',
    bookingDate: '2025-01-20',
    travelers: 2,
    contactName: 'Test Person C',
    contactEmail: 'c@example.invalid',
    contactPhone: '+910000000003',
    travelersList: ['Test Person C', 'Companion Three'],
    tourAmount: 38000,
    hotelAmount: 22000,
    totalPrice: 56700,
    bundledHotelId: 'hotel-snowpeak',
    bundledHotelName: 'Snow Peak Resort',
    status: 'confirmed',
    bookingStatus: 'confirmed',
    paymentStatus: 'partial',
    createdAt: new Date('2024-12-11T06:40:00Z'),
};

/** D — richest: pickup location, and travellers stored as objects, not strings. */
export const legacyD = {
    userId: 'uid-legacy-owner',
    packageId: 'pkg-kerala-6d',
    packageTitle: 'Kerala Backwaters — 6 Days',
    bookingDate: '2025-03-14',
    travelers: 4,
    contactName: 'Test Person D',
    contactEmail: 'd@example.invalid',
    contactPhone: '+910000000004',
    specialRequests: 'Ground floor rooms',
    travelersList: [
        { name: 'Test Person D', age: 41 },
        { name: 'Companion Four', age: 39 },
        { name: 'Companion Five', age: 12 },
        { name: 'Companion Six', age: 9 },
    ],
    pickupLocation: 'Kochi Airport',
    tourAmount: 91000,
    hotelAmount: 34000,
    totalPrice: 119900,
    bundledHotelId: 'hotel-backwater-villa',
    bundledHotelName: 'Backwater Villa',
    status: 'confirmed',
    bookingStatus: 'confirmed',
    paymentStatus: 'paid',
    createdAt: new Date('2025-02-02T13:05:00Z'),
};

export const LEGACY_FIXTURES = Object.freeze({ A: legacyA, B: legacyB, C: legacyC, D: legacyD });

/** A canonical PB booking, as the PB API writes it. The control case. */
export const canonicalBooking = {
    // 2 is what PB-1 actually writes; see functions/bookingSchema.js.
    schemaVersion: 2,
    userId: 'uid-canonical-owner',
    bookingReference: 'IY-BKG-2026-ABC123',
    packageId: 'pkg-ladakh-8d',
    packageSnapshot: {
        title: 'Ladakh Expedition — 8 Days',
        slug: 'ladakh-expedition',
        location: 'Ladakh',
        duration: '8 Days',
        pickupLocation: 'Leh',
        inclusions: ['Stay', 'Transport'],
        exclusions: ['Flights'],
        cancellationPolicy: ['Non-refundable within 7 days'],
    },
    departureDate: '2026-06-10',
    travellerCount: 2,
    customer: { name: 'Test Canonical', email: 'canon@example.invalid', phone: '+910000000005' },
    travellers: [
        { travellerId: 'trv_aaaaaaaaaaaa', fullName: 'Test Canonical' },
        { travellerId: 'trv_bbbbbbbbbbbb', fullName: 'Companion Seven' },
    ],
    specialRequests: '',
    hotelBundle: null,
    pricing: {
        currency: 'INR',
        minorUnitsPerMajor: 100,
        unitPriceMinor: 7450000,
        tourAmountMinor: 14900000,
        hotelAmountMinor: 0,
        hotelDiscountMinor: 0,
        grossAmountMinor: 14900000,
    },
    paymentPlan: 'full',
    paymentStatus: 'pending',
    amountReceivedMinor: 0,
    balanceAmountMinor: 14900000,
    bookingStatus: 'pending',
    documentStatus: 'not_started',
    source: 'web',
    createdAt: new Date('2026-05-01T10:00:00Z'),
    updatedAt: new Date('2026-05-01T10:00:00Z'),
};
