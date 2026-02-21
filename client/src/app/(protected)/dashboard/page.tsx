'use client';
import ProtectedRoute from '@/components/common/ProtectedRoute';

export default function DashboardPage() {
    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[#050505] text-white pt-24">
                {/* TODO: Migrate UserDashboard.jsx here */}
                <p className="p-8 text-white/60">User Dashboard — migrate UserDashboard.jsx here</p>
            </div>
        </ProtectedRoute>
    );
}
