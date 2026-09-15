/**
 * SA-1 — Staff authorization alignment.
 *
 * Two kinds of assertion, both real:
 *   - behavioural: requireStaff runs for real against constructed requests
 *   - structural + drift: the role vocabulary is parsed out of the actual rules
 *     files, so client, server and rules cannot silently diverge again. That
 *     divergence is the whole reason SA-1 exists.
 *
 * Run: npm run test:sa1
 */

import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const src = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

/**
 * Strip comments before asserting on source.
 *
 * These tests assert the ABSENCE of things like a legacy role value. Without
 * this, a comment merely *explaining* that the value was removed would fail the
 * test - so the assertions would be testing prose rather than behaviour.
 */
const code = (text) => text
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')   // JSX comments
    .replace(/\/\*[\s\S]*?\*\//g, ' ')         // block comments
    .replace(/^\s*\/\/.*$/gm, ' ');            // line comments

const { STAFF_ROLES, ALL_STAFF_ROLES, isStaffRole, isLegacyRole, LEGACY_ROLE_VALUES } =
    require('../functions/staffRoles.js');
const { requireStaff, requireFirebaseUser, __setDepsForTesting } = require('../functions/packageBookings.js');

const STORAGE_RULES = src('../storage.rules');
const FIRESTORE_RULES = src('../firestore.rules');
const CLIENT_ROLES = src('../src/config/staffRoles.js');
const AUTH_CONTEXT = code(src('../src/context/AuthContext.jsx'));
const ROLE_ROUTE = code(src('../src/components/auth/RoleRoute.jsx'));
const APP = code(src('../src/App.jsx'));
const INVITE = code(src('../src/components/admin/AddStaffModal.jsx'));
const FUNCTIONS_INDEX = src('../functions/index.js');
const TOOL = src('../scripts/staff-claims.mjs');

// --- harness ----------------------------------------------------------------

const mockRes = () => ({
    statusCode: null, body: null,
    status(c) { this.statusCode = c; return this; },
    json(p) { this.body = p; return this; },
});

/** Run requireStaff against a request carrying the given verified claims. */
function guard(allowed, authUser) {
    const req = authUser ? { authUser } : {};
    const res = mockRes();
    let passed = false;
    requireStaff(allowed)(req, res, () => { passed = true; });
    return { passed, res };
}

/** Build the authUser shape requireFirebaseUser produces from a decoded token. */
const asActor = (claims) => ({
    uid: 'u1',
    email: 'someone@example.com',
    role: typeof claims.role === 'string' ? claims.role : null,
    isAdminClaim: claims.admin === true || claims.role === 'admin',
});

// ---------------------------------------------------------------------------
// [1][2][3][11][12] Recognised claims
// ---------------------------------------------------------------------------

test('[1][11] an admin claim is recognised by every staff guard', () => {
    for (const allowed of [['admin'], ['booking_manager'], ['finance_manager'], ALL_STAFF_ROLES]) {
        assert.equal(guard(allowed, asActor({ role: 'admin' })).passed, true);
    }
    // the legacy boolean form honoured by both rules files
    assert.equal(guard(['booking_manager'], asActor({ admin: true })).passed, true);
});

test('[2][12] booking_manager is recognised where permitted, refused where not', () => {
    assert.equal(guard(['admin', 'booking_manager'], asActor({ role: 'booking_manager' })).passed, true);
    const denied = guard(['admin'], asActor({ role: 'booking_manager' }));
    assert.equal(denied.passed, false);
    assert.equal(denied.res.statusCode, 403);
});

test('[3] finance_manager is recognised where permitted', () => {
    assert.equal(guard(['admin', 'finance_manager'], asActor({ role: 'finance_manager' })).passed, true);
    assert.equal(guard(['booking_manager'], asActor({ role: 'finance_manager' })).passed, false);
});

// ---------------------------------------------------------------------------
// [4][5][6][7][13] Denials
// ---------------------------------------------------------------------------

test('[4][13] a missing or customer-level claim is denied with 403', () => {
    for (const claims of [{}, { role: null }, { role: 'customer' }, { role: '' }]) {
        const r = guard(['admin', 'booking_manager'], asActor(claims));
        assert.equal(r.passed, false, `claims ${JSON.stringify(claims)} must be denied`);
        assert.equal(r.res.statusCode, 403);
    }
});

test('[5][6][7] legacy role values are denied as machine roles', () => {
    for (const legacy of ['operations', 'finance', 'guide', 'ops']) {
        const r = guard(ALL_STAFF_ROLES, asActor({ role: legacy }));
        assert.equal(r.passed, false, `"${legacy}" must not authorise anything`);
        assert.equal(r.res.statusCode, 403);
        assert.ok(isLegacyRole(legacy) && !isStaffRole(legacy));
    }
});

test('[8] an email alone grants nothing, whatever the address', () => {
    // Deliberately address-agnostic. The property is that the ADDRESS plays no
    // part in the decision, so pinning real staff addresses here would both
    // retain personal data SA-1 just removed and test a weaker claim.
    for (const email of ['anyone@example.com', 'founder@example.com', 'ops@example.com', '']) {
        const r = guard(['admin'], { uid: 'u1', email, role: null, isAdminClaim: false });
        assert.equal(r.passed, false, `"${email}" must not authorise by address`);
        assert.equal(r.res.statusCode, 403);
    }
    // and the guard never reads the field at all
    assert.ok(!/actor\.email/.test(src('../functions/packageBookings.js').match(/function requireStaff[\s\S]*?\n}/)[0]),
        'requireStaff must not reference the email field');
});

