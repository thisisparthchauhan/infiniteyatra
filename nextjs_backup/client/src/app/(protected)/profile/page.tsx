'use client';
import ProtectedRoute from '@/components/common/ProtectedRoute';

export default function ProfilePage() {
    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[#050505] text-white pt-24">
                {/* TODO: Migrate Profile.jsx here */}
                <p className="p-8 text-white/60">Profile — migrate Profile.jsx here</p>
            </div>
        </ProtectedRoute>
    );
}
