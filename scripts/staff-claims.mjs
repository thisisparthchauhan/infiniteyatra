#!/usr/bin/env node
/**
 * SA-1 — Staff custom-claim alignment utility.
 *
 * DRY RUN BY DEFAULT. Writing claims requires an explicit --apply.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 *   - never exports or enumerates the Firebase Auth user database
 *   - never prints password hashes, salts, ID tokens or secrets
 *   - never touches customers; it looks up only the accounts you name
 *   - never infers a role; every mapping must be supplied explicitly
 *
 * Mapping a real person from a legacy value such as `operations` to a real role
 * is an owner decision with security consequences, so this tool refuses to
 * guess. It reports what is, and what you have asked for, and stops.
 *
 * USAGE
 *   node scripts/staff-claims.mjs --mapping scripts/staff-roles.json    # dry run
 *   node scripts/staff-claims.mjs --mapping scripts/staff-roles.json --apply
 *
 * MAPPING FILE  (keep it out of git - see .gitignore)
 *   { "someone@example.com": "booking_manager",
 *     "another@example.com": "admin" }
 *
 * CREDENTIALS
 *   Application Default Credentials, e.g.
 *     gcloud auth application-default login
 *   No service-account JSON is read from, or written to, this repository.
 *
 *   SA-1B: this talks to the Identity Toolkit REST API rather than through
 *   firebase-admin. The Admin SDK does not forward an `x-goog-user-project`
 *   header, and identitytoolkit.googleapis.com rejects USER credentials that
 *   arrive without one (HTTP 403, surfaced as auth/internal-error). Sending the
 *   header ourselves is what lets `gcloud auth application-default login` work,
 *   so provisioning needs no long-lived service-account key. Behaviour is
 *   otherwise unchanged: named accounts only, dry run by default.
 */

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { ALL_STAFF_ROLES, LEGACY_ROLE_VALUES, isStaffRole, isLegacyRole } = require('../functions/staffRoles.js');

const PROJECT_ID = process.env.GCLOUD_PROJECT || 'infiniteyatra-iy';

// --- args -------------------------------------------------------------------

const argv = process.argv.slice(2);
const APPLY = argv.includes('--apply');
// Read-only audit: report what each named account currently holds and write
// nothing. Answers "does anyone still carry a legacy claim?" without having to
// propose a role for accounts that should end up with no staff access at all.
const CHECK = argv.includes('--check');
const mappingIdx = argv.indexOf('--mapping');
const mappingPath = mappingIdx !== -1 ? argv[mappingIdx + 1] : null;

/** Never print a full address. */
const mask = (email) => {
    if (typeof email !== 'string' || !email.includes('@')) return '(unknown)';
    const [user, domain] = email.split('@');
    const head = user.slice(0, 1);
    const tail = user.length > 2 ? user.slice(-2) : '';
    return `${head}${'•'.repeat(Math.max(3, user.length - 3))}${tail}@${domain}`;
};

function usage(msg) {
    if (msg) console.error(`\n  ${msg}\n`);
    console.error('  node scripts/staff-claims.mjs --mapping <file.json> [--apply|--check]\n');
    console.error(`  Allowed roles: ${ALL_STAFF_ROLES.join(', ')}\n`);
    process.exit(1);
}

if (CHECK && APPLY) {
    usage('--check is read-only and cannot be combined with --apply.');
}

if (!mappingPath) {
    usage('A mapping file is required. This tool never infers a role for anyone.');
}

let mapping;
try {
    mapping = JSON.parse(readFileSync(mappingPath, 'utf8'));
} catch (err) {
    usage(`Could not read the mapping file: ${err.message}`);
}
if (CHECK && Array.isArray(mapping)) {
    // In check mode the proposed role is meaningless, so a plain list is allowed.
    mapping = Object.fromEntries(mapping.map((email) => [email, null]));
}
if (typeof mapping !== 'object' || mapping === null || Array.isArray(mapping)) {
    usage('The mapping file must be a JSON object of { "email": "role" }.');
}

const entries = Object.entries(mapping);
if (entries.length === 0) usage('The mapping file is empty.');

// Validate every requested role before touching anything, so a typo cannot
// half-apply a batch.
const invalid = CHECK ? [] : entries.filter(([, role]) => !isStaffRole(role));
if (invalid.length > 0) {
    console.error('\n  Refusing to run - unsupported role(s) requested:\n');
    for (const [email, role] of invalid) {
        const hint = LEGACY_ROLE_VALUES.includes(role)
            ? ' (legacy value - choose a canonical role deliberately, it is not auto-mapped)'
            : '';
        console.error(`    ${mask(email)} -> "${role}"${hint}`);
    }
    console.error(`\n  Allowed: ${ALL_STAFF_ROLES.join(', ')}\n`);
    process.exit(1);
}

// --- run --------------------------------------------------------------------

const { GoogleAuth } = require('google-auth-library');

const IDENTITY_TOOLKIT = `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}`;

/**
 * One authenticated POST. The quota-project header is the whole reason this
 * path exists; without it user ADC is refused by the API.
 */
