/** Staff authentication. Separate table, separate cookie, separate session store. */

import express from 'express';
import rateLimit from 'express-rate-limit';
import { queryOne } from '../db/pool.js';
import {
    COOKIE, cookieOptions, createSession, normaliseEmail, revokeSession,
    verifyPassword, registerFailedLogin, clearFailedLogins, isLocked, hashPassword,
} from '../services/auth.js';
import { validateLogin } from '../lib/validate.js';
import { asyncRoute, requireStaffSession } from '../middleware/auth.js';
import { STAFF_ROLE_LABELS } from '../lib/roles.js';
import { config } from '../config.js';

const router = express.Router();

const staffLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, max: config.rateLimits.staffAuthMax,
    standardHeaders: true, legacyHeaders: false,
    message: { error: 'Too many attempts, please try again later' },
});

const publicStaff = (s) => ({
    id: s.public_id, email: s.email, fullName: s.full_name,
    role: s.role, roleLabel: STAFF_ROLE_LABELS[s.role] || s.role,
});

router.post('/login', staffLimiter, asyncRoute(async (req, res) => {
    const { email, password } = validateLogin(req.body);
    const staff = await queryOne('SELECT * FROM staff_users WHERE email_normalised = ?', [normaliseEmail(email)]);
    const deny = () => res.status(401).json({ error: 'Invalid email or password' });

    if (!staff) { await hashPassword('timing-equaliser'); return deny(); }
    if (isLocked(staff)) return res.status(423).json({ error: 'Account temporarily locked. Try again later.' });
    if (staff.status !== 'active') return deny();

    const ok = await verifyPassword(staff.password_hash, password);
    if (!ok) { await registerFailedLogin('staff_users', staff.id); return deny(); }

    await clearFailedLogins('staff_users', staff.id);
    const session = await createSession('staff', staff.id, { userAgent: req.get('user-agent'), ip: req.ip });
    res.cookie(COOKIE.staff, session.token, cookieOptions(session.maxAge));
    return res.json({ staff: publicStaff(staff) });
}));

router.post('/logout', asyncRoute(async (req, res) => {
    await revokeSession('staff', req.cookies?.[COOKIE.staff]);
    res.clearCookie(COOKIE.staff, { path: '/' });
    return res.status(204).end();
}));

router.get('/me', requireStaffSession, asyncRoute(async (req, res) => {
    return res.json({ staff: publicStaff(req.staff) });
}));

export default router;
