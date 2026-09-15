/** Shared harness: a real MariaDB, a real Express app, real HTTP, real cookies. */

import { createApp } from '../src/app.js';
import { query, closePool } from '../src/db/pool.js';

export async function startServer() {
    const app = createApp();
    const server = await new Promise((resolve) => {
        const s = app.listen(0, '127.0.0.1', () => resolve(s));
    });
    const base = `http://127.0.0.1:${server.address().port}`;
    return {
        base,
        close: () => new Promise((r) => server.close(r)),
    };
}

/** A tiny client that remembers cookies, the way a browser does. */
export function makeClient(base) {
    const jar = new Map();
    const cookieHeader = () => [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
    return {
        jar,
        async req(path, { method = 'GET', body, origin } = {}) {
            const headers = { 'Content-Type': 'application/json' };
            if (jar.size) headers.Cookie = cookieHeader();
            if (origin) headers.Origin = origin;
            const res = await fetch(`${base}${path}`, {
                method, headers, body: body === undefined ? undefined : JSON.stringify(body),
            });
            for (const raw of res.headers.getSetCookie?.() || []) {
                const [pair] = raw.split(';');
                const idx = pair.indexOf('=');
                const name = pair.slice(0, idx);
                const value = pair.slice(idx + 1);
                if (value === '') jar.delete(name); else jar.set(name, value);
            }
            const text = await res.text();
            let json = null;
            try { json = text ? JSON.parse(text) : null; } catch { /* non-JSON */ }
            return { status: res.status, body: json, text, headers: res.headers };
        },
    };
}

/** Truncate every table between tests so each starts from a genuinely fresh launch. */
export async function resetDatabase() {
    await query('SET FOREIGN_KEY_CHECKS = 0');
    const tables = [
        'booking_activity', 'booking_notes', 'booking_documents', 'booking_summaries',
        'summary_counters', 'payments', 'booking_travellers', 'booking_contacts',
        'booking_references', 'bookings', 'notifications',
        'user_tokens', 'user_sessions', 'staff_sessions', 'users', 'staff_users',
        'package_pickup_options', 'packages', 'hotels', 'content_pages',
    ];
    for (const t of tables) await query(`TRUNCATE TABLE ${t}`);
    await query('SET FOREIGN_KEY_CHECKS = 1');
}

export async function seedCatalogue() {
    const pkg = await query(
        `INSERT INTO packages (slug, title, location, duration, base_price_minor, min_travellers, max_group_size, is_visible)
         VALUES ('himalaya-trek', 'Himalaya Trek', 'Uttarakhand', '5 Days', 1500000, 1, 12, 1)`,
    );
    const pickup = await query(
        `INSERT INTO package_pickup_options (package_id, label, price_minor, sort_order)
         VALUES (?, 'Delhi', 1600000, 0)`, [pkg.insertId],
    );
    const hotel = await query(
        `INSERT INTO hotels (slug, name, location, base_price_minor, is_visible)
         VALUES ('snow-peak', 'Snow Peak Resort', 'Manali', 800000, 1)`,
    );
    return { packageId: pkg.insertId, pickupOptionId: pickup.insertId, hotelId: hotel.insertId };
}

export const bookingBody = (over = {}) => ({
    packageId: over.packageId,
    departureDate: '2026-06-10',
    travellerCount: 2,
    contact: { fullName: 'Test Person', email: 'test@example.invalid', phone: '+919876543210' },
    travellers: [
        { firstName: 'Test', lastName: 'Person' },
        { firstName: 'Second', lastName: 'Traveller' },
    ],
    idempotencyKey: `key-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    ...over,
});

export { query, closePool };
