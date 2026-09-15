/**
 * Identifier generation.
 *
 * Nothing exposed to a client is a database primary key: an auto-increment id
 * leaks row counts and invites enumeration. Every externally visible handle is
 * a random public id.
 */

import crypto from 'node:crypto';

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** 26-char Crockford base32, ULID-shaped: time-ordered prefix, random suffix. */
export function publicId() {
    const now = Date.now();
    let time = '';
    let t = now;
    for (let i = 0; i < 10; i += 1) { time = CROCKFORD[t % 32] + time; t = Math.floor(t / 32); }
    const bytes = crypto.randomBytes(16);
    let rand = '';
    for (let i = 0; i < 16; i += 1) rand += CROCKFORD[bytes[i] % 32];
    return (time + rand).slice(0, 26);
}

/** Stable traveller identity. Same shape PB-1 issued, so the contract is unchanged. */
export const travellerId = () => `tr_${crypto.randomBytes(6).toString('hex')}`;

const REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1

/** IY-BKG-YYYY-XXXXXX. Uniqueness is enforced by the database, not by hope. */
export function bookingReference(year = new Date().getUTCFullYear()) {
    const bytes = crypto.randomBytes(6);
    let s = '';
    for (let i = 0; i < 6; i += 1) s += REF_ALPHABET[bytes[i] % REF_ALPHABET.length];
    return `IY-BKG-${year}-${s}`;
}

export const isValidReference = (v) =>
    typeof v === 'string' && /^IY-BKG-\d{4}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(v);

export const summaryNumber = (year, seq) => `IY-BS-${year}-${String(seq).padStart(6, '0')}`;

/** Opaque session token; only its sha256 is ever stored. */
export const sessionToken = () => crypto.randomBytes(32).toString('base64url');
export const sha256 = (v) => crypto.createHash('sha256').update(String(v)).digest('hex');
