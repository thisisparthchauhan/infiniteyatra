import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { Enquiry } from '../models/Enquiry.js';
import { requireAdmin } from '../middleware/auth.js';
import { isValidEmail, isShortString, badRequest } from '../utils/validate.js';

const router = Router();

const submitLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 30 });

// POST /api/enquiries  — public enquiry popup.
router.post('/', submitLimiter, async (req, res, next) => {
    try {
        const data = req.body || {};
        if (Object.keys(data).length > 12) return badRequest(res, 'Too many fields');
        if (!isShortString(data.name, 200)) return badRequest(res, 'Invalid name');
        if (!isShortString(data.message, 5000)) return badRequest(res, 'Invalid message');
        if (data.email && !isValidEmail(data.email)) return badRequest(res, 'Invalid email');
        const enquiry = await Enquiry.create(data);
        return res.status(201).json({ id: enquiry._id });
    } catch (err) {
        next(err);
    }
});

// GET /api/enquiries  — admin only.
router.get('/', requireAdmin, async (req, res, next) => {
    try {
        const enquiries = await Enquiry.find().sort({ createdAt: -1 }).limit(500);
        return res.json({ enquiries });
    } catch (err) {
        next(err);
    }
});

export default router;
