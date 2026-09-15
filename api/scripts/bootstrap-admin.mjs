#!/usr/bin/env node
/**
 * First-admin bootstrap.
 *
 * Creates ONE admin account, and only when the staff table is empty. After that
 * it refuses, so it cannot be used to quietly mint a second administrator on a
 * running system — staff are invited through the admin UI instead.
 *
 * The password is read from the environment, never from an argument, so it does
 * not land in shell history or the process list.
 *
 *   IY_ADMIN_EMAIL=you@example.com IY_ADMIN_PASSWORD='...' node scripts/bootstrap-admin.mjs
 */

import { query, queryOne, closePool } from '../src/db/pool.js';
import { hashPassword, normaliseEmail } from '../src/services/auth.js';
import { publicId } from '../src/lib/ids.js';

const email = process.env.IY_ADMIN_EMAIL;
const password = process.env.IY_ADMIN_PASSWORD;
const fullName = process.env.IY_ADMIN_NAME || null;

const fail = (msg) => { console.error(`\n  ${msg}\n`); process.exit(1); };

if (!email || !password) fail('Set IY_ADMIN_EMAIL and IY_ADMIN_PASSWORD in the environment.');
if (password.length < 12) fail('The first admin password must be at least 12 characters.');

const existing = await queryOne('SELECT COUNT(*) AS c FROM staff_users');
if (Number(existing.c) > 0) {
    fail('Staff already exist. Refusing to bootstrap a second admin — invite staff through the admin UI.');
}

const mask = (e) => { const [u, d] = e.split('@'); return `${u[0]}${'*'.repeat(Math.max(3, u.length - 2))}${u.slice(-1)}@${d}`; };

await query(
    `INSERT INTO staff_users (public_id, email, email_normalised, password_hash, full_name, role)
     VALUES (?, ?, ?, ?, ?, 'admin')`,
    [publicId(), email.trim(), normaliseEmail(email), await hashPassword(password), fullName],
);

console.log(`\n  Admin created for ${mask(email)} with role "admin".`);
console.log('  Sign in at /admin. This script will refuse to run again.\n');
await closePool();
