// Terms page — SSG
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms & Conditions | Infinite Yatra',
    description: 'Read the terms and conditions for using Infinite Yatra tour booking services.',
};

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#050505] text-white pt-24">
            {/* TODO: Migrate TermsConditions.jsx here */}
            <p className="p-8 text-white/60">Terms — migrate TermsConditions.jsx here</p>
        </div>
    );
}
