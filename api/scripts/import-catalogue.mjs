#!/usr/bin/env node
/**
 * ONE-TIME business-data import: Firebase (legacy) -> MariaDB (fresh).
 *
 * BUSINESS DATA ONLY. The source collections are an explicit allowlist below.
 * Customer data is not importable by construction — there is no code path here
 * that reads users, bookings, payments, travellers or documents, and a guard
 * refuses if anyone adds one.
 *
 * DRY RUN BY DEFAULT. Writing requires --apply.
 * IDEMPOTENT: rows are matched on legacy_id, so re-running updates rather than
 * duplicating. Nothing in Firebase is ever written or deleted.
 *
 *   node scripts/import-catalogue.mjs                 # dry run
 *   node scripts/import-catalogue.mjs --apply
 */

import { createRequire } from 'node:module';
import { query, closePool } from '../src/db/pool.js';

const require = createRequire(import.meta.url);
const admin = require('/Users/utc/XRayNO/infiniteyatra/functions/node_modules/firebase-admin');

const APPLY = process.argv.includes('--apply');
const PROJECT_ID = process.env.GCLOUD_PROJECT || 'infiniteyatra-iy';

/** The ONLY collections this tool may read. */
const ALLOWED_SOURCES = Object.freeze(['packages', 'hotels', 'travelStories']);

/** Never readable here. Present so the intent is reviewable, not implicit. */
const FORBIDDEN_SOURCES = Object.freeze([
    'users', 'bookings', 'payments', 'booking_documents', 'booking_references',
    'enquiries', 'leads', 'newsletter_subscribers', 'hotel_bookings', 'transport_bookings',
]);

for (const c of ALLOWED_SOURCES) {
    if (FORBIDDEN_SOURCES.includes(c)) {
        console.error(`\n  Refusing to run: "${c}" is customer data and must never be imported.\n`);
        process.exit(1);
    }
}

if (!admin.apps.length) admin.initializeApp({ projectId: PROJECT_ID });
const fs = admin.firestore();

const slugify = (s, fallback) => {
    const v = String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 160);
    return v || fallback;
};

/** Rupees (or a string) -> integer paise. Never a float in the database. */
function toMinor(value) {
    if (value == null || value === '') return null;
    const n = typeof value === 'number' ? value : Number(String(value).replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(n) || n < 0) return null;
    return Math.round(n * 100);
}

const isHttpUrl = (u) => typeof u === 'string' && /^https?:\/\//i.test(u);

const arr = (v) => (Array.isArray(v) ? v.filter((x) => x != null) : []);

const stats = { packages: { seen: 0, ok: 0, written: 0, skipped: [] },
                hotels: { seen: 0, ok: 0, written: 0, skipped: [] },
                content: { seen: 0, ok: 0, written: 0, skipped: [] },
                images: { valid: 0, invalid: 0 } };

function checkImages(list) {
    const valid = [];
    for (const u of list) {
        if (isHttpUrl(u)) { valid.push(u); stats.images.valid += 1; }
        else stats.images.invalid += 1;
    }
    return valid;
}

async function importPackages() {
    const snap = await fs.collection('packages').get();
    for (const doc of snap.docs) {
        stats.packages.seen += 1;
        const d = doc.data();

        const title = String(d.title || '').trim();
        const priceMinor = toMinor(d.price);
        // Required content: a package with no title or no price cannot be sold.
        if (!title) { stats.packages.skipped.push(`${doc.id}: no title`); continue; }
        if (!priceMinor) { stats.packages.skipped.push(`${doc.id}: no usable price`); continue; }

        const images = checkImages([d.image, d.heroImage, ...arr(d.images)].filter(Boolean));
        const slug = slugify(d.slug || title, doc.id);
        stats.packages.ok += 1;

        if (!APPLY) continue;

        const res = await query(
            `INSERT INTO packages
               (slug, legacy_id, title, location, duration, description, base_price_minor,
                min_travellers, max_group_size, hero_image_url, images_json,
                inclusions_json, exclusions_json, cancellation_policy_json, itinerary_json, is_visible)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
             ON DUPLICATE KEY UPDATE
                title = VALUES(title), location = VALUES(location), duration = VALUES(duration),
                description = VALUES(description), base_price_minor = VALUES(base_price_minor),
                min_travellers = VALUES(min_travellers), max_group_size = VALUES(max_group_size),
                hero_image_url = VALUES(hero_image_url), images_json = VALUES(images_json),
                inclusions_json = VALUES(inclusions_json), exclusions_json = VALUES(exclusions_json),
                cancellation_policy_json = VALUES(cancellation_policy_json),
                itinerary_json = VALUES(itinerary_json), is_visible = VALUES(is_visible)`,
            [slug, doc.id, title, d.location || null, d.duration || null, d.description || null,
             priceMinor, Number(d.minimumPersons) || 1, d.maxGroupSize ? Number(d.maxGroupSize) : null,
             images[0] || null, JSON.stringify(images),
             JSON.stringify(arr(d.inclusions)), JSON.stringify(arr(d.exclusions)),
             JSON.stringify(arr(d.cancellationPolicy)), JSON.stringify(arr(d.itinerary)),
             d.isVisible === false ? 0 : 1],
        );
        stats.packages.written += 1;

        // Pickup options become real rows with real ids: PB-1 addressed them by
        // array index, and an index is not an identity.
        const pkgRow = await query('SELECT id FROM packages WHERE legacy_id = ?', [doc.id]);
        const packageId = pkgRow[0].id;
        for (const [i, loc] of arr(d.pickupLocations).entries()) {
            const label = String(loc?.location || '').trim();
            const optMinor = toMinor(loc?.price);
            if (!label || !optMinor) continue;
            await query(
                `INSERT INTO package_pickup_options (package_id, label, price_minor, sort_order)
                 VALUES (?,?,?,?)
                 ON DUPLICATE KEY UPDATE price_minor = VALUES(price_minor), sort_order = VALUES(sort_order)`,
                [packageId, label, optMinor, i],
            );
        }
        void res;
    }
}

