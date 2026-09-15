/**
 * CUTOVER — deployment entry for the PB-only booking API.
 *
 * Firebase deploys every export reachable from the `main` field of
 * functions/package.json. That file still points at index.js, the legacy
 * monolith, so this entry is PREPARED AND NOT YET ACTIVE.
 *
 * To deploy the PB API and nothing else, point `main` here:
 *   "main": "bookingApi.entry.js"
 *
 * Nothing in this file's require graph reaches ./security, ./waf or ./index.js,
 * so no legacy secret is needed to start. Verified by
 * tests/cutover.booking-api.test.mjs, which loads it with a scrubbed
 * environment on a simulated production runtime.
 */

'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');

const { createBookingApiApp } = require('./bookingApi');

// The PB modules call admin.firestore()/storage() lazily through their deps()
// indirection, so initialising here is enough and nothing touches a network at
// module load.
if (admin.apps.length === 0) admin.initializeApp();

/** The single exported function. One HTTPS entry, one app, no side exports. */
exports.api = functions.https.onRequest(createBookingApiApp());
