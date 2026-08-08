// Small shared validators — mirror the bounds we enforced in the old Firestore
// security rules so the API rejects the same malformed/abusive input.

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function isValidEmail(s) {
    return typeof s === 'string' && s.length > 3 && s.length <= 254 && EMAIL_RE.test(s);
}

export function isShortString(s, max) {
    return s == null || (typeof s === 'string' && s.length <= max);
}

// Express helper: send a 400 with a message.
export function badRequest(res, message) {
    return res.status(400).json({ error: message });
}
