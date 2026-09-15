/** Public catalogue reads. No authentication; no write path exists on this router. */

import express from 'express';
import { query, queryOne } from '../db/pool.js';
import { asyncRoute } from '../middleware/auth.js';

const router = express.Router();

const parseJson = (v, fallback) => {
    if (v == null) return fallback;
    if (typeof v === 'object') return v;
    try { return JSON.parse(v); } catch { return fallback; }
};

const publicPackage = (p, pickups = []) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    location: p.location,
    duration: p.duration,
    description: p.description,
    price: { currency: p.currency, minorUnitsPerMajor: p.minor_units_per_major, baseMinor: Number(p.base_price_minor) },
    minTravellers: p.min_travellers,
    maxGroupSize: p.max_group_size,
    heroImageUrl: p.hero_image_url,
    images: parseJson(p.images_json, []),
    inclusions: parseJson(p.inclusions_json, []),
    exclusions: parseJson(p.exclusions_json, []),
    cancellationPolicy: parseJson(p.cancellation_policy_json, []),
    itinerary: parseJson(p.itinerary_json, []),
    pickupOptions: pickups.map((o) => ({ id: o.id, label: o.label, priceMinor: Number(o.price_minor) })),
});

router.get('/packages', asyncRoute(async (req, res) => {
    const rows = await query(
        `SELECT * FROM packages WHERE deleted_at IS NULL AND is_visible = 1 ORDER BY title`,
    );
    res.json({ packages: rows.map((p) => publicPackage(p)) });
}));

router.get('/packages/:slug', asyncRoute(async (req, res) => {
    const pkg = await queryOne(
        'SELECT * FROM packages WHERE slug = ? AND deleted_at IS NULL AND is_visible = 1',
        [String(req.params.slug)],
    );
    if (!pkg) return res.status(404).json({ error: 'Package not found' });
    const pickups = await query(
        'SELECT id, label, price_minor FROM package_pickup_options WHERE package_id = ? ORDER BY sort_order, id',
        [pkg.id],
    );
    return res.json({ package: publicPackage(pkg, pickups) });
}));

router.get('/hotels', asyncRoute(async (req, res) => {
    const rows = await query('SELECT * FROM hotels WHERE deleted_at IS NULL AND is_visible = 1 ORDER BY name');
    res.json({
        hotels: rows.map((h) => ({
            id: h.id, slug: h.slug, name: h.name, location: h.location, description: h.description,
            starRating: h.star_rating, heroImageUrl: h.hero_image_url,
            images: parseJson(h.images_json, []), amenities: parseJson(h.amenities_json, []),
            price: h.base_price_minor == null ? null
                : { currency: h.currency, minorUnitsPerMajor: h.minor_units_per_major, baseMinor: Number(h.base_price_minor) },
        })),
    });
}));

router.get('/content/:kind', asyncRoute(async (req, res) => {
    const kind = String(req.params.kind);
    if (!['story', 'page', 'homepage_block'].includes(kind)) {
        return res.status(404).json({ error: 'Not found' });
    }
    const rows = await query(
        'SELECT slug, title, body, images_json, created_at FROM content_pages WHERE kind = ? AND is_published = 1 AND deleted_at IS NULL ORDER BY created_at DESC',
        [kind],
    );
    return res.json({
        items: rows.map((c) => ({
            slug: c.slug, title: c.title, body: c.body,
            images: parseJson(c.images_json, []), createdAt: c.created_at,
        })),
    });
}));

export default router;
