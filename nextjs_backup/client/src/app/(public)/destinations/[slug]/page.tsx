// Destination detail page — SSG
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDestinationBySlug, getAllDestinationSlugs } from '@/lib/firebase/server';
import JsonLd, { destinationJsonLd } from '@/components/common/JsonLd';
import DestinationDetailClient from '@/components/destinations/DestinationDetailClient';

export const revalidate = 86400;

interface Props {
    params: { slug: string };
}

export async function generateStaticParams() {
    const slugs = await getAllDestinationSlugs();
    return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const dest = await getDestinationBySlug(params.slug);
    if (!dest) return { title: 'Destination Not Found | Infinite Yatra' };

    return {
        title: `${dest.name} Tour Packages — Best Trips to ${dest.name} | Infinite Yatra`,
        description:
            (dest.description as string) ||
            `Explore ${dest.name} with Infinite Yatra. Book the best tour packages, hotels and experiences in ${dest.name}, India.`,
        keywords: [`${dest.name} tour`, `${dest.name} tour packages`, `trip to ${dest.name}`, 'India tours'],
        openGraph: {
            title: `${dest.name} Tour Packages | Infinite Yatra`,
            description: (dest.description as string) || `Best tours to ${dest.name}`,
            images: dest.image ? [{ url: dest.image as string, width: 1200, height: 630 }] : [{ url: '/og-image.jpg' }],
        },
    };
}

export default async function DestinationPage({ params }: Props) {
    const dest = await getDestinationBySlug(params.slug);
    if (!dest) notFound();

    return (
        <>
            <JsonLd data={destinationJsonLd(dest)} />
            <DestinationDetailClient destination={dest} />
        </>
    );
}
