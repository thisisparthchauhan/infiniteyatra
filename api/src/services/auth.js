/**
 * Password hashing and server-side sessions.
 *
 * No JWT. A session is a row, so logout, "sign out everywhere" and revocation
 * are real rather than advisory, and a leaked cookie can be killed. The cookie
 * holds an opaque random token; only its sha256 is stored, so a database dump
 * yields no usable session.
 */

import argon2 from 'argon2';
import { query, queryOne } from '../db/pool.js';
import { publicId, sessionToken, sha256 } from '../lib/ids.js';
import { config } from '../config.js';

/** argon2id — memory-hard, the current recommendation for password storage. */
const ARGON_OPTS = { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 };

export const hashPassword = (plain) => argon2.hash(plain, ARGON_OPTS);

export async function verifyPassword(hash, plain) {
    try { return await argon2.verify(hash, plain); }
    catch { return false; }   // a malformed stored hash must read as "wrong", not throw
}

export const normaliseEmail = (e) => String(e || '').trim().toLowerCase();

const MAX_FAILED = 8;
const LOCK_MINUTES = 15;
const SESSION_TABLE = { customer: 'user_sessions', staff: 'staff_sessions' };
const OWNER_COLUMN = { customer: 'user_id', staff: 'staff_id' };

export const COOKIE = Object.freeze({ customer: 'iy_session', staff: 'iy_staff_session' });

/** Cookie flags. httpOnly so script cannot read it; sameSite=lax to blunt CSRF. */
export function cookieOptions(maxAgeMs) {
    return {
        httpOnly: true,
        secure: config.isProd,
        sameSite: 'lax',
        path: '/',
        maxAge: maxAgeMs,
    };
}

export async function createSession(kind, ownerId, { userAgent, ip } = {}) {
    const token = sessionToken();
    const ttlMs = config.sessionTtlDays * 24 * 60 * 60 * 1000;
    const expires = new Date(Date.now() + ttlMs);
    await query(
        `INSERT INTO ${SESSION_TABLE[kind]} (${OWNER_COLUMN[kind]}, token_hash, user_agent, ip_hash, expires_at)
         VALUES (?, ?, ?, ?, ?)`,
        [ownerId, sha256(token), (userAgent || '').slice(0, 255) || null, ip ? sha256(ip) : null, expires],
    );
    return { token, expiresAt: expires, maxAge: ttlMs };
}

/** Resolve a cookie to a live identity, or null. Expired and revoked both read as null. */
export async function resolveSession(kind, token) {
    if (!token) return null;
    const table = SESSION_TABLE[kind];
    const col = OWNER_COLUMN[kind];
    const row = await queryOne(
        `SELECT id, ${col} AS owner_id, expires_at, revoked_at FROM ${table} WHERE token_hash = ?`,
        [sha256(token)],
    );
    if (!row || row.revoked_at || new Date(row.expires_at) <= new Date()) return null;
    await query(`UPDATE ${table} SET last_seen_at = CURRENT_TIMESTAMP(3) WHERE id = ?`, [row.id]);
    return row;
}

export async function revokeSession(kind, token) {
    if (!token) return;
    await query(
        `UPDATE ${SESSION_TABLE[kind]} SET revoked_at = CURRENT_TIMESTAMP(3) WHERE token_hash = ? AND revoked_at IS NULL`,
        [sha256(token)],
    );
}

export async function revokeAllSessions(kind, ownerId) {
    await query(
        `UPDATE ${SESSION_TABLE[kind]} SET revoked_at = CURRENT_TIMESTAMP(3)
         WHERE ${OWNER_COLUMN[kind]} = ? AND revoked_at IS NULL`,
        [ownerId],
    );
}

/**
 * Lockout after repeated failures, so a stolen email list cannot be used for
 * unlimited online guessing even behind the rate limiter.
 */
export async function registerFailedLogin(table, id) {
    await query(
        `UPDATE ${table}
            SET failed_logins = failed_logins + 1,
                locked_until = CASE WHEN failed_logins + 1 >= ?
                    THEN DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL ? MINUTE) ELSE locked_until END
          WHERE id = ?`,
        [MAX_FAILED, LOCK_MINUTES, id],
    );
}

export async function clearFailedLogins(table, id) {
    await query(
        `UPDATE ${table} SET failed_logins = 0, locked_until = NULL, last_login_at = CURRENT_TIMESTAMP(3) WHERE id = ?`,
        [id],
    );
}

export const isLocked = (row) => Boolean(row.locked_until) && new Date(row.locked_until) > new Date();

export async function createCustomer({ email, password, fullName, phone }) {
    const hash = await hashPassword(password);
    const pid = publicId();
    const res = await query(
        `INSERT INTO users (public_id, email, email_normalised, password_hash, full_name, phone)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [pid, String(email).trim(), normaliseEmail(email), hash, fullName || null, phone || null],
    );
    return { id: res.insertId, publicId: pid };
}
