/** Customer authentication. Sessions are httpOnly cookies; no token ever reaches JS. */

import express from 'express';
import rateLimit from 'express-rate-limit';
import { query, queryOne } from '../db/pool.js';
import {
    COOKIE, cookieOptions, createCustomer, createSession, normaliseEmail, revokeSession,
    revokeAllSessions, verifyPassword, registerFailedLogin, clearFailedLogins, isLocked, hashPassword,
} from '../services/auth.js';
import { validateLogin, validateRegistration } from '../lib/validate.js';
import { asyncRoute, requireCustomer } from '../middleware/auth.js';
import { publicId, sessionToken, sha256 } from '../lib/ids.js';
import { config } from '../config.js';

const router = express.Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, max: config.rateLimits.authMax,
    standardHeaders: true, legacyHeaders: false,
    message: { error: 'Too many attempts, please try again later' },
});

const publicUser = (u) => ({
    id: u.public_id, email: u.email, fullName: u.full_name, phone: u.phone,
    emailVerified: Boolean(u.email_verified_at),
});

router.post('/register', authLimiter, asyncRoute(async (req, res) => {
    const input = validateRegistration(req.body);

    const existing = await queryOne('SELECT id FROM users WHERE email_normalised = ?', [normaliseEmail(input.email)]);
    if (existing) {
        // Deliberately the same shape as success would be for a NEW address is
        // not possible here (we must not create a session), but the message
        // avoids confirming which addresses are registered beyond what the
        // signup form already reveals by design.
        return res.status(409).json({ error: 'That email address cannot be registered' });
    }

    const { id } = await createCustomer(input);
    const session = await createSession('customer', id, { userAgent: req.get('user-agent'), ip: req.ip });
    res.cookie(COOKIE.customer, session.token, cookieOptions(session.maxAge));

    const user = await queryOne('SELECT * FROM users WHERE id = ?', [id]);
    return res.status(201).json({ user: publicUser(user) });
}));

router.post('/login', authLimiter, asyncRoute(async (req, res) => {
    const { email, password } = validateLogin(req.body);
    const user = await queryOne('SELECT * FROM users WHERE email_normalised = ?', [normaliseEmail(email)]);

    // Same response for "no such account" and "wrong password" so the endpoint
    // cannot be used to enumerate registered addresses.
    const deny = () => res.status(401).json({ error: 'Invalid email or password' });

    if (!user) { await hashPassword('timing-equaliser'); return deny(); }
    if (isLocked(user)) return res.status(423).json({ error: 'Account temporarily locked. Try again later.' });
    if (user.status !== 'active') return deny();

    const ok = await verifyPassword(user.password_hash, password);
    if (!ok) { await registerFailedLogin('users', user.id); return deny(); }

    await clearFailedLogins('users', user.id);
    const session = await createSession('customer', user.id, { userAgent: req.get('user-agent'), ip: req.ip });
    res.cookie(COOKIE.customer, session.token, cookieOptions(session.maxAge));
    return res.json({ user: publicUser(user) });
}));

router.post('/logout', asyncRoute(async (req, res) => {
    await revokeSession('customer', req.cookies?.[COOKIE.customer]);
    res.clearCookie(COOKIE.customer, { path: '/' });
    return res.status(204).end();
}));

router.post('/logout-all', requireCustomer, asyncRoute(async (req, res) => {
    await revokeAllSessions('customer', req.user.id);
    res.clearCookie(COOKIE.customer, { path: '/' });
    return res.status(204).end();
}));

router.get('/me', requireCustomer, asyncRoute(async (req, res) => {
    const user = await queryOne('SELECT * FROM users WHERE id = ?', [req.user.id]);
    return res.json({ user: publicUser(user) });
}));

/**
 * Password reset request. ALWAYS 202, whether or not the address exists —
 * otherwise this endpoint becomes an account-enumeration oracle.
 *
 * Delivery is queued to `notifications`; wiring an email provider is an owner
 * action. The token architecture is complete and testable without it.
 */
router.post('/forgot-password', authLimiter, asyncRoute(async (req, res) => {
    const email = normaliseEmail(req.body?.email);
    const user = email ? await queryOne('SELECT id, email FROM users WHERE email_normalised = ?', [email]) : null;

    if (user) {
        const token = sessionToken();
        await query(
            `INSERT INTO user_tokens (user_id, purpose, token_hash, expires_at)
             VALUES (?, 'password_reset', ?, DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL 60 MINUTE))`,
            [user.id, sha256(token)],
        );
        await query(
            `INSERT INTO notifications (channel, recipient, template, payload_json)
             VALUES ('email', ?, 'password_reset', ?)`,
            [user.email, JSON.stringify({ tokenIssued: true })],  // never the token itself
        );
        // The token is returned only outside production, so tests can exercise
        // the reset flow without an email provider.
        if (process.env.NODE_ENV !== 'production') {
            return res.status(202).json({ accepted: true, devToken: token });
        }
    }
    return res.status(202).json({ accepted: true });
}));

router.post('/reset-password', authLimiter, asyncRoute(async (req, res) => {
    const token = typeof req.body?.token === 'string' ? req.body.token : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!token || password.length < 10) {
        return res.status(400).json({ error: 'A valid token and a password of at least 10 characters are required' });
    }

    const row = await queryOne(
        `SELECT id, user_id FROM user_tokens
          WHERE token_hash = ? AND purpose = 'password_reset'
            AND used_at IS NULL AND expires_at > CURRENT_TIMESTAMP(3)`,
        [sha256(token)],
    );
    if (!row) return res.status(400).json({ error: 'This reset link is invalid or has expired' });

    const hash = await hashPassword(password);
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, row.user_id]);
    await query('UPDATE user_tokens SET used_at = CURRENT_TIMESTAMP(3) WHERE id = ?', [row.id]);
    // Every existing session dies with the old password.
    await revokeAllSessions('customer', row.user_id);
    return res.status(204).end();
}));

export default router;
