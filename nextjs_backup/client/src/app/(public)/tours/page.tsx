// Tours listing page — SSG with ISR
import type { Metadata } from 'next';
import { getAllTours } from '@/lib/firebase/server';
import ToursListClient from '@/components/tours/ToursListClient';

export const revalidate = 3600;

export const metadata: Metadata = {
    title: 'Tour Packages India — All Destinations | Infinite Yatra',
    description:
        'Browse all tour packages in India. Family tours, honeymoon packages, adventure trips. Destinations include Goa, Kashmir, Manali, Kerala, Rajasthan and more. Book now at best prices.',
    openGraph: {
        title: 'Tour Packages India | Infinite Yatra',
        description: 'Browse all Indian tour packages — family, honeymoon, adventure.',
        images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
    },
};

export default async function ToursPage() {
    const tours = await getAllTours();
    return <ToursListClient initialTours={tours} />;
}
