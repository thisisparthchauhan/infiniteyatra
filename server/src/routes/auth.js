import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { User } from '../models/User.js';
import { signToken, requireAuth } from '../middleware/auth.js';
import { env } from '../config/env.js';
import { isValidEmail, badRequest } from '../utils/validate.js';

const router = Router();

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res, next) => {
    try {
        const { email, password, firstName, lastName } = req.body || {};
        if (!isValidEmail(email)) return badRequest(res, 'Valid email required');
        if (typeof password !== 'string' || password.length < 8) {
            return badRequest(res, 'Password must be at least 8 characters');
        }

        const exists = await User.findOne({ email: email.toLowerCase() });
        if (exists) return res.status(409).json({ error: 'Email already registered' });

        const passwordHash = await bcrypt.hash(password, 12);
        const role = env.adminEmails.includes(email.toLowerCase()) ? 'admin' : 'user';
        const user = await User.create({ email, passwordHash, firstName, lastName, role });

        return res.status(201).json({ token: signToken(user), user });
    } catch (err) {
        next(err);
    }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res, next) => {
    try {
        const { email, password } = req.body || {};
        if (!isValidEmail(email) || typeof password !== 'string') {
            return badRequest(res, 'Email and password required');
        }
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        return res.json({ token: signToken(user), user });
    } catch (err) {
        next(err);
    }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.sub);
        if (!user) return res.status(404).json({ error: 'User not found' });
        return res.json({ user });
    } catch (err) {
        next(err);
    }
});

export default router;
