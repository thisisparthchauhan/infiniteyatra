// JSON-LD Structured Data component — pure server component, no 'use client'

type JsonLdProps = {
    data: Record<string, unknown>;
};

export default function JsonLd({ data }: JsonLdProps) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
    );
}

// ─── Structured data builders ─────────────────────────────────────────────────

export const travelAgencyJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    name: 'Infinite Yatra',
    url: 'https://infiniteyatra.com',
    logo: 'https://infiniteyatra.com/logo.png',
    description:
        'Premium Indian tour packages for families, honeymoon couples, and adventure seekers. Destinations include Goa, Kashmir, Manali, Kerala and 50+ locations across India.',
    telephone: '+919265799325',
    email: 'infiniteyatra@gmail.com',
    address: {
        '@type': 'PostalAddress',
        addressCountry: 'IN',
    },
    sameAs: [
        'https://instagram.com/infinite.yatra',
        'https://x.com/infiniteyatra',
        'https://www.whatsapp.com/channel/0029VbBX7rv3gvWStqSdXf08',
    ],
    currenciesAccepted: 'INR',
    openingHours: 'Mo-Su 09:00-21:00',
};

export function tourPackageJsonLd(tour: Record<string, unknown>) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: tour.name,
        description: tour.shortDescription || tour.description,
        image: tour.heroImage || tour.image,
        brand: {
            '@type': 'Brand',
            name: 'Infinite Yatra',
        },
        offers: {
            '@type': 'Offer',
            price: tour.price,
            priceCurrency: 'INR',
            availability: 'https://schema.org/InStock',
            url: `https://infiniteyatra.com/tours/${tour.id}`,
            seller: {
                '@type': 'Organization',
                name: 'Infinite Yatra',
            },
        },
        aggregateRating: tour.rating
            ? {
                '@type': 'AggregateRating',
                ratingValue: tour.rating,
                reviewCount: tour.reviewCount || 1,
            }
            : undefined,
    };
}

export function blogArticleJsonLd(post: Record<string, unknown>) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        image: post.coverImage || post.image,
        datePublished: post.createdAt || post.publishedAt,
        dateModified: post.updatedAt || post.createdAt,
        author: {
            '@type': 'Organization',
            name: 'Infinite Yatra',
            url: 'https://infiniteyatra.com',
        },
        publisher: {
            '@type': 'Organization',
            name: 'Infinite Yatra',
            logo: {
                '@type': 'ImageObject',
                url: 'https://infiniteyatra.com/logo.png',
            },
        },
        description: post.excerpt || post.description,
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `https://infiniteyatra.com/blog/${post.id || post.slug}`,
        },
    };
}

export function destinationJsonLd(dest: Record<string, unknown>) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Place',
        name: dest.name,
        description: dest.description,
        image: dest.image,
        address: {
            '@type': 'PostalAddress',
            addressCountry: 'IN',
            addressRegion: dest.state as string,
        },
        url: `https://infiniteyatra.com/destinations/${dest.id || dest.slug}`,
    };
}
