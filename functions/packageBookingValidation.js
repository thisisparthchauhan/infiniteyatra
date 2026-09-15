/**
 * PB-1 — Runtime request validation for the package booking API.
 *
 * Explicit, dependency-free validation. Unknown top-level fields are rejected
 * so that a client cannot smuggle in `userId`, `totalPrice`, `bookingStatus` or
 * any future privileged field by simply adding it to the request body.
 *
 * Errors are returned as plain data. Nothing here throws, and nothing here
 * produces a stack trace that could reach a client.
 */

'use strict';

const MAX_TRAVELLERS = 50;

const ALLOWED_BODY_KEYS = new Set([
    'packageId',
    'departureDate',
    'travellerCount',
    'pickupLocationIndex',
    'customer',
    'travellers',
    'specialRequests',
    'hotelBundle',
    'paymentPlan',
    'idempotencyKey',
    'source',
    'channel',
]);

const ALLOWED_CUSTOMER_KEYS = new Set(['name', 'email', 'phone']);

const ALLOWED_TRAVELLER_KEYS = new Set([
    'firstName',
    'middleName',
    'lastName',
    'dateOfBirth',
    'gender',
    'nationality',
    'contactNumbers',
    'emergencyContacts',
]);

const ALLOWED_EMERGENCY_KEYS = new Set([
    'firstName',
    'middleName',
    'lastName',
    'relation',
    'contactNumber',
    'email',
]);

const ALLOWED_HOTEL_BUNDLE_KEYS = new Set(['hotelId', 'roomId']);

const PAYMENT_PLANS = new Set(['FULL', 'TOKEN_BALANCE', 'UNDECIDED']);

const SOURCES = new Set(['web', 'admin', 'whatsapp', 'phone', 'partner']);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const FIRESTORE_ID = /^[A-Za-z0-9_-]{1,128}$/;
const IDEMPOTENCY_KEY = /^[A-Za-z0-9_:-]{16,128}$/;
const PHONE = /^\+?[0-9][0-9\s-]{5,19}$/;

