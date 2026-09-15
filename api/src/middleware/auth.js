/**
 * Authentication and authorization middleware.
 *
 * AUTHORIZATION IS SERVER-SIDE AND DATABASE-BACKED. The role is read from
 * staff_users on every request, never from a header, a body field, or anything
 * the browser sends. A frontend role value decides what renders and nothing else.
 */

import { COOKIE, resolveSession } from '../services/auth.js';
import { queryOne } from '../db/pool.js';
import { isStaffRole } from '../lib/roles.js';

/** Populates req.user for a signed-in customer, or 401s. */
export async function requireCustomer(req, res, next) {
    try {
        const session = await resolveSession('customer', req.cookies?.[COOKIE.customer]);
        if (!session) return res.status(401).json({ error: 'Authentication required' });
        const user = await queryOne(
            'SELECT id, public_id, email, full_name, phone, status FROM users WHERE id = ?',
            [session.owner_id],
        );
        if (!user || user.status !== 'active') return res.status(401).json({ error: 'Authentication required' });
        req.user = user;
        return next();
    } catch (err) { return next(err); }
}

/** Populates req.staff, or 401s. Role is loaded fresh from the database. */
export async function requireStaffSession(req, res, next) {
    try {
        const session = await resolveSession('staff', req.cookies?.[COOKIE.staff]);
        if (!session) return res.status(401).json({ error: 'Authentication required' });
        const staff = await queryOne(
            'SELECT id, public_id, email, full_name, role, status FROM staff_users WHERE id = ?',
            [session.owner_id],
        );
        if (!staff || staff.status !== 'active') return res.status(401).json({ error: 'Authentication required' });
        req.staff = staff;
        return next();
    } catch (err) { return next(err); }
}

/**
 * Require one of `allowedRoles`. `admin` satisfies every staff guard.
 *
 * Throws at startup on a non-canonical role, so a typo is a boot failure rather
 * than a route that silently permits nobody — or worse, everybody.
 */
export function requireRole(allowedRoles) {
    const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    for (const r of allowed) {
        if (!isStaffRole(r)) throw new Error(`requireRole: "${r}" is not a canonical staff role`);
    }
    return function roleGuard(req, res, next) {
        const staff = req.staff;
        if (!staff) {
            // Mounted without requireStaffSession in front: fail closed and say so.
            console.error('[auth] requireRole used without requireStaffSession');
            return res.status(401).json({ error: 'Authentication required' });
        }
        const permitted = staff.role === 'admin' || allowed.includes(staff.role);
        if (!permitted) {
            // Names neither the required role nor the caller's.
            return res.status(403).json({ error: 'You do not have access to this resource' });
        }
        return next();
    };
}

/** Wrap an async handler so a rejection becomes a clean 500, never a leaked stack. */
export const asyncRoute = (handler) => (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
};
