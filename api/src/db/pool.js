/**
 * MariaDB access. Every query is parameterised — there is no string-built SQL
 * in this codebase, and `query()` takes values separately so it cannot be
 * called with an interpolated statement by accident.
 */

import mysql from 'mysql2/promise';
import { config } from '../config.js';

let pool = null;

export function getPool() {
    if (pool) return pool;
    pool = mysql.createPool({
        host: config.db.host,
        port: config.db.port,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database,
        connectionLimit: config.db.connectionLimit,
        waitForConnections: true,
        namedPlaceholders: false,
        timezone: 'Z',
        // Keep DECIMAL/BIGINT as strings rather than lossy JS numbers; money is
        // read through helpers that convert deliberately.
        supportBigNumbers: true,
        bigNumberStrings: false,
        dateStrings: ['DATE'],
    });
    return pool;
}

export async function query(sql, params = []) {
    const [rows] = await getPool().execute(sql, params);
    return rows;
}

export async function queryOne(sql, params = []) {
    const rows = await query(sql, params);
    return rows[0] || null;
}

/**
 * Run `fn` inside a transaction on a single connection.
 *
 * This is what replaces the Firestore transaction from PB-1. Anything that must
 * be all-or-nothing — the booking, its contact, its travellers, its reference
 * reservation and its activity row — goes through here, so a failure part way
 * leaves no half-created booking behind.
 */
/**
 * Errors MariaDB raises when two transactions genuinely contend. They mean
 * "try again", not "this request is invalid", so they are retried rather than
 * surfaced as a 500. Without this, two customers requesting a Booking Summary
 * at the same moment could have one of them fail.
 */
const TRANSIENT_TX_ERRORS = new Set([
    'ER_LOCK_DEADLOCK',        // 1213
    'ER_LOCK_WAIT_TIMEOUT',    // 1205
    'ER_CHECKREAD',            // 1020 - record has changed since last read
]);

export const isTransientTxError = (err) =>
    Boolean(err) && (TRANSIENT_TX_ERRORS.has(err.code) || [1213, 1205, 1020].includes(err.errno));

export async function withTransaction(fn, { retries = 4 } = {}) {
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            return await runTransaction(fn);
        } catch (err) {
            if (!isTransientTxError(err)) throw err;
            lastError = err;
            // Brief randomised backoff so retries do not re-collide in lockstep.
            const delay = Math.min(50, 5 * (attempt + 1)) + Math.floor(Math.random() * 10);
            await new Promise((r) => setTimeout(r, delay));
        }
    }
    throw lastError;
}

async function runTransaction(fn) {
    const conn = await getPool().getConnection();
    try {
        await conn.beginTransaction();
        const tx = {
            query: async (sql, params = []) => {
                const [rows] = await conn.execute(sql, params);
                return rows;
            },
            queryOne: async (sql, params = []) => {
                const [rows] = await conn.execute(sql, params);
                return rows[0] || null;
            },
        };
        const result = await fn(tx);
        await conn.commit();
        return result;
    } catch (err) {
        try { await conn.rollback(); } catch { /* connection already gone */ }
        throw err;
    } finally {
        conn.release();
    }
}

export async function closePool() {
    if (pool) { await pool.end(); pool = null; }
}

/** MariaDB duplicate-key. Used to turn a unique-constraint race into a clean answer. */
export const isDuplicateKey = (err) => err && (err.code === 'ER_DUP_ENTRY' || err.errno === 1062);
