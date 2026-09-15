/**
 * SA-1 — Canonical staff authorization roles (server).
 *
 * THE SOURCE OF AUTHORIZATION TRUTH IS THE FIREBASE ID TOKEN CUSTOM CLAIM.
 * Not the email address, not `users.role`, not any client-held value.
 *
 * These machine values must stay identical to three other places:
 *   - storage.rules  isStaff()
 *   - firestore.rules isAdmin()
 *   - src/config/staffRoles.js (the client mirror)
 *
 * `tests/sa1.role-vocabulary.test.mjs` parses the rules files and fails if any
 * copy drifts, because a silent mismatch here is what produced the situation
 * SA-1 exists to fix: staff issued a claim of `operations` that no rule
 * recognised, leaving them with an admin UI and no data access.
 *
 * NOT an authorization role: `hotel_partner` / `tour_partner` are external
 * self-service identities and are deliberately absent from every staff set.
 */

'use strict';

/** Machine values. Never render these; use STAFF_ROLE_LABELS. */
const STAFF_ROLES = Object.freeze({
    ADMIN: 'admin',
    HOTEL_MANAGER: 'hotel_manager',
    BOOKING_MANAGER: 'booking_manager',
    TOUR_MANAGER: 'tour_manager',
    FINANCE_MANAGER: 'finance_manager',
    CONTENT_MANAGER: 'content_manager',
});

/** Every role that counts as staff. Mirrors storage.rules isStaff(). */
const ALL_STAFF_ROLES = Object.freeze(Object.values(STAFF_ROLES));

/** Human labels. Display only — never compared against a claim. */
const STAFF_ROLE_LABELS = Object.freeze({
    admin: 'Administrator',
    hotel_manager: 'Hotel Manager',
    booking_manager: 'Booking Manager',
    tour_manager: 'Tour Manager',
    finance_manager: 'Finance Manager',
    content_manager: 'Content Manager',
});

/**
 * Legacy claim values that were issuable before SA-1 and are recognised by
 * nothing. Listed so they can be detected and reported — never silently
 * translated. Mapping a real person from one of these to a real role has
 * security consequences and is an owner decision.
 */
const LEGACY_ROLE_VALUES = Object.freeze(['operations', 'finance', 'guide', 'ops']);

function isStaffRole(value) {
    return typeof value === 'string' && ALL_STAFF_ROLES.includes(value);
}

function isAdminRole(value) {
    return value === STAFF_ROLES.ADMIN;
}

function isLegacyRole(value) {
    return typeof value === 'string' && LEGACY_ROLE_VALUES.includes(value);
}

module.exports = {
    STAFF_ROLES,
    ALL_STAFF_ROLES,
    STAFF_ROLE_LABELS,
    LEGACY_ROLE_VALUES,
    isStaffRole,
    isAdminRole,
    isLegacyRole,
};
