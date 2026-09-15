/**
 * SA-1 — Canonical staff authorization roles (client mirror).
 *
 * This file exists so the UI can render role choices and labels. It is NOT a
 * security boundary: the client cannot authorise anything. Every protected
 * action is authorised server-side against the verified Firebase ID token
 * custom claim.
 *
 * Kept identical to functions/staffRoles.js and to storage.rules isStaff();
 * tests/sa1.role-vocabulary.test.mjs fails the build if any copy drifts.
 *
 * Separate from src/config/roles.js, which holds workspace DISPLAY labels for
 * the admin dashboard UI and is unrelated to authorization.
 */

export const STAFF_ROLES = Object.freeze({
    ADMIN: 'admin',
    HOTEL_MANAGER: 'hotel_manager',
    BOOKING_MANAGER: 'booking_manager',
    TOUR_MANAGER: 'tour_manager',
    FINANCE_MANAGER: 'finance_manager',
    CONTENT_MANAGER: 'content_manager',
});

export const ALL_STAFF_ROLES = Object.freeze(Object.values(STAFF_ROLES));

export const STAFF_ROLE_LABELS = Object.freeze({
    admin: 'Administrator',
    hotel_manager: 'Hotel Manager',
    booking_manager: 'Booking Manager',
    tour_manager: 'Tour Manager',
    finance_manager: 'Finance Manager',
    content_manager: 'Content Manager',
});

/** What each role is for, shown in the staff invite UI. */
export const STAFF_ROLE_DESCRIPTIONS = Object.freeze({
    admin: 'Full access to every module, including staff management.',
    hotel_manager: 'Hotel inventory, availability and hotel bookings.',
    booking_manager: 'Package bookings, traveller documents and booking operations.',
    tour_manager: 'Packages, departures, trips and transport.',
    finance_manager: 'Financial records and reporting.',
    content_manager: 'Site content, stories and homepage.',
});

export const LEGACY_ROLE_VALUES = Object.freeze(['operations', 'finance', 'guide', 'ops']);

export const isStaffRole = (v) => typeof v === 'string' && ALL_STAFF_ROLES.includes(v);
export const isAdminRole = (v) => v === STAFF_ROLES.ADMIN;
export const isLegacyRole = (v) => typeof v === 'string' && LEGACY_ROLE_VALUES.includes(v);