async function idToolkit(client, path, body) {
    const res = await client.request({
        url: `${IDENTITY_TOOLKIT}${path}`,
        method: 'POST',
        data: body,
        headers: { 'x-goog-user-project': PROJECT_ID },
    });
    return res.data || {};
}

/**
 * Look up exactly ONE named address. There is no listing call anywhere in this
 * file: an account you did not name is never read.
 */
async function getUserByEmail(client, email) {
    const data = await idToolkit(client, '/accounts:lookup', { email: [email] });
    const account = (data.users || [])[0];
    if (!account) {
        const err = new Error('no such account');
        err.code = 'auth/user-not-found';
        throw err;
    }
    // Only these two fields are ever read. The response also carries password
    // hash material and provider records; none of it is touched or printed.
    return { uid: account.localId, customClaims: parseClaims(account.customAttributes) };
}

function parseClaims(raw) {
    if (typeof raw !== 'string' || raw === '') return {};
    try { return JSON.parse(raw); } catch { return {}; }
}

/** Replaces the claim blob wholesale, so a stale `admin: true` cannot survive. */
async function setCustomUserClaims(client, uid, claims) {
    await idToolkit(client, '/accounts:update', {
        localId: uid,
        customAttributes: JSON.stringify(claims),
    });
}

/** Reads the account back so an applied claim is verified, not assumed. */
async function readBackRole(client, email) {
    const user = await getUserByEmail(client, email);
    return typeof user.customClaims.role === 'string' ? user.customClaims.role : '(none)';
}

async function main() {
    const auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        clientOptions: { quotaProjectId: PROJECT_ID },
    });
    const client = await auth.getClient();

    console.log(`\n  SA-1 staff claim alignment  -  project ${PROJECT_ID}`);
    console.log(`  Mode: ${CHECK ? 'CHECK (read-only audit)' : APPLY ? 'APPLY (writes custom claims)' : 'DRY RUN (no changes)'}`);
    console.log(`  Accounts in mapping: ${entries.length}\n`);
    console.log('  ' + 'Account'.padEnd(34) + 'Current'.padEnd(18)
        + (CHECK ? 'Staff access?' : 'Proposed'.padEnd(18) + 'Action'));
    console.log('  ' + '-'.repeat(84));

    let changes = 0;
    let failures = 0;

    for (const [email, proposed] of entries) {
        let current = '(no account)';
        let action = 'SKIP - not found';
        let user = null;

        try {
            user = await getUserByEmail(client, email);
            const claims = user.customClaims || {};
            // Only the role is ever read or printed. No other claim, no token.
            current = typeof claims.role === 'string' ? claims.role
                : claims.admin === true ? 'admin (legacy flag)'
                    : '(none)';
            action = current === proposed ? 'none - already correct' : (APPLY ? 'UPDATED' : 'would update');
        } catch (err) {
            action = err.code === 'auth/user-not-found' ? 'SKIP - not found' : `ERROR ${err.code || errText(err)}`;
            failures += 1;
        }

        if (CHECK) {
            const role = user ? (user.customClaims || {}).role : null;
            const verdict = !user ? '-'
                : (user.customClaims || {}).admin === true || isStaffRole(role)
                    ? 'YES - staff'
                    : isLegacyRole(role) ? 'NO - legacy claim, recognised by nothing' : 'no';
            console.log('  ' + mask(email).padEnd(34) + String(current).padEnd(18) + verdict);
            continue;
        }

        if (user && current !== proposed) {
            changes += 1;
            if (APPLY) {
                try {
                    // Replace claims wholesale so a stale `admin: true` cannot survive.
                    await setCustomUserClaims(client, user.uid, { role: proposed });
                    // Verify against the server rather than trusting the write.
                    const confirmed = await readBackRole(client, email);
                    action = confirmed === proposed
                        ? `UPDATED - verified ${confirmed}`
                        : `MISMATCH - server says ${confirmed}`;
                    if (confirmed !== proposed) failures += 1;
                } catch (err) {
                    action = `ERROR ${err.code || errText(err)}`;
                    failures += 1;
                }
            }
        }

        console.log('  ' + mask(email).padEnd(34) + String(current).padEnd(18) + proposed.padEnd(18) + action);
    }

    console.log('  ' + '-'.repeat(84));

    if (CHECK) {
        console.log(`\n  Read-only audit of ${entries.length} named account(s); nothing was written.\n`);
        return;
    }

    console.log(`\n  ${changes} account(s) need a change; ${failures} problem(s).`);

    if (!APPLY) {
        console.log('\n  DRY RUN - nothing was written. Re-run with --apply to commit these changes.\n');
    } else if (changes > 0) {
        console.log('\n  Claims updated. Affected staff must sign out and back in, or wait for');
        console.log('  their ID token to refresh (up to 1 hour), before the new role takes effect.\n');
    } else {
        console.log('');
    }
}

/** Short, flat error text. Never a stack, never a response body. */
function errText(err) {
    const status = err?.response?.status;
    return status ? `HTTP ${status}` : String(err?.message || 'unknown').split('\n')[0].slice(0, 120);
}

main().catch((err) => {
    // Never print a stack: it can carry credential paths and internals.
    console.error(`\n  Failed: ${err.code || errText(err)}\n`);
    process.exit(1);
});
