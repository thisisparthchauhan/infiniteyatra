import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader, Lock, ShieldAlert } from 'lucide-react';

const RoleRoute = ({ children, allowedRoles = [] }) => {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <Loader className="animate-spin text-blue-600" size={40} />
            </div>
        );
    }

    if (!currentUser) {
        return <Navigate to="/login" />;
    }

    // Check if user has one of the allowed roles
    // If allowedRoles is empty, it means ANY logged-in user can access (if that was the intent, but usually we list roles)
    // If currentUser.role is undefined, default to 'customer'
    const userRole = currentUser.role || 'customer';

    // Admin Override: Admins can usually access everything, but let's be explicit
    // If 'admin' is in the allowed list, or if the user IS an admin (super user)
    const hasPermission = allowedRoles.includes(userRole) || currentUser.isAdmin === true || userRole === 'admin';

    if (!hasPermission) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#050505]">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
                    <ShieldAlert className="text-red-500" size={40} />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Access Restricted</h1>
                <p className="text-slate-400 mb-8 max-w-md">
                    This area is restricted to <strong>{allowedRoles.join(' / ')}</strong> roles.
                </p>
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl mb-8 w-full max-w-xs">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Your Account</p>
                    <p className="font-medium text-white">{currentUser.email}</p>
                    <div className="mt-2 text-xs">
                        Role: <span className="text-blue-400 font-mono bg-blue-500/10 px-2 py-0.5 rounded">{userRole}</span>
                    </div>
                </div>
                <Navigate to="/" />
            </div>
        );
    }

    return children;
};

export default RoleRoute;
