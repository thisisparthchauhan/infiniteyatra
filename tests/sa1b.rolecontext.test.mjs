/**
 * SA-1B — RoleContext / admin-dashboard workspace state.
 *
 * Proves the UI role cannot become an authorization boundary: localStorage
 * cannot manufacture administrative authority, the SUPER_ADMIN display string
 * cannot be passed off as a claim, and an identity with no claim sees nothing.
 *
 * The decision logic is imported from src/config/adminWorkspace.js, so these
 * exercise the real code the provider runs — not a restatement of it. The
 * static checks at the end guard the wiring around it.
 *
 * Run: npm run test:sa1b
 */

import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import {
    CLAIM_TO_UI_ROLE,
    canSeeModule,
    firstAllowedModule,
    isKnownWorkspace,
    resolveWorkspace,
    uiRoleForClaim,
} from '../src/config/adminWorkspace.js';
import { USER_ROLES, WORKSPACES } from '../src/config/roles.js';
import { ALL_STAFF_ROLES, LEGACY_ROLE_VALUES } from '../src/config/staffRoles.js';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const ROLE_CONTEXT = read('../src/context/RoleContext.jsx');
const ADMIN_WORKSPACE = read('../src/config/adminWorkspace.js');
const APP = read('../src/App.jsx');
const SIDEBAR = read('../src/components/admin/AdminSidebar.jsx');

/** A module only an admin's workspace carries. */
const ADMIN_ONLY_MODULE = 'staff';

