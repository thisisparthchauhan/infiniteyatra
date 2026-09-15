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
 */

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { ALL_STAFF_ROLES, LEGACY_ROLE_VALUES, isStaffRole } = require('../functions/staffRoles.js');

const PROJECT_ID = process.env.GCLOUD_PROJECT || 'infiniteyatra-iy';

// --- args -------------------------------------------------------------------

const argv = process.argv.slice(2);
const APPLY = argv.includes('--apply');
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
    console.error('  node scripts/staff-claims.mjs --mapping <file.json> [--apply]\n');
    console.error(`  Allowed roles: ${ALL_STAFF_ROLES.join(', ')}\n`);
    process.exit(1);
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
if (typeof mapping !== 'object' || mapping === null || Array.isArray(mapping)) {
    usage('The mapping file must be a JSON object of { "email": "role" }.');
}

const entries = Object.entries(mapping);
if (entries.length === 0) usage('The mapping file is empty.');

// Validate every requested role before touching anything, so a typo cannot
// half-apply a batch.
const invalid = entries.filter(([, role]) => !isStaffRole(role));
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

const admin = require('firebase-admin');

async function main() {
    try {
        admin.initializeApp({ projectId: PROJECT_ID });
    } catch { /* already initialised */ }

    const auth = admin.auth();

    console.log(`\n  SA-1 staff claim alignment  -  project ${PROJECT_ID}`);
    console.log(`  Mode: ${APPLY ? 'APPLY (writes custom claims)' : 'DRY RUN (no changes)'}`);
    console.log(`  Accounts in mapping: ${entries.length}\n`);
    console.log('  ' + 'Account'.padEnd(34) + 'Current'.padEnd(18) + 'Proposed'.padEnd(18) + 'Action');
    console.log('  ' + '-'.repeat(84));

    let changes = 0;
    let failures = 0;

    for (const [email, proposed] of entries) {
        let current = '(no account)';
        let action = 'SKIP - not found';
        let user = null;

        try {
            user = await auth.getUserByEmail(email);
            const claims = user.customClaims || {};
            // Only the role is ever read or printed. No other claim, no token.
            current = typeof claims.role === 'string' ? claims.role
                : claims.admin === true ? 'admin (legacy flag)'
                    : '(none)';
            action = current === proposed ? 'none - already correct' : (APPLY ? 'UPDATED' : 'would update');
        } catch (err) {
            action = err.code === 'auth/user-not-found' ? 'SKIP - not found' : `ERROR ${err.code || ''}`;
            failures += 1;
        }

        if (user && current !== proposed) {
            changes += 1;
            if (APPLY) {
                try {
                    // Replace claims wholesale so a stale `admin: true` cannot survive.
                    await auth.setCustomUserClaims(user.uid, { role: proposed });
                } catch (err) {
                    action = `ERROR ${err.code || err.message}`;
                    failures += 1;
                }
            }
        }

        console.log('  ' + mask(email).padEnd(34) + String(current).padEnd(18) + proposed.padEnd(18) + action);
    }

    console.log('  ' + '-'.repeat(84));
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

main().catch((err) => {
    // Never print a stack: it can carry credential paths and internals.
    console.error(`\n  Failed: ${err.code || err.message}\n`);
    process.exit(1);
});
