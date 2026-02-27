import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader, Lock } from 'lucide-react';

const ADMIN_EMAILS = [
    'infiniteyatra@gmail.com',
    'chauhanparth165@gmail.com',
    'universetcenter@gmail.com'
];

const AdminRoute = ({ children }) => {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader className="animate-spin text-blue-600" size={40} />
            </div>
        );
    }

    if (!currentUser) {
        return <Navigate to="/login" />;
    }

    if (!ADMIN_EMAILS.includes(currentUser.email)) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                    <Lock className="text-red-600" size={40} />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Access Denied</h1>
                <p className="text-slate-600 mb-8 max-w-md">
                    You do not have permission to view this page. This area is restricted to administrators only.
                </p>
                <div className="p-4 bg-white border border-slate-200 rounded-xl mb-8">
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Your Email</p>
                    <p className="font-mono font-medium text-slate-800">{currentUser.email}</p>
                </div>
                <Navigate to="/" />
            </div>
        );
    }

    return children;
};

export default AdminRoute;
