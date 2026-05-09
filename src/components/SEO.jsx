import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, keywords, image, url }) => {
    const siteTitle = 'Infinite Yatra';
    const defaultDescription = "Plan Kedarnath Yatra, Char Dham Yatra, Himalayan treks and spiritual travel packages with Infinite Yatra. Curated itinerary support, travel assistance and easy enquiry options.";
    const defaultKeywords = 'Kedarnath Yatra, Char Dham Yatra, Do Dham, Himalayan treks, spiritual travel, Uttarakhand packages, Infinite Yatra, group tours, trekking packages India';
    const defaultImage = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop';
    const siteUrl = 'https://www.infiniteyatra.com';

    const fullTitle = title ? `${title} | ${siteTitle}` : `${siteTitle} – Kedarnath, Char Dham, Treks & Spiritual Travel Packages`;
    const metaDescription = description || defaultDescription;
    const metaKeywords = keywords || defaultKeywords;
    const metaImage = image || defaultImage;
    const metaUrl = url ? `${siteUrl}${url}` : `${siteUrl}/`;

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "TravelAgency",
        "name": "Infinite Yatra",
        "url": siteUrl,
        "logo": `${siteUrl}/favicon.png`,
        "description": defaultDescription,
        "telephone": "+91-9265799325",
        "email": "info@infiniteyatra.com",
        "address": {
            "@type": "PostalAddress",
            "addressCountry": "IN"
        },
        "sameAs": [
            "https://instagram.com/infinite.yatra",
            "https://x.com/infiniteyatra",
            "https://www.youtube.com/channel/UCdWYIKLuKMh_hZIJleWajdg",
            "https://whatsapp.com/channel/0029VbBX7rv3gvWStqSdXf08"
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