describe('localStorage cannot create administrative authority', () => {
    test('a saved workspace preference grants no role on its own', () => {
        // The attacker-controlled value is the workspace preference. With no
        // claim behind it, it resolves to no role and no workspace.
        const role = uiRoleForClaim({ isAdmin: false, claimRole: null });
        assert.equal(role, null);
        assert.equal(
            resolveWorkspace({ role, isAdmin: false, preference: WORKSPACES.ADMIN_DASHBOARD.id }),
            null,
            'the admin workspace must not be reachable without a claim',
        );
    });

    test('a forged preference cannot move a scoped role into the admin workspace', () => {
        const role = uiRoleForClaim({ claimRole: 'booking_manager' });
        assert.equal(role, USER_ROLES.BOOKING_MANAGER);
        const workspace = resolveWorkspace({
            role,
            isAdmin: false,
            preference: WORKSPACES.ADMIN_DASHBOARD.id, // forged
        });
        assert.notEqual(workspace, WORKSPACES.ADMIN_DASHBOARD.id);
        assert.equal(workspace, WORKSPACES.BOOKING_MANAGER.id);
        assert.equal(
            canSeeModule({ role, workspace, featureId: ADMIN_ONLY_MODULE }), false,
            'booking_manager must not reach staff management by editing localStorage',
        );
    });

    test('an unknown workspace string is rejected rather than trusted', () => {
        assert.equal(isKnownWorkspace('admin_workspace_lol'), false);
        assert.equal(isKnownWorkspace(null), false);
        const role = uiRoleForClaim({ isAdmin: true });
        // An admin with a junk preference falls back to their own workspace,
        // never to an undefined one.
        assert.equal(
            resolveWorkspace({ role, isAdmin: true, preference: 'admin_workspace_lol' }),
            WORKSPACES.ADMIN_DASHBOARD.id,
        );
    });

    test('the provider exposes no role setter and no SUPER_ADMIN default', () => {
        assert.ok(!/setCurrentRole/.test(ROLE_CONTEXT), 'currentRole must be derived, never set');
        assert.ok(
            !/useState\([^)]*USER_ROLES\.SUPER_ADMIN/.test(ROLE_CONTEXT),
            'SUPER_ADMIN must not seed any state',
        );
        assert.ok(
            !/localStorage\.getItem\(['"]iy_admin_role/.test(ROLE_CONTEXT),
            'the role must never be read back from localStorage',
        );
        // Only the workspace preference may be persisted.
        const persisted = [...ROLE_CONTEXT.matchAll(/localStorage\.setItem\(\s*([A-Za-z_]+)/g)].map((m) => m[1]);
        assert.deepEqual([...new Set(persisted)], ['WORKSPACE_PREFERENCE_KEY']);
    });
});

describe('the SUPER_ADMIN string cannot bypass claim checks', () => {
    test('display strings arriving as a claim map to nothing', () => {
        for (const forged of ['Admin Dashboard', 'SUPER_ADMIN', 'Tour Manager', 'super_admin']) {
            assert.equal(
                uiRoleForClaim({ claimRole: forged }), null,
                `"${forged}" is a display value, never a claim`,
            );
        }
    });

    test('the claim->UI map accepts canonical machine roles only', () => {
        assert.deepEqual(Object.keys(CLAIM_TO_UI_ROLE).sort(), [...ALL_STAFF_ROLES].sort());
        for (const legacy of LEGACY_ROLE_VALUES) {
            assert.equal(uiRoleForClaim({ claimRole: legacy }), null, `legacy "${legacy}" must grant nothing`);
        }
    });

    test('a non-string claim is refused', () => {
        for (const junk of [true, 1, {}, [], undefined, null]) {
            assert.equal(uiRoleForClaim({ claimRole: junk }), null);
        }
        // `isAdmin` is compared strictly, so a truthy non-true value is not admin.
        assert.equal(uiRoleForClaim({ isAdmin: 'yes', claimRole: null }), null);
        assert.equal(uiRoleForClaim({ isAdmin: 1, claimRole: null }), null);
    });
});

describe('no claim means no protected access', () => {
    test('an unauthenticated identity sees no module and no first tab', () => {
        const role = uiRoleForClaim({});
        const workspace = resolveWorkspace({ role, isAdmin: false, preference: null });
        assert.equal(role, null);
        assert.equal(workspace, null);
        assert.equal(firstAllowedModule({ role, workspace }), null);
        for (const m of ['overview', ADMIN_ONLY_MODULE, 'bookings', 'finance']) {
            assert.equal(canSeeModule({ role, workspace, featureId: m }), false);
        }
    });

    test('a customer (signed in, no role claim) sees nothing', () => {
        const role = uiRoleForClaim({ isAdmin: false, claimRole: null });
        assert.equal(role, null);
        assert.equal(canSeeModule({ role, workspace: WORKSPACES.ADMIN_DASHBOARD.id, featureId: 'overview' }), false);
    });
});

describe('the admin claim works and scoped roles stay scoped', () => {
    test('admin reaches the admin workspace and its admin-only module', () => {
        const role = uiRoleForClaim({ isAdmin: true, claimRole: 'admin' });
        assert.equal(role, USER_ROLES.SUPER_ADMIN);
        const workspace = resolveWorkspace({ role, isAdmin: true, preference: null });
        assert.equal(workspace, WORKSPACES.ADMIN_DASHBOARD.id);
        assert.equal(canSeeModule({ role, workspace, featureId: ADMIN_ONLY_MODULE }), true);
        assert.ok(firstAllowedModule({ role, workspace }), 'admin must land on a real tab');
    });

    test('the legacy admin:true claim flag is honoured, matching the rules files', () => {
        assert.equal(uiRoleForClaim({ isAdmin: true, claimRole: null }), USER_ROLES.SUPER_ADMIN);
    });

    test('each scoped role is confined to its own workspace', () => {
        const scoped = ALL_STAFF_ROLES.filter((r) => r !== 'admin');
        for (const claimRole of scoped) {
            const role = uiRoleForClaim({ claimRole });
            const workspace = resolveWorkspace({ role, isAdmin: false, preference: null });
            assert.ok(role, `${claimRole} should map to a display role`);
            assert.notEqual(workspace, WORKSPACES.ADMIN_DASHBOARD.id, `${claimRole} must not land in the admin workspace`);
            assert.equal(
                canSeeModule({ role, workspace, featureId: ADMIN_ONLY_MODULE }), false,
                `${claimRole} must not see staff management`,
            );
        }
    });

    test('booking_manager does not reach unrelated content or finance modules', () => {
        const role = uiRoleForClaim({ claimRole: 'booking_manager' });
        const workspace = resolveWorkspace({ role, isAdmin: false, preference: null });
        for (const foreign of ['stories', 'homepage', 'media', 'hotel-vendors', ADMIN_ONLY_MODULE]) {
            assert.equal(
                canSeeModule({ role, workspace, featureId: foreign }), false,
                `booking_manager must not see "${foreign}"`,
            );
        }
    });
});

describe('wiring', () => {
    test('the provider derives its role from the verified claim', () => {
        assert.match(ROLE_CONTEXT, /useAuth\(\)/);
        assert.match(ROLE_CONTEXT, /currentUser\?\.claimRole/);
        assert.match(ROLE_CONTEXT, /currentUser\?\.isAdmin === true/);
    });

    test('AuthProvider is mounted outside RoleProvider so the claim is available', () => {
        const auth = APP.indexOf('<AuthProvider>');
        const role = APP.indexOf('<RoleProvider>');
        assert.ok(auth !== -1 && role !== -1, 'both providers must be mounted');
        assert.ok(auth < role, 'AuthProvider must wrap RoleProvider, not the other way round');
    });

    test('the workspace switcher is admin-only', () => {
        assert.match(SIDEBAR, /\{isAdmin && \(/);
        assert.ok(!/setCurrentRole/.test(SIDEBAR), 'the sidebar must not set a role');
    });

    test('no hardcoded email grant survives in the dashboard UI path', () => {
        for (const [name, src] of [['RoleContext', ROLE_CONTEXT], ['adminWorkspace', ADMIN_WORKSPACE], ['AdminSidebar', SIDEBAR]]) {
            assert.ok(!/@gmail\.com/.test(src), `${name} must contain no email grant`);
        }
    });
});
