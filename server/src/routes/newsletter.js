import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { NewsletterSubscriber } from '../models/NewsletterSubscriber.js';
import { requireAdmin } from '../middleware/auth.js';
import { isValidEmail, badRequest } from '../utils/validate.js';

const router = Router();

const submitLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 30 });

// POST /api/newsletter  — public subscribe. Dedupe handled by the unique index.
router.post('/', submitLimiter, async (req, res, next) => {
    try {
        const { email, source } = req.body || {};
        if (!isValidEmail(email)) return badRequest(res, 'Valid email required');
        try {
            await NewsletterSubscriber.create({ email, source: source || 'footer' });
        } catch (err) {
            if (err.code === 11000) return res.status(200).json({ duplicate: true });
            throw err;
        }
        return res.status(201).json({ ok: true });
    } catch (err) {
        next(err);
    }
});

// GET /api/newsletter  — admin only.
router.get('/', requireAdmin, async (req, res, next) => {
    try {
        const subscribers = await NewsletterSubscriber.find().sort({ createdAt: -1 }).limit(1000);
        return res.json({ subscribers });
    } catch (err) {
        next(err);
    }
});

export default router;