test('[9] a users.role-shaped field on the request grants nothing', () => {
    // Even if a profile role is smuggled onto the actor, only the verified
    // claim fields are consulted.
    const r = guard(['admin'], { uid: 'u1', email: 'x@y.z', role: null, isAdminClaim: false, profileRole: 'admin', users: { role: 'admin' } });
    assert.equal(r.passed, false);
});

test('[10] a previously privileged address without a claim is denied', () => {
    // Someone who used to reach the admin UI via the removed email list now
    // holds no claim, and is refused like anyone else.
    const r = guard(['admin'], { uid: 'u1', email: 'legacy-admin@example.com', role: 'customer', isAdminClaim: false });
    assert.equal(r.passed, false);
    assert.equal(r.res.statusCode, 403);
});

test('the 403 body leaks nothing about the permission model', () => {
    const { res } = guard(['admin', 'booking_manager'], asActor({ role: 'customer' }));
    const body = JSON.stringify(res.body);
    for (const leak of ['admin', 'booking_manager', 'customer', 'claim', 'role']) {
        assert.ok(!body.toLowerCase().includes(leak), `403 body must not mention "${leak}"`);
    }
});

test('requireStaff refuses to be constructed with a non-canonical role', () => {
    for (const bad of ['operations', 'ops', 'superuser', '', null]) {
        assert.throws(() => requireStaff([bad]), /not a canonical staff role/);
    }
});

test('requireStaff without requireFirebaseUser in front fails closed', () => {
    const res = mockRes();
    let passed = false;
    requireStaff(['admin'])({}, res, () => { passed = true; });
    assert.equal(passed, false);
    assert.equal(res.statusCode, 401);
});

// ---------------------------------------------------------------------------
// [14] Token handling
// ---------------------------------------------------------------------------

test('[14] a malformed or unverifiable token is denied 401 and yields no actor', async () => {
    __setDepsForTesting({
        auth: () => ({ verifyIdToken: async () => { const e = new Error('bad'); e.code = 'auth/argument-error'; throw e; } }),
        firestore: () => ({}), serverTimestamp: () => null,
    });
    const req = { headers: { authorization: 'Bearer not-a-real-token' } };
    const res = mockRes();
    let nexted = false;
    await requireFirebaseUser(req, res, () => { nexted = true; });
    assert.equal(nexted, false);
    assert.equal(res.statusCode, 401);
    assert.equal(req.authUser, undefined);
});

test('a verified token surfaces only uid, email and the role claim', async () => {
    __setDepsForTesting({
        auth: () => ({ verifyIdToken: async () => ({
            uid: 'u9', email: 'staff@example.com', role: 'booking_manager',
            // extra claims that must not become authorization inputs
            admin: false, iss: 'x', aud: 'y', custom_junk: 'z',
        }) }),
        firestore: () => ({}), serverTimestamp: () => null,
    });
    const req = { headers: { authorization: 'Bearer good' } };
    const res = mockRes();
    await requireFirebaseUser(req, res, () => {});
    assert.deepEqual(Object.keys(req.authUser).sort(), ['email', 'isAdminClaim', 'role', 'uid']);
    assert.equal(req.authUser.role, 'booking_manager');
    assert.equal(req.authUser.isAdminClaim, false);
});

