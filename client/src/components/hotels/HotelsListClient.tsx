'use client';
interface HotelsListClientProps { initialHotels: Record<string, unknown>[]; }
export default function HotelsListClient({ initialHotels }: HotelsListClientProps) {
    return <div className="min-h-screen pt-24"><p className="p-8 text-white/40 text-sm">HotelsListClient — migrate Hotels.jsx here. {initialHotels.length} hotels loaded.</p></div>;
}
