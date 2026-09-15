import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi, staffApi, ApiError } from '../services/apiClient';

/**
 * FRESH LAUNCH — customer identity now comes from the Infinite Yatra API, not
 * Firebase Auth.
 *
 * The session is an httpOnly cookie the browser holds and this code cannot
 * read: there is no token in localStorage, nothing in an Authorization header,
 * and nothing for injected script to steal or replay. "Am I signed in?" is
 * answered by asking the server, never by inspecting a local value.
 *
 * `currentUser.uid` is kept as a field name because ~30 components read it. It
 * now carries the API's opaque public id rather than a Firebase uid. It is a
 * display/ownership hint only — every protected action is authorised again on
 * the server against the session cookie.
 *
 * Staff identity is deliberately a SEPARATE session and a separate cookie.
 * `isAdmin` here reflects a verified staff session, never an email address.
 */

const AuthContext = createContext(null);

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside an AuthProvider');
    return ctx;
};

/** Map the API's user shape onto the field names the existing components read. */
function toCurrentUser(user, staff) {
    if (!user && !staff) return null;
    const source = user || {};
    const parts = String(source.fullName || '').trim().split(/\s+/).filter(Boolean);
    return {
        uid: source.id ?? staff?.id ?? null,
        email: source.email ?? staff?.email ?? null,
        displayName: source.fullName ?? staff?.fullName ?? null,
        name: source.fullName ?? staff?.fullName ?? null,
        firstName: parts[0] ?? null,
        lastName: parts.length > 1 ? parts[parts.length - 1] : null,
        phone: source.phone ?? null,
        emailVerified: Boolean(source.emailVerified),
        // Staff facts. Null for a plain customer; never derived from an email.
        staffRole: staff?.role ?? null,
        claimRole: staff?.role ?? null,      // kept for components written against SA-1
        isStaff: Boolean(staff),
        isAdmin: staff?.role === 'admin',
    };
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [staff, setStaff] = useState(null);
    const [loading, setLoading] = useState(true);

    /** Ask the server who we are. A 401 is the normal signed-out answer. */
    const refresh = useCallback(async () => {
        const [u, s] = await Promise.all([
            authApi.me().then((r) => r?.user ?? null).catch(() => null),
            staffApi.me().then((r) => r?.staff ?? null).catch(() => null),
        ]);
        setUser(u);
        setStaff(s);
        return { user: u, staff: s };
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try { await refresh(); }
            finally { if (!cancelled) setLoading(false); }
        })();
        return () => { cancelled = true; };
    }, [refresh]);

    const login = useCallback(async (email, password) => {
        const res = await authApi.login(email, password);
        setUser(res.user);
        return res.user;
    }, []);

    const register = useCallback(async (data) => {
        const res = await authApi.register(data);
        setUser(res.user);
        return res.user;
    }, []);

    const logout = useCallback(async () => {
        // Clear locally even if the network call fails, so the UI never claims
        // the user is still signed in after they asked to leave.
        try { await authApi.logout(); } finally { setUser(null); }
    }, []);

    const staffLogin = useCallback(async (email, password) => {
        const res = await staffApi.login(email, password);
        setStaff(res.staff);
        return res.staff;
    }, []);

    const staffLogout = useCallback(async () => {
        try { await staffApi.logout(); } finally { setStaff(null); }
    }, []);

    const value = {
        currentUser: toCurrentUser(user, staff),
        loading,
        login,
        register,
        logout,
        staffLogin,
        staffLogout,
        refresh,
        /**
         * Phone sign-in is not part of the fresh launch: the new system
         * identifies customers by email. Kept so a caller fails loudly rather
         * than silently doing nothing.
         */
        loginWithPhone: async () => {
            throw new ApiError('Phone sign-in is not available. Please sign in with your email address.', { status: 400 });
        },
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
