// About page — SSG
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'About Infinite Yatra — India\'s Premium Travel Company',
    description: 'Learn about Infinite Yatra — an MSME-registered Indian travel company offering curated tours, honeymoon packages, and adventure experiences across India.',
};

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#050505] text-white pt-24">
            {/* TODO: Migrate About.jsx here */}
            <p className="p-8 text-white/60">About — migrate About.jsx here</p>
        </div>
    );
}