// ---------------------------------------------------------------------------
// [15][16] Invite flow
// ---------------------------------------------------------------------------

test('[15] createStaffAccount rejects a non-canonical role before issuing a claim', () => {
    assert.match(FUNCTIONS_INDEX, /if \(!isStaffRole\(role\)\)/);
    // the rejection must come before the claim is set
    const guardIdx = FUNCTIONS_INDEX.indexOf('if (!isStaffRole(role))');
    const claimIdx = FUNCTIONS_INDEX.indexOf('setCustomUserClaims');
    assert.ok(guardIdx !== -1 && claimIdx !== -1 && guardIdx < claimIdx,
        'the role check must precede setCustomUserClaims');
});

test('[16] the invite UI offers only canonical machine roles', () => {
    assert.match(INVITE, /ALL_STAFF_ROLES\.map/);
    for (const legacy of ["'operations'", "'guide'", "'ops'"]) {
        assert.ok(!INVITE.includes(`${legacy},`), `the invite picker must not offer ${legacy}`);
    }
    assert.match(INVITE, /role: 'booking_manager'/, 'the default must be a canonical role');
    // label and value stay distinct
    assert.match(INVITE, /STAFF_ROLE_LABELS\[role\]/);
});

// ---------------------------------------------------------------------------
// Client authorization sources
// ---------------------------------------------------------------------------

test('AuthContext derives authorization from the verified token claim only', () => {
    assert.match(AUTH_CONTEXT, /getIdTokenResult\(user\)/);
    assert.match(AUTH_CONTEXT, /claims\.admin === true \|\| claimRole === 'admin'/);
    // the email list and the profile-role grant are gone
    assert.ok(!/ADMIN_EMAILS\s*=/.test(AUTH_CONTEXT), 'no hardcoded admin email list may remain');
    assert.ok(!AUTH_CONTEXT.includes('isHardcodedAdmin'), 'no email-derived admin flag may remain');
    assert.ok(!/role = userData\.role/.test(AUTH_CONTEXT), 'profile role must not become the auth role');
    // profile role is retained but under a name that cannot be confused
    assert.match(AUTH_CONTEXT, /profileRole: userData\.role/);
});

test('AuthContext fails closed when claims cannot be resolved', () => {
    assert.match(AUTH_CONTEXT, /isAdmin: false, isStaff: false/);
});

