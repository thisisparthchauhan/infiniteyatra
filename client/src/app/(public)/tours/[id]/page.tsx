// Tour detail page — SSG + ISR
// Each tour package page is pre-rendered at build time and revalidated every hour
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTourById, getAllTourIds } from '@/lib/firebase/server';
import JsonLd, { tourPackageJsonLd } from '@/components/common/JsonLd';
import TourDetailClient from '@/components/tours/TourDetailClient';

export const revalidate = 3600; // ISR: revalidate every 1 hour

interface Props {
    params: { id: string };
}

// Pre-generate all tour pages at build time
export async function generateStaticParams() {
    const ids = await getAllTourIds();
    return ids.map((id) => ({ id }));
}

// Dynamic SEO per tour
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const tour = await getTourById(params.id);
    if (!tour) return { title: 'Tour Not Found | Infinite Yatra' };

    const title = `${tour.name} — ${tour.duration || ''} Days Tour Package | Infinite Yatra`;
    const description =
        (tour.shortDescription as string) ||
        `Book ${tour.name} tour package starting from ₹${tour.price}. ${tour.duration} days trip with Infinite Yatra. Best prices guaranteed.`;

    return {
        title,
        description,
        keywords: [
            tour.name as string,
            `${tour.destination} tour`,
            `${tour.destination} tour package`,
            'tour packages India',
            'Infinite Yatra',
        ],
        openGraph: {
            title,
            description,
            images: tour.heroImage
                ? [{ url: tour.heroImage as string, width: 1200, height: 630, alt: tour.name as string }]
                : [{ url: '/og-image.jpg', width: 1200, height: 630 }],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: tour.heroImage ? [tour.heroImage as string] : ['/og-image.jpg'],
        },
    };
}

export default async function TourDetailPage({ params }: Props) {
    const tour = await getTourById(params.id);
    if (!tour) notFound();

    return (
        <>
            {/* Tour product JSON-LD for Google Rich Results */}
            <JsonLd data={tourPackageJsonLd(tour)} />
            <TourDetailClient tour={tour} />
        </>
    );
}
