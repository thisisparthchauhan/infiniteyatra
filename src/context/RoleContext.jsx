import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { USER_ROLES, WORKSPACES } from '../config/roles';
import {
    canSeeModule,
    firstAllowedModule,
    isKnownWorkspace,
    resolveWorkspace,
    uiRoleForClaim,
} from '../config/adminWorkspace';
import { useAuth } from './AuthContext';

/**
 * SA-1B — ADMIN DASHBOARD WORKSPACE STATE. NOT AN AUTHORIZATION BOUNDARY.
 *
 * What this context decides: which dashboard modules are RENDERED.
 * What it must never decide: what a user is PERMITTED to do.
 *
 * Before SA-1B this seeded `currentRole` from localStorage and defaulted to
 * SUPER_ADMIN, so the UI's notion of "who am I" was attacker-writable and
 * defaulted to the most privileged value. It sat behind the admin-claim gate on
 * /admin, so it granted nothing extra in practice — but it was one reused import
 * away from becoming a real bypass, and PB-5 is about to add a non-admin staff
 * surface.
 *
 * Now `currentRole` is DERIVED from the verified ID token custom claim (surfaced
 * by AuthContext as `claimRole`) and there is no setter. localStorage persists
 * only a workspace *preference*; it is validated on read and honoured only for
 * an admin, who can reach every workspace anyway. No claim means no role, and
 * `hasPermission()` is then false for every module.
 *
 * The decision logic lives in src/config/adminWorkspace.js so it can be tested
 * directly — see tests/sa1b.rolecontext.test.mjs.
 */

const RoleContext = createContext();

const WORKSPACE_PREFERENCE_KEY = 'iy_admin_workspace';

const readWorkspacePreference = () => {
    try {
        const saved = localStorage.getItem(WORKSPACE_PREFERENCE_KEY);
        return isKnownWorkspace(saved) ? saved : null;
    } catch {
        // Private mode or blocked storage: a missing preference is not an error.
        return null;
    }
};

export const RoleProvider = ({ children }) => {
    const { currentUser } = useAuth();

    // The verified claim is the only input.
    const claimRole = currentUser?.claimRole || null;
    const isAdmin = currentUser?.isAdmin === true;

    // Fails closed: unauthenticated, customer, or a stale legacy claim such as
    // `operations` all resolve to null.
    const currentRole = useMemo(
        () => uiRoleForClaim({ isAdmin, claimRole }),
        [isAdmin, claimRole],
    );

    const [preference, setPreference] = useState(readWorkspacePreference);

    const currentWorkspace = useMemo(
        () => resolveWorkspace({ role: currentRole, isAdmin, preference }),
        [currentRole, isAdmin, preference],
    );

    useEffect(() => {
        if (!isAdmin || !currentWorkspace) return;
        try {
            localStorage.setItem(WORKSPACE_PREFERENCE_KEY, currentWorkspace);
        } catch { /* storage unavailable; the preference simply is not remembered */ }
    }, [isAdmin, currentWorkspace]);

    /** Ignored for non-admins, who have exactly one workspace. */
    const setCurrentWorkspace = (workspaceId) => {
        if (!isAdmin || !isKnownWorkspace(workspaceId)) return;
        setPreference(workspaceId);
    };

    const hasPermission = (featureId) =>
        canSeeModule({ role: currentRole, workspace: currentWorkspace, featureId });

    const getFirstAllowedTab = () =>
        firstAllowedModule({ role: currentRole, workspace: currentWorkspace });

    return (
        <RoleContext.Provider value={{
            currentRole,
            currentWorkspace,
            setCurrentWorkspace,
            hasPermission,
            getFirstAllowedTab,
            isAdmin,
            roles: USER_ROLES,
            workspaces: WORKSPACES,
        }}>
            {children}
        </RoleContext.Provider>
    );
};

export const useRole = () => useContext(RoleContext);
