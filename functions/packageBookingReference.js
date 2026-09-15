/**
 * PB-1 — Customer-friendly booking reference.
 *
 * FORMAT
 *   IY-BKG-<YYYY>-<SSSSSS>
 *   e.g. IY-BKG-2026-7K4MQP
 *
 * WHY RANDOM RATHER THAN SEQUENTIAL
 * A strictly sequential public reference leaks trading volume: IY-BKG-2026-000123
 * tells anyone holding one booking roughly how many packages have been sold this
 * year. The suffix is therefore drawn at random from a 30-character alphabet
 * (~729 million combinations per year) and uniqueness is guaranteed by a
 * transactional reservation rather than by a counter.
 *
 * ALPHABET
 * Ambiguous glyphs are excluded (0/O, 1/I/L, U) so the reference survives being
 * read aloud over a phone call or re-typed from a WhatsApp message — which is
 * the entire point of having it alongside the Firestore document ID.
 *
 * COLLISION SAFETY
 * generateCandidate() is pure. Uniqueness is enforced by the caller inside a
 * Firestore transaction that creates `booking_references/{reference}`; a
 * create on an existing document fails the transaction, which then retries
 * with a fresh candidate. See reserveReference() in packageBookings.js.
 */

'use strict';

const crypto = require('crypto');

const ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ'; // 30 chars: no 0 O 1 I L U
const SUFFIX_LENGTH = 6;
const PREFIX = 'IY-BKG';

const REFERENCE_PATTERN = /^IY-BKG-\d{4}-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{6}$/;

/**
 * Draw `SUFFIX_LENGTH` characters uniformly from ALPHABET using rejection
 * sampling, so the distribution is not skewed by the modulo bias that a plain
 * `byte % 30` would introduce.
 */
function randomSuffix() {
    const max = Math.floor(256 / ALPHABET.length) * ALPHABET.length; // 240
    let out = '';
    while (out.length < SUFFIX_LENGTH) {
        for (const byte of crypto.randomBytes(SUFFIX_LENGTH * 2)) {
            if (byte >= max) continue; // reject to keep the draw uniform
            out += ALPHABET[byte % ALPHABET.length];
            if (out.length === SUFFIX_LENGTH) break;
        }
    }
    return out;
}

/**
 * Build one candidate reference. Not guaranteed unique on its own —
 * the caller must reserve it transactionally.
 */
function generateCandidate(now = new Date()) {
    return `${PREFIX}-${now.getUTCFullYear()}-${randomSuffix()}`;
}

function isValidReference(reference) {
    return typeof reference === 'string' && REFERENCE_PATTERN.test(reference);
}

module.exports = {
    ALPHABET,
    SUFFIX_LENGTH,
    PREFIX,
    REFERENCE_PATTERN,
    randomSuffix,
    generateCandidate,
    isValidReference,
};
