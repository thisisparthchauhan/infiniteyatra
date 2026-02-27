'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    redirectTo?: string;
}

export default function ProtectedRoute({ children, redirectTo = '/login' }: ProtectedRouteProps) {
    const { currentUser, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !currentUser) {
            router.push(redirectTo);
        }
    }, [currentUser, loading, router, redirectTo]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050505]">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!currentUser) return null;

    return <>{children}</>;
}