async function importHotels() {
    const snap = await fs.collection('hotels').get();
    for (const doc of snap.docs) {
        stats.hotels.seen += 1;
        const d = doc.data();
        const name = String(d.name || d.title || '').trim();
        if (!name) { stats.hotels.skipped.push(`${doc.id}: no name`); continue; }

        const images = checkImages([d.image, ...arr(d.images)].filter(Boolean));
        stats.hotels.ok += 1;
        if (!APPLY) continue;

        await query(
            `INSERT INTO hotels (slug, legacy_id, name, location, description, star_rating,
                                 base_price_minor, hero_image_url, images_json, amenities_json, is_visible)
             VALUES (?,?,?,?,?,?,?,?,?,?,?)
             ON DUPLICATE KEY UPDATE
                name = VALUES(name), location = VALUES(location), description = VALUES(description),
                star_rating = VALUES(star_rating), base_price_minor = VALUES(base_price_minor),
                hero_image_url = VALUES(hero_image_url), images_json = VALUES(images_json),
                amenities_json = VALUES(amenities_json), is_visible = VALUES(is_visible)`,
            [slugify(d.slug || name, doc.id), doc.id, name, d.location || null, d.description || null,
             d.starRating ? Number(d.starRating) : null, toMinor(d.pricePerNight ?? d.price),
             images[0] || null, JSON.stringify(images), JSON.stringify(arr(d.amenities)),
             d.isVisible === false ? 0 : 1],
        );
        stats.hotels.written += 1;
    }
}

async function importContent() {
    const snap = await fs.collection('travelStories').get();
    for (const doc of snap.docs) {
        stats.content.seen += 1;
        const d = doc.data();
        const title = String(d.title || '').trim();
        if (!title) { stats.content.skipped.push(`${doc.id}: no title`); continue; }

        const images = checkImages(arr(d.images));
        stats.content.ok += 1;
        if (!APPLY) continue;

        await query(
            `INSERT INTO content_pages (slug, legacy_id, kind, title, body, images_json, is_published)
             VALUES (?,?, 'story', ?,?,?,?)
             ON DUPLICATE KEY UPDATE title = VALUES(title), body = VALUES(body),
                images_json = VALUES(images_json), is_published = VALUES(is_published)`,
            [slugify(title, doc.id), doc.id, title, d.description || d.body || null,
             JSON.stringify(images), 1],
        );
        stats.content.written += 1;
    }
}

const report = (name, s) => {
    console.log(`  ${name.padEnd(10)} seen ${String(s.seen).padStart(3)}   importable ${String(s.ok).padStart(3)}   written ${String(s.written).padStart(3)}`);
    // Ids only — a skip reason never carries document content.
    for (const r of s.skipped.slice(0, 8)) console.log(`      skipped ${r}`);
    if (s.skipped.length > 8) console.log(`      ... and ${s.skipped.length - 8} more`);
};

console.log(`\n  Catalogue import  -  ${PROJECT_ID} -> MariaDB`);
console.log(`  Mode: ${APPLY ? 'APPLY (writes MariaDB)' : 'DRY RUN (no writes)'}`);
console.log(`  Allowed sources: ${ALLOWED_SOURCES.join(', ')}`);
console.log(`  Customer data is not readable by this tool.\n`);

await importPackages();
await importHotels();
await importContent();

report('packages', stats.packages);
report('hotels', stats.hotels);
report('content', stats.content);
console.log(`  images     valid ${stats.images.valid}   unusable ${stats.images.invalid}`);

console.log(APPLY
    ? '\n  Import complete. Firebase was read only; nothing there was modified.\n'
    : '\n  DRY RUN - nothing was written. Re-run with --apply to import.\n');

await closePool();
process.exit(0);
