'use client';
interface DestinationDetailClientProps { destination: Record<string, unknown>; }
export default function DestinationDetailClient({ destination }: DestinationDetailClientProps) {
    return <div className="min-h-screen pt-24"><p className="p-8 text-white/40 text-sm">DestinationDetailClient — migrate destination page here. Destination: {destination.name as string}</p></div>;
}
