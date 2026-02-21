'use client';
interface DestinationsListClientProps { initialDestinations: Record<string, unknown>[]; }
export default function DestinationsListClient({ initialDestinations }: DestinationsListClientProps) {
    return <div className="min-h-screen pt-24"><p className="p-8 text-white/40 text-sm">DestinationsListClient — migrate DestinationsPage.jsx here. {initialDestinations.length} destinations loaded.</p></div>;
}
