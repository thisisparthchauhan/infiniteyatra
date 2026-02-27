// Destinations listing page — SSG
import type { Metadata } from 'next';
import { getAllDestinations } from '@/lib/firebase/server';
import DestinationsListClient from '@/components/destinations/DestinationsListClient';

export const revalidate = 86400;

export const metadata: Metadata = {
    title: 'Travel Destinations in India — Explore All Places | Infinite Yatra',
    description:
        'Explore all travel destinations in India. From Himalayan peaks to tropical beaches — find your next adventure with Infinite Yatra.',
    openGraph: {
        title: 'Travel Destinations India | Infinite Yatra',
        description: 'Explore all travel destinations in India with Infinite Yatra.',
        images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
    },
};

export default async function DestinationsPage() {
    const destinations = await getAllDestinations();
    return <DestinationsListClient initialDestinations={destinations} />;
}
