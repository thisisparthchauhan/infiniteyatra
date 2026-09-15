/**
 * Canonical staff roles — the SA-1 vocabulary, carried over intact.
 *
 * These exact strings are also the ENUM in staff_users.role, so an unrecognised
 * value cannot even be stored. That is the structural fix for the failure SA-1
 * existed to correct: staff issued a role of "operations" that no check
 * recognised, leaving them with a UI and no access.
 */

export const STAFF_ROLES = Object.freeze({
    ADMIN: 'admin',
    BOOKING_MANAGER: 'booking_manager',
    TOUR_MANAGER: 'tour_manager',
    HOTEL_MANAGER: 'hotel_manager',
    FINANCE_MANAGER: 'finance_manager',
    CONTENT_MANAGER: 'content_manager',
});

export const ALL_STAFF_ROLES = Object.freeze(Object.values(STAFF_ROLES));

export const STAFF_ROLE_LABELS = Object.freeze({
    admin: 'Administrator',
    booking_manager: 'Booking Manager',
    tour_manager: 'Tour Manager',
    hotel_manager: 'Hotel Manager',
    finance_manager: 'Finance Manager',
    content_manager: 'Content Manager',
});

/** Values that were issuable before SA-1 and mean nothing now. Never translated. */
export const LEGACY_ROLE_VALUES = Object.freeze(['operations', 'ops', 'finance', 'guide']);

export const isStaffRole = (v) => typeof v === 'string' && ALL_STAFF_ROLES.includes(v);
export const isLegacyRole = (v) => typeof v === 'string' && LEGACY_ROLE_VALUES.includes(v);