function isPlainObject(v) {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function str(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function rejectUnknownKeys(obj, allowed, path, errors) {
    for (const key of Object.keys(obj)) {
        if (!allowed.has(key)) errors.push(`${path}.${key} is not an accepted field`);
    }
}

function validateEmergencyContact(raw, path, errors) {
    if (!isPlainObject(raw)) {
        errors.push(`${path} must be an object`);
        return null;
    }
    rejectUnknownKeys(raw, ALLOWED_EMERGENCY_KEYS, path, errors);

    const firstName = str(raw.firstName);
    const contactNumber = str(raw.contactNumber);
    const email = str(raw.email);

    if (firstName.length > 100) errors.push(`${path}.firstName is too long`);
    if (contactNumber && !PHONE.test(contactNumber)) errors.push(`${path}.contactNumber is not a valid phone number`);
    if (email && !EMAIL.test(email)) errors.push(`${path}.email is not a valid email address`);

    return {
        firstName,
        middleName: str(raw.middleName).slice(0, 100),
        lastName: str(raw.lastName).slice(0, 100),
        relation: str(raw.relation).slice(0, 50),
        contactNumber,
        email,
    };
}

function validateTraveller(raw, index, errors) {
    const path = `travellers[${index}]`;
    if (!isPlainObject(raw)) {
        errors.push(`${path} must be an object`);
        return null;
    }
    rejectUnknownKeys(raw, ALLOWED_TRAVELLER_KEYS, path, errors);

    const firstName = str(raw.firstName);
    const lastName = str(raw.lastName);

    // Mirrors the only traveller fields the existing form actually enforces
    // (BookingPage.jsx:550-558). Everything else stays optional in PB-1 so the
    // contract does not diverge from the live flow before the PB-2 cutover.
    if (!firstName) errors.push(`${path}.firstName is required`);
    if (firstName.length > 100) errors.push(`${path}.firstName is too long`);
    if (!lastName) errors.push(`${path}.lastName is required`);
    if (lastName.length > 100) errors.push(`${path}.lastName is too long`);

    const dateOfBirth = str(raw.dateOfBirth);
    if (dateOfBirth && !ISO_DATE.test(dateOfBirth)) {
        errors.push(`${path}.dateOfBirth must be an ISO date (YYYY-MM-DD)`);
    }

    let contactNumbers = [];
    if (raw.contactNumbers !== undefined) {
        if (!Array.isArray(raw.contactNumbers)) {
            errors.push(`${path}.contactNumbers must be an array`);
        } else if (raw.contactNumbers.length > 5) {
            errors.push(`${path}.contactNumbers allows at most 5 entries`);
        } else {
            contactNumbers = raw.contactNumbers.map((n) => str(n)).filter(Boolean);
            contactNumbers.forEach((n, i) => {
                if (!PHONE.test(n)) errors.push(`${path}.contactNumbers[${i}] is not a valid phone number`);
            });
        }
    }

    let emergencyContacts = [];
    if (raw.emergencyContacts !== undefined) {
        if (!Array.isArray(raw.emergencyContacts)) {
            errors.push(`${path}.emergencyContacts must be an array`);
        } else if (raw.emergencyContacts.length > 5) {
            errors.push(`${path}.emergencyContacts allows at most 5 entries`);
        } else {
            emergencyContacts = raw.emergencyContacts
                .map((ec, i) => validateEmergencyContact(ec, `${path}.emergencyContacts[${i}]`, errors))
                .filter(Boolean)
                .filter((ec) => ec.firstName || ec.contactNumber);
        }
    }

    return {
        firstName,
        middleName: str(raw.middleName).slice(0, 100),
        lastName,
        dateOfBirth,
        gender: str(raw.gender).slice(0, 30),
        nationality: str(raw.nationality).slice(0, 80),
        contactNumbers,
        emergencyContacts,
    };
}

/**
 * Validate and normalise a package booking creation request.
 * @returns {{ok: true, value: object} | {ok: false, errors: string[]}}
 */
function validateCreateBookingRequest(body) {
    const errors = [];

    if (!isPlainObject(body)) {
        return { ok: false, errors: ['Request body must be a JSON object'] };
    }
    rejectUnknownKeys(body, ALLOWED_BODY_KEYS, 'body', errors);

    // --- package + departure ---
    const packageId = str(body.packageId);
    if (!packageId) errors.push('packageId is required');
    else if (!FIRESTORE_ID.test(packageId)) errors.push('packageId is not a valid identifier');

    const departureDate = str(body.departureDate);
    if (!departureDate) errors.push('departureDate is required');
    else if (!ISO_DATE.test(departureDate)) errors.push('departureDate must be an ISO date (YYYY-MM-DD)');

    // --- traveller count ---
    const travellerCount = Number(body.travellerCount);
    if (!Number.isInteger(travellerCount) || travellerCount < 1 || travellerCount > MAX_TRAVELLERS) {
        errors.push(`travellerCount must be a whole number between 1 and ${MAX_TRAVELLERS}`);
    }

    // --- pickup ---
    let pickupLocationIndex = 0;
    if (body.pickupLocationIndex !== undefined) {
        pickupLocationIndex = Number(body.pickupLocationIndex);
        if (!Number.isInteger(pickupLocationIndex) || pickupLocationIndex < 0 || pickupLocationIndex > 100) {
            errors.push('pickupLocationIndex must be a non-negative whole number');
        }
    }

    // --- lead customer (contact snapshot only; ownership comes from the token) ---
    let customer = { name: '', email: '', phone: '' };
    if (!isPlainObject(body.customer)) {
        errors.push('customer is required');
    } else {
        rejectUnknownKeys(body.customer, ALLOWED_CUSTOMER_KEYS, 'customer', errors);
        const name = str(body.customer.name);
        const email = str(body.customer.email);
        const phone = str(body.customer.phone);

        if (!name) errors.push('customer.name is required');
        else if (name.length > 150) errors.push('customer.name is too long');
        if (!email) errors.push('customer.email is required');
        else if (!EMAIL.test(email)) errors.push('customer.email is not a valid email address');
        if (!phone) errors.push('customer.phone is required');
        else if (!PHONE.test(phone)) errors.push('customer.phone is not a valid phone number');

        customer = { name, email, phone };
    }

    // --- travellers ---
    let travellers = [];
    if (body.travellers !== undefined) {
        if (!Array.isArray(body.travellers)) {
            errors.push('travellers must be an array');
        } else if (body.travellers.length > MAX_TRAVELLERS) {
            errors.push(`travellers allows at most ${MAX_TRAVELLERS} entries`);
        } else {
            travellers = body.travellers.map((t, i) => validateTraveller(t, i, errors)).filter(Boolean);
            if (
                Number.isInteger(travellerCount) &&
                body.travellers.length > 0 &&
                body.travellers.length !== travellerCount
            ) {
                errors.push('travellers length must equal travellerCount');
            }
        }
    }

    // --- optional bits ---
    const specialRequests = str(body.specialRequests);
    if (specialRequests.length > 2000) errors.push('specialRequests must be 2000 characters or fewer');

    let hotelBundle = null;
    if (body.hotelBundle !== undefined && body.hotelBundle !== null) {
        if (!isPlainObject(body.hotelBundle)) {
            errors.push('hotelBundle must be an object');
        } else {
            rejectUnknownKeys(body.hotelBundle, ALLOWED_HOTEL_BUNDLE_KEYS, 'hotelBundle', errors);
            const hotelId = str(body.hotelBundle.hotelId);
            if (!hotelId) errors.push('hotelBundle.hotelId is required when hotelBundle is supplied');
            else if (!FIRESTORE_ID.test(hotelId)) errors.push('hotelBundle.hotelId is not a valid identifier');
            const roomId = body.hotelBundle.roomId != null ? str(body.hotelBundle.roomId) : null;
            if (roomId && roomId.length > 128) errors.push('hotelBundle.roomId is too long');
            hotelBundle = { hotelId, roomId: roomId || null };
        }
    }

    const paymentPlan = body.paymentPlan === undefined ? 'UNDECIDED' : str(body.paymentPlan).toUpperCase();
    if (!PAYMENT_PLANS.has(paymentPlan)) {
        errors.push(`paymentPlan must be one of ${[...PAYMENT_PLANS].join(', ')}`);
    }

    const idempotencyKey = str(body.idempotencyKey);
    if (!idempotencyKey) errors.push('idempotencyKey is required');
    else if (!IDEMPOTENCY_KEY.test(idempotencyKey)) {
        errors.push('idempotencyKey must be 16-128 characters of A-Z a-z 0-9 _ : -');
    }

    const source = body.source === undefined ? 'web' : str(body.source).toLowerCase();
    if (!SOURCES.has(source)) errors.push(`source must be one of ${[...SOURCES].join(', ')}`);

    const channel = str(body.channel).slice(0, 50);

    if (errors.length > 0) return { ok: false, errors };

    return {
        ok: true,
        value: {
            packageId,
            departureDate,
            travellerCount,
            pickupLocationIndex,
            customer,
            travellers,
            specialRequests,
            hotelBundle,
            paymentPlan,
            idempotencyKey,
            source,
            channel,
        },
    };
}

module.exports = {
    MAX_TRAVELLERS,
    PAYMENT_PLANS,
    SOURCES,
    validateCreateBookingRequest,
};
