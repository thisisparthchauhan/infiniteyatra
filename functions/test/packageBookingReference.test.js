/**
 * PB-1 — Booking reference format, uniqueness and distribution tests.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    ALPHABET,
    SUFFIX_LENGTH,
    generateCandidate,
    isValidReference,
    randomSuffix,
} = require('../packageBookingReference');

test('reference matches the documented IY-BKG-YYYY-XXXXXX format', () => {
    const ref = generateCandidate(new Date('2026-06-01T00:00:00Z'));
    assert.match(ref, /^IY-BKG-2026-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{6}$/);
    assert.ok(isValidReference(ref));
});

test('reference year tracks the supplied date', () => {
    assert.ok(generateCandidate(new Date('2027-01-01T00:00:00Z')).startsWith('IY-BKG-2027-'));
});

test('isValidReference rejects malformed references', () => {
    const bad = [
        '',
        'IY-BKG-2026-ABC', // too short
        'IY-BKG-2026-ABCDEFG', // too long
        'IY-BKG-26-ABCDEF', // short year
        'XX-BKG-2026-ABCDEF', // wrong prefix
        'IY-BKG-2026-ABCDE0', // excluded glyph 0
        'IY-BKG-2026-ABCDEO', // excluded glyph O
        'IY-BKG-2026-abcdef', // lowercase
        'IY-BKG-2026-ABCDE1', // excluded glyph 1
        null,
        12345,
    ];
    for (const b of bad) {
        assert.equal(isValidReference(b), false, `should reject ${JSON.stringify(b)}`);
    }
});

test('alphabet excludes every visually ambiguous glyph', () => {
    for (const ambiguous of ['0', 'O', '1', 'I', 'L', 'U']) {
        assert.ok(!ALPHABET.includes(ambiguous), `alphabet must not contain "${ambiguous}"`);
    }
    assert.equal(ALPHABET.length, 30);
    assert.equal(new Set(ALPHABET).size, 30, 'alphabet must have no duplicates');
});

test('suffixes are drawn from the alphabet only', () => {
    for (let i = 0; i < 500; i += 1) {
        const s = randomSuffix();
        assert.equal(s.length, SUFFIX_LENGTH);
        for (const ch of s) assert.ok(ALPHABET.includes(ch), `unexpected character "${ch}"`);
    }
});

test('20,000 references collide at most negligibly (collision-safety sanity)', () => {
    const seen = new Set();
    let collisions = 0;
    for (let i = 0; i < 20000; i += 1) {
        const ref = generateCandidate();
        if (seen.has(ref)) collisions += 1;
        seen.add(ref);
    }
    // 30^6 ≈ 729M. Expected collisions among 20k draws ≈ 0.27 by birthday
    // approximation. Anything above a handful indicates a broken RNG or a
    // biased alphabet, not bad luck.
    assert.ok(collisions <= 3, `expected ~0 collisions in 20k draws, saw ${collisions}`);
});

test('suffix character distribution is not visibly biased', () => {
    // Rejection sampling should keep the draw uniform. A plain `byte % 30`
    // would over-represent the first 16 characters by ~6%; this guards that.
    const counts = new Map([...ALPHABET].map((c) => [c, 0]));
    const draws = 3000;
    for (let i = 0; i < draws; i += 1) {
        for (const ch of randomSuffix()) counts.set(ch, counts.get(ch) + 1);
    }
    const total = draws * SUFFIX_LENGTH;
    const expected = total / ALPHABET.length;
    for (const [ch, n] of counts) {
        assert.ok(
            n > expected * 0.75 && n < expected * 1.25,
            `character "${ch}" appeared ${n} times, expected ~${expected.toFixed(0)}`,
        );
    }
});
