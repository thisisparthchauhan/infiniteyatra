import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { Lead } from '../models/Lead.js';
import { requireAdmin } from '../middleware/auth.js';
import { isValidEmail, isShortString, badRequest } from '../utils/validate.js';

const router = Router();

const submitLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 30 });

// POST /api/leads  — public lead capture from any inquiry form.
router.post('/', submitLimiter, async (req, res, next) => {
    try {
        const data = req.body || {};
        if (Object.keys(data).length > 25) return badRequest(res, 'Too many fields');
        if (!isShortString(data.name, 200)) return badRequest(res, 'Invalid name');
        if (!isShortString(data.phone, 40)) return badRequest(res, 'Invalid phone');
        if (!isShortString(data.message, 5000)) return badRequest(res, 'Invalid message');
        if (data.email && data.email !== '' && !isValidEmail(data.email)) {
            return badRequest(res, 'Invalid email');
        }
        const lead = await Lead.create({ ...data, status: 'new' });
        return res.status(201).json({ id: lead._id });
    } catch (err) {
        next(err);
    }
});

// GET /api/leads  — admin only (dashboard).
router.get('/', requireAdmin, async (req, res, next) => {
    try {
        const leads = await Lead.find().sort({ createdAt: -1 }).limit(500);
        return res.json({ leads });
    } catch (err) {
        next(err);
    }
});

export default router;
