'use client';
interface ToursListClientProps { initialTours: Record<string, unknown>[]; }
export default function ToursListClient({ initialTours }: ToursListClientProps) {
    return <div className="min-h-screen pt-24"><p className="p-8 text-white/40 text-sm">ToursListClient — migrate DestinationsPage.jsx + SearchFilter here. {initialTours.length} tours loaded.</p></div>;
}
