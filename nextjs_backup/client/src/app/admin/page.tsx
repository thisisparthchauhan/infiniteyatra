// Admin dashboard — client-only, no SSR
// Copy your existing AdminDashboard.jsx logic here and add 'use client' at the top
'use client';
import ProtectedRoute from '@/components/common/ProtectedRoute';

export default function AdminPage() {
    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[#050505] text-white">
                {/* 
                    TODO: Copy AdminDashboard.jsx content here.
                    Replace:
                      - react-router Link → next/link Link (href= instead of to=)
                      - useNavigate → useRouter
                      - import from '../firebase' → import from '@/lib/firebase/client'
                      - import from '../context/...' → import from '@/context/...'
                */}
                <p className="p-8 text-white/60">Admin Dashboard — migrate AdminDashboard.jsx here</p>
            </div>
        </ProtectedRoute>
    );
}
