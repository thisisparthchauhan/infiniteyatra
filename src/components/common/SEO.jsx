import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, keywords, image, url }) => {
    const siteTitle = 'Infinite Yatra';
    const defaultDescription = "Explore the world's most breathtaking destinations with Infinite Yatra. Curated travel experiences for the modern explorer.";
    const defaultKeywords = 'travel, tours, vacations, infinite yatra, adventure, destinations';
    const defaultImage = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop';
    const siteUrl = 'https://infiniteyatra.vercel.app';

    const fullTitle = title ? `${title} | ${siteTitle}` : `${siteTitle} | Discover Your Next Adventure`;
    const metaDescription = description || defaultDescription;
    const metaKeywords = keywords || defaultKeywords;
    const metaImage = image || defaultImage;
    const metaUrl = url ? `${siteUrl}${url}` : siteUrl;

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "TravelAgency",
        "name": "Infinite Yatra",
        "url": siteUrl,
        "logo": `${siteUrl}/vite.svg`,
        "description": defaultDescription,
        "sameAs": [
            "https://facebook.com/infiniteyatra",
            "https://instagram.com/infiniteyatra",
            "https://twitter.com/infiniteyatra"
        ]
    };

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={metaDescription} />
            <meta name="keywords" content={metaKeywords} />
            <link rel="canonical" href={metaUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content="website" />
            <meta property="og:url" content={metaUrl} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={metaDescription} />
            <meta property="og:image" content={metaImage} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={metaUrl} />
            <meta property="twitter:title" content={fullTitle} />
            <meta property="twitter:description" content={metaDescription} />
            <meta property="twitter:image" content={metaImage} />

            {/* Structured Data */}
            <script type="application/ld+json">
                {JSON.stringify(structuredData)}
            </script>
        </Helmet>
    );
};

export default SEO;
