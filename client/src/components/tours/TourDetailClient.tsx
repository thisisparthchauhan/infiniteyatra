'use client';
// TODO: Migrate PackageDetail.jsx here
// Replace: to= → href=, useNavigate → useRouter, import from '../firebase' → '@/lib/firebase/client'
interface TourDetailClientProps {
    tour: Record<string, unknown>;
}
export default function TourDetailClient({ tour }: TourDetailClientProps) {
    return (
        <div className="min-h-screen pt-24">
            <p className="p-8 text-white/40 text-sm">TourDetailClient — migrate PackageDetail.jsx here. Tour: {tour.name as string}</p>
        </div>
    );
}
