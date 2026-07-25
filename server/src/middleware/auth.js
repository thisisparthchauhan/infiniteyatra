import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// Signs a JWT for an authenticated user.
export function signToken(user) {
    return jwt.sign(
        { sub: String(user._id), email: user.email, role: user.role },
        env.jwtSecret,
        { expiresIn: env.jwtExpiresIn },
    );
}

// Populates req.user from a Bearer token when present. Does not reject — use
// requireAuth / requireAdmin to gate specific routes.
export function authenticate(req, _res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (token) {
        try {
            req.user = jwt.verify(token, env.jwtSecret);
        } catch {
            req.user = null;
        }
    }
    next();
}

export function requireAuth(req, res, next) {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    next();
}

export function requireAdmin(req, res, next) {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    next();
}
