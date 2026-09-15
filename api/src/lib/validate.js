/**
 * Request validation.
 *
 * ALLOWLIST, not denylist: an unknown key is an error, not something ignored.
 * That is what stops a client sending `price`, `grossAmountMinor`, `userId` or
 * `bookingStatus` and having it silently reach a writer.
 */

export class ValidationError extends Error {
    constructor(details) {
        super('Validation failed');
        this.name = 'ValidationError';
        this.status = 400;
        this.details = details;
    }
}

const isPlainObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);

export function rejectUnknownKeys(obj, allowed, path, errors) {
    for (const key of Object.keys(obj)) {
        if (!allowed.has(key)) errors.push(`${path}.${key} is not an accepted field`);
    }
}

export const str = (v) => (typeof v === 'string' ? v.trim() : '');

export function checkString(v, { field, min = 1, max = 255, pattern = null, required = true }, errors) {
    const s = str(v);
    if (!s) { if (required) errors.push(`${field} is required`); return null; }
    if (s.length < min) errors.push(`${field} is too short`);
    if (s.length > max) errors.push(`${field} is too long`);
    if (pattern && !pattern.test(s)) errors.push(`${field} is not valid`);
    return s;
}

export const EMAIL_RE = /^[^@\s]{1,64}@[^@\s]{1,190}\.[A-Za-z]{2,24}$/;
export const PHONE_RE = /^\+?[0-9][0-9\s-]{6,20}$/;
export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const BOOKING_KEYS = new Set([
    'packageId', 'pickupOptionId', 'hotelId', 'departureDate', 'travellerCount',
    'specialRequests', 'contact', 'travellers', 'idempotencyKey', 'source',
]);
const CONTACT_KEYS = new Set(['fullName', 'email', 'phone']);
const TRAVELLER_KEYS = new Set([
    'firstName', 'middleName', 'lastName', 'dateOfBirth', 'gender', 'nationality',
]);

export function validateCreateBooking(body) {
    const errors = [];
    if (!isPlainObject(body)) throw new ValidationError(['body must be an object']);
    rejectUnknownKeys(body, BOOKING_KEYS, 'body', errors);

    const packageId = Number(body.packageId);
    if (!Number.isInteger(packageId) || packageId <= 0) errors.push('packageId is required');

    let pickupOptionId = null;
    if (body.pickupOptionId != null) {
        pickupOptionId = Number(body.pickupOptionId);
        if (!Number.isInteger(pickupOptionId) || pickupOptionId <= 0) errors.push('pickupOptionId is not valid');
    }

    let hotelId = null;
    if (body.hotelId != null) {
        hotelId = Number(body.hotelId);
        if (!Number.isInteger(hotelId) || hotelId <= 0) errors.push('hotelId is not valid');
    }

    const departureDate = checkString(body.departureDate, { field: 'departureDate', pattern: ISO_DATE_RE, max: 10 }, errors);
    if (departureDate && Number.isNaN(Date.parse(departureDate))) errors.push('departureDate is not a real date');

    const travellerCount = Number(body.travellerCount);
    if (!Number.isInteger(travellerCount) || travellerCount < 1 || travellerCount > 40) {
        errors.push('travellerCount must be between 1 and 40');
    }

    const specialRequests = typeof body.specialRequests === 'string' ? body.specialRequests.trim() : '';
    if (specialRequests.length > 2000) errors.push('specialRequests is too long');

    let contact = null;
    if (!isPlainObject(body.contact)) errors.push('contact is required');
    else {
        rejectUnknownKeys(body.contact, CONTACT_KEYS, 'contact', errors);
        contact = {
            fullName: checkString(body.contact.fullName, { field: 'contact.fullName', max: 160 }, errors),
            email: checkString(body.contact.email, { field: 'contact.email', max: 254, pattern: EMAIL_RE }, errors),
            phone: checkString(body.contact.phone, { field: 'contact.phone', max: 32, pattern: PHONE_RE }, errors),
        };
    }

    const travellers = [];
    if (!Array.isArray(body.travellers) || body.travellers.length === 0) {
        errors.push('travellers is required');
    } else if (body.travellers.length > 40) {
        errors.push('too many travellers');
    } else {
        body.travellers.forEach((raw, i) => {
            if (!isPlainObject(raw)) { errors.push(`travellers[${i}] must be an object`); return; }
            rejectUnknownKeys(raw, TRAVELLER_KEYS, `travellers[${i}]`, errors);
            travellers.push({
                firstName: checkString(raw.firstName, { field: `travellers[${i}].firstName`, max: 80 }, errors),
                middleName: raw.middleName ? checkString(raw.middleName, { field: `travellers[${i}].middleName`, max: 80, required: false }, errors) : null,
                lastName: checkString(raw.lastName, { field: `travellers[${i}].lastName`, max: 80 }, errors),
                dateOfBirth: raw.dateOfBirth ? checkString(raw.dateOfBirth, { field: `travellers[${i}].dateOfBirth`, pattern: ISO_DATE_RE, max: 10, required: false }, errors) : null,
                gender: raw.gender ? checkString(raw.gender, { field: `travellers[${i}].gender`, max: 24, required: false }, errors) : null,
                nationality: raw.nationality ? checkString(raw.nationality, { field: `travellers[${i}].nationality`, max: 80, required: false }, errors) : null,
            });
        });
    }

    if (travellers.length && Number.isInteger(travellerCount) && travellers.length !== travellerCount) {
        errors.push('travellers must match travellerCount');
    }

    const idempotencyKey = checkString(body.idempotencyKey, {
        field: 'idempotencyKey', min: 8, max: 80, pattern: /^[A-Za-z0-9_-]{8,80}$/,
    }, errors);

    const source = body.source ? checkString(body.source, { field: 'source', max: 32, required: false }, errors) : 'web';

    if (errors.length) throw new ValidationError(errors);

    return {
        packageId, pickupOptionId, hotelId, departureDate, travellerCount,
        specialRequests, contact, travellers, idempotencyKey, source,
    };
}

const REGISTER_KEYS = new Set(['email', 'password', 'fullName', 'phone']);

export function validateRegistration(body) {
    const errors = [];
    if (!isPlainObject(body)) throw new ValidationError(['body must be an object']);
    rejectUnknownKeys(body, REGISTER_KEYS, 'body', errors);

    const email = checkString(body.email, { field: 'email', max: 254, pattern: EMAIL_RE }, errors);
    const password = typeof body.password === 'string' ? body.password : '';
    // Length over composition rules: a long passphrase beats forced symbols.
    if (password.length < 10) errors.push('password must be at least 10 characters');
    if (password.length > 200) errors.push('password is too long');

    const fullName = body.fullName ? checkString(body.fullName, { field: 'fullName', max: 160, required: false }, errors) : null;
    const phone = body.phone ? checkString(body.phone, { field: 'phone', max: 32, pattern: PHONE_RE, required: false }, errors) : null;

    if (errors.length) throw new ValidationError(errors);
    return { email, password, fullName, phone };
}

export function validateLogin(body) {
    const errors = [];
    if (!isPlainObject(body)) throw new ValidationError(['body must be an object']);
    rejectUnknownKeys(body, new Set(['email', 'password']), 'body', errors);
    const email = checkString(body.email, { field: 'email', max: 254 }, errors);
    const password = typeof body.password === 'string' ? body.password : '';
    if (!password) errors.push('password is required');
    if (errors.length) throw new ValidationError(errors);
    return { email, password };
}
