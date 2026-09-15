/**
 * Minimal in-memory Firestore + Auth double for PB-1 handler tests.
 *
 * This substitutes the DATABASE only. The handlers under test — authentication,
 * ownership checks, package validation, pricing, idempotency, the transaction
 * and the customer-safe projection — all execute for real against it.
 *
 * Semantics deliberately matched to Firestore where the handlers depend on them:
 *   - tx.create() REJECTS if the document already exists (this is what makes
 *     booking-reference reservation and idempotency collision-safe).
 *   - reads inside a transaction see committed state; writes are buffered and
 *     applied only on successful commit, so a thrown transaction writes nothing.
 *   - auto-generated document ids are unique and opaque.
 */

'use strict';

const crypto = require('crypto');

class AlreadyExistsError extends Error {
    constructor(path) {
        super(`ALREADY_EXISTS: ${path}`);
        this.code = 6; // Firestore's ALREADY_EXISTS status code
    }
}

function autoId() {
    return crypto.randomBytes(10).toString('hex');
}

function clone(v) {
    return v === undefined ? undefined : JSON.parse(JSON.stringify(v));
}

class FakeFirestore {
    constructor(seed = {}) {
        /** @type {Map<string, object>} flat path -> document data */
        this.docs = new Map();
        for (const [path, data] of Object.entries(seed)) this.docs.set(path, data);
        this.transactionAttempts = 0;
    }

    // --- introspection helpers for assertions ---
    allDocsIn(collectionPath) {
        const out = [];
        for (const [path, data] of this.docs.entries()) {
            const rest = path.startsWith(`${collectionPath}/`) ? path.slice(collectionPath.length + 1) : null;
            if (rest !== null && !rest.includes('/')) out.push({ id: rest, path, data });
        }
        return out;
    }

    collection(name) {
        return new FakeCollectionRef(this, name);
    }

    _snap(path) {
        const data = this.docs.get(path);
        const id = path.split('/').pop();
        return {
            exists: data !== undefined,
            id,
            ref: new FakeDocRef(this, path),
            data: () => clone(data),
        };
    }

    async runTransaction(fn) {
        // Firestore retries on contention; these tests are single-threaded, so a
        // single attempt per call is sufficient. The handler drives its own retry
        // loop for reference collisions, which this faithfully supports by
        // letting the thrown error propagate with no writes applied.
        this.transactionAttempts += 1;
        const buffered = [];
        const tx = {
            get: async (ref) => this._snap(ref.path),
            create: (ref, data) => {
                if (this.docs.has(ref.path)) throw new AlreadyExistsError(ref.path);
                if (buffered.some((w) => w.path === ref.path)) throw new AlreadyExistsError(ref.path);
                buffered.push({ op: 'create', path: ref.path, data });
            },
            set: (ref, data) => buffered.push({ op: 'set', path: ref.path, data }),
            update: (ref, data) => buffered.push({ op: 'update', path: ref.path, data }),
        };

        const result = await fn(tx); // a throw here discards `buffered` entirely

        for (const w of buffered) {
            if (w.op === 'update') {
                this.docs.set(w.path, { ...(this.docs.get(w.path) || {}), ...w.data });
            } else {
                this.docs.set(w.path, w.data);
            }
        }
        return result;
    }
}

class FakeCollectionRef {
    constructor(store, path) {
        this.store = store;
        this.path = path;
    }
    doc(id) {
        return new FakeDocRef(this.store, `${this.path}/${id || autoId()}`);
    }
}

class FakeDocRef {
    constructor(store, path) {
        this.store = store;
        this.path = path;
        this.id = path.split('/').pop();
    }
    collection(name) {
        return new FakeCollectionRef(this.store, `${this.path}/${name}`);
    }
    async get() {
        return this.store._snap(this.path);
    }
    async set(data) {
        this.store.docs.set(this.path, data);
    }
}

/** Auth double: maps opaque token strings to decoded identities. */
class FakeAuth {
    constructor(tokens = {}) {
        this.tokens = new Map(Object.entries(tokens));
    }
    async verifyIdToken(token) {
        const decoded = this.tokens.get(token);
        if (!decoded) {
            const err = new Error('Firebase ID token has invalid signature.');
            err.code = 'auth/argument-error';
            throw err;
        }
        return decoded;
    }
}

/** Build the dependency object consumed by packageBookings.__setDepsForTesting. */
function makeDeps({ seed = {}, tokens = {} } = {}) {
    const store = new FakeFirestore(seed);
    const auth = new FakeAuth(tokens);
    return {
        store,
        auth,
        deps: {
            firestore: () => store,
            auth: () => auth,
            serverTimestamp: () => '__SERVER_TIMESTAMP__',
        },
    };
}

/** Minimal Express req/res doubles. */
function mockReq({ body = {}, params = {}, headers = {} } = {}) {
    return { body, params, headers };
}

function mockRes() {
    return {
        statusCode: null,
        body: null,
        headersSent: false,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            this.headersSent = true;
            return this;
        },
    };
}

/** Run requireFirebaseUser then the handler, exactly as Express would. */
async function callWithAuth(middleware, handler, req, res) {
    let nexted = false;
    await middleware(req, res, () => {
        nexted = true;
    });
    if (!nexted) return res;
    await handler(req, res);
    return res;
}

module.exports = {
    FakeFirestore,
    FakeAuth,
    AlreadyExistsError,
    makeDeps,
    mockReq,
    mockRes,
    callWithAuth,
    autoId,
};
