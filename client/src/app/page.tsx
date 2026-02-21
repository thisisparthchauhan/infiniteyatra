// Homepage — Static Generation (SSG)
// Fetches featured tours server-side so Google can index them
import type { Metadata } from 'next';
import JsonLd, { travelAgencyJsonLd } from '@/components/common/JsonLd';
import { getAllTours } from '@/lib/firebase/server';
import HomeClient from '@/components/home/HomeClient';

export const metadata: Metadata = {
    title: 'Best Tour Packages India — Family, Honeymoon & Adventure | Infinite Yatra',
    description:
        'Book the best tour packages in India. Curated family tours, honeymoon packages, and adventure trips to Goa, Kashmir, Manali, Kerala and 50+ destinations. MSME Registered. Best prices guaranteed.',
    keywords: ['tour packages India', 'Goa tour packages', 'Kashmir tour', 'Manali trip', 'honeymoon packages India', 'family tours India'],
    openGraph: {
        title: 'Infinite Yatra — Best Tour Packages India',
        description: 'Curated family tours, honeymoon packages, and adventure trips across 50+ Indian destinations.',
        images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
        type: 'website',
    },
};

// Revalidate every hour so new tours appear without full rebuild
export const revalidate = 3600;

export default async function HomePage() {
    const tours = await getAllTours();
    const featuredTours = tours.slice(0, 8); // Show top 8 for SSR

    return (
        <>
            {/* JSON-LD: Travel Agency structured data for Google */}
            <JsonLd data={travelAgencyJsonLd} />
            {/* Pass server-fetched data to existing client component */}
            <HomeClient featuredTours={featuredTours} />
        </>
    );
}
