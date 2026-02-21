'use client';
import ProtectedRoute from '@/components/common/ProtectedRoute';

export default function MyBookingsPage() {
    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[#050505] text-white pt-24">
                {/* TODO: Migrate MyBookings.jsx here */}
                <p className="p-8 text-white/60">My Bookings — migrate MyBookings.jsx here</p>
            </div>
        </ProtectedRoute>
    );
}
