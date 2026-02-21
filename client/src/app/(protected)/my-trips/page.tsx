'use client';
import ProtectedRoute from '@/components/common/ProtectedRoute';

export default function MyTripsPage() {
    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[#050505] text-white pt-24">
                {/* TODO: Migrate MyTrips.jsx here */}
                <p className="p-8 text-white/60">My Trips — migrate MyTrips.jsx here</p>
            </div>
        </ProtectedRoute>
    );
}