test('RoleRoute grants on the claim, never on an email address', () => {
    assert.ok(!/currentUser\.email === '/.test(ROLE_ROUTE), 'no direct email grant may remain');
    assert.match(ROLE_ROUTE, /currentUser\.claimRole/);
    assert.match(ROLE_ROUTE, /allowedRoles\.includes\(claimRole\)/);
});

test('the /admin route uses canonical roles and is not broadened', () => {
    assert.ok(!APP.includes("'ops'"), "the non-existent 'ops' role must be gone");
    assert.match(APP, /allowedRoles=\{\['admin'\]\}/,
        '/admin mounts every module, so it stays admin-only until PB-5 adds a booking-scoped surface');
});

// ---------------------------------------------------------------------------
// Vocabulary drift guard
// ---------------------------------------------------------------------------

test('server, client and storage.rules agree on the staff role vocabulary', () => {
    // Read the allowlist array itself; matching the whole function body would
    // also pick up the literal 'role' from token.get('role', '').
    const block = STORAGE_RULES.match(/function isStaff\(\)[\s\S]*?\[([\s\S]*?)\]/);
    assert.ok(block, 'could not find the isStaff() role array in storage.rules');
    const fromRules = [...block[1].matchAll(/'([a-z_]+)'/g)].map((m) => m[1]).sort();

    assert.deepEqual([...ALL_STAFF_ROLES].sort(), fromRules,
        'functions/staffRoles.js has drifted from storage.rules isStaff()');

    const fromClient = [...CLIENT_ROLES.matchAll(/^\s+[A-Z_]+: '([a-z_]+)',$/gm)].map((m) => m[1]).sort();
    assert.deepEqual(fromClient, fromRules,
        'src/config/staffRoles.js has drifted from storage.rules isStaff()');
});

test('firestore.rules isAdmin accepts exactly the admin claim forms the server does', () => {
    assert.match(FIRESTORE_RULES, /token\.get\('admin', false\) == true/);
    assert.match(FIRESTORE_RULES, /token\.get\('role', ''\) == 'admin'/);
    assert.equal(STAFF_ROLES.ADMIN, 'admin');
});

test('no legacy role value appears in any authorization decision', () => {
    for (const file of [CLIENT_ROLES, ROLE_ROUTE, APP]) {
        for (const legacy of LEGACY_ROLE_VALUES) {
            const asDecision = new RegExp(`(allowedRoles|includes|===)\\s*.{0,20}['"]${legacy}['"]`);
            assert.ok(!asDecision.test(file), `"${legacy}" must not take part in an authorization decision`);
        }
    }
});

// ---------------------------------------------------------------------------
// [17][18][19][20] Provisioning tool safety
// ---------------------------------------------------------------------------

test('[17] the provisioning tool is dry-run unless --apply is given', () => {
    assert.match(TOOL, /const APPLY = argv\.includes\('--apply'\)/);
    assert.match(TOOL, /DRY RUN - nothing was written/);
    assert.match(TOOL, /if \(APPLY\)/);
});

test('[18] it refuses to run without an explicit mapping, and never infers a role', () => {
    assert.match(TOOL, /A mapping file is required\. This tool never infers a role/);
    assert.match(TOOL, /entries\.filter\(\(\[, role\]\) => !isStaffRole\(role\)\)/);
    assert.match(TOOL, /legacy value - choose a canonical role deliberately/);
});

test('[18b] the read-only check mode cannot become a way to write an unvalidated role', () => {
    // SA-1B added --check, which reports current claims and proposes nothing.
    // Role validation is skipped there only because nothing is written, so the
    // two flags must be mutually exclusive.
    assert.match(TOOL, /--check is read-only and cannot be combined with --apply/);
    assert.match(TOOL, /const invalid = CHECK \? \[\] : entries\.filter/,
        'validation may be skipped only in check mode');
    assert.match(TOOL, /if \(CHECK && APPLY\)/);
    // Check mode must return before reaching the write branch.
    const checkBlock = TOOL.match(/if \(CHECK\) \{[\s\S]*?continue;\s*\}/);
    assert.ok(checkBlock, 'check mode must short-circuit each account before any write');
});

test('[19] it never exports or enumerates the auth database', () => {
    // Admin SDK enumeration, and - since SA-1B moved the tool onto the Identity
    // Toolkit REST API - the REST endpoints that can return more than one named
    // account.
    for (const forbidden of ['listUsers', 'auth:export', 'exportUsers', 'downloadUsers',
        'accounts:batchGet', 'accounts:query', 'accounts:batchDelete']) {
        assert.ok(!TOOL.includes(forbidden), `the tool must not use ${forbidden}`);
    }
    // It looks up only named accounts, one address per request.
    assert.match(TOOL, /getUserByEmail\(client, email\)/);
    assert.match(TOOL, /'\/accounts:lookup', \{ email: \[email\] \}/,
        'the lookup must carry exactly the one address it was asked for');
});

test('[20] it emits no secrets, tokens, hashes or full addresses', () => {
    for (const forbidden of ['passwordHash', 'passwordSalt', 'getIdToken', 'createCustomToken', 'console.log(user)']) {
        assert.ok(!TOOL.includes(forbidden), `the tool must not print ${forbidden}`);
    }
    assert.match(TOOL, /const mask = \(email\)/, 'identifiers must be masked');
    assert.match(TOOL, /Never print a stack/, 'stacks can carry credential paths');
});

test('mapping files are gitignored so staff addresses are not committed', () => {
    // Kept in scripts/.gitignore rather than the root file, so this rule stays
    // isolated from unrelated pre-existing ignore changes.
    assert.match(src('../scripts/.gitignore'), /staff-roles\*\.json/);
});
