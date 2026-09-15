/**
 * SA-1B — Admin-dashboard workspace resolution. PRESENTATION LOGIC ONLY.
 *
 * Extracted from RoleContext.jsx so the decisions below are unit-testable
 * without React. This module decides what the dashboard RENDERS. It never
 * decides what a user is PERMITTED to do: every protected action is authorised
 * server-side against the verified Firebase ID token custom claim, and again by
 * firestore.rules / storage.rules.
 *
 * The two vocabularies it bridges are deliberately different:
 *   - claim values are canonical machine roles ('admin', 'booking_manager', …)
 *   - USER_ROLES values are DISPLAY strings ('Admin Dashboard', 'Tour Manager')
 * CLAIM_TO_UI_ROLE is the only mapping between them, and it accepts canonical
 * claims only. A legacy claim (operations/finance/guide/ops), a customer, an
 * unauthenticated visitor, or a forged display string such as 'Admin Dashboard'
 * arriving as a claim all resolve to null and therefore render nothing.
 */

import { USER_ROLES, ROLE_PERMISSIONS, WORKSPACES, ROLE_WORKSPACE_MAP } from './roles.js';
import { STAFF_ROLES } from './staffRoles.js';

/** Canonical claim value -> admin-dashboard display role. Canonical values only. */
export const CLAIM_TO_UI_ROLE = Object.freeze({
    [STAFF_ROLES.ADMIN]: USER_ROLES.SUPER_ADMIN,
    [STAFF_ROLES.TOUR_MANAGER]: USER_ROLES.TOUR_MANAGER,
    [STAFF_ROLES.FINANCE_MANAGER]: USER_ROLES.FINANCE_MANAGER,
    [STAFF_ROLES.CONTENT_MANAGER]: USER_ROLES.CONTENT_MANAGER,
    [STAFF_ROLES.HOTEL_MANAGER]: USER_ROLES.HOTEL_MANAGER,
    [STAFF_ROLES.BOOKING_MANAGER]: USER_ROLES.BOOKING_MANAGER,
});

export const isKnownWorkspace = (id) =>
    typeof id === 'string' && Object.values(WORKSPACES).some((w) => w.id === id);

/**
 * The display role for a verified identity. Fails closed to null.
 * `isAdmin` mirrors isAdmin() in both rules files: it is already true for the
 * legacy `admin: true` claim flag as well as role === 'admin'.
 */
export function uiRoleForClaim({ isAdmin = false, claimRole = null } = {}) {
    if (isAdmin === true) return USER_ROLES.SUPER_ADMIN;
    if (typeof claimRole !== 'string') return null;
    return CLAIM_TO_UI_ROLE[claimRole] || null;
}

/**
 * Which workspace the dashboard shows. Non-admins are pinned to the one their
 * role maps to; only an admin may browse, and only an admin's saved preference
 * is honoured. No role means no workspace.
 */
export function resolveWorkspace({ role = null, isAdmin = false, preference = null } = {}) {
    if (!role) return null;
    if (isAdmin === true) return isKnownWorkspace(preference) ? preference : WORKSPACES.ADMIN_DASHBOARD.id;
    return ROLE_WORKSPACE_MAP[role] || null;
}

/**
 * Whether a dashboard module renders. A module must belong to the active
 * workspace AND to the claim-derived role's permission set.
 */
export function canSeeModule({ role = null, workspace = null, featureId = null } = {}) {
    if (!role || !workspace || !featureId) return false;
    const workspaceConfig = Object.values(WORKSPACES).find((w) => w.id === workspace);
    if (!workspaceConfig) return false;
    return workspaceConfig.modules.includes(featureId)
        && (ROLE_PERMISSIONS[role] || []).includes(featureId);
}

/** First module the given identity may see, or null. */
export function firstAllowedModule({ role = null, workspace = null } = {}) {
    if (!role || !workspace) return null;
    const workspaceConfig = Object.values(WORKSPACES).find((w) => w.id === workspace);
    return (workspaceConfig?.modules || []).find((m) => canSeeModule({ role, workspace, featureId: m })) || null;
}
