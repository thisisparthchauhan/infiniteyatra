import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import Providers from '@/components/layout/Providers';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const outfit = Outfit({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700'],
    variable: '--font-outfit',
    display: 'swap',
});

export const metadata: Metadata = {
    metadataBase: new URL('https://infiniteyatra.com'),
    title: {
        default: 'Infinite Yatra — Best Tour Packages India',
        template: '%s | Infinite Yatra',
    },
    description:
        'Discover the best tour packages in India. Book curated family tours, honeymoon packages, and adventure trips to Goa, Kashmir, Manali, Kerala and 50+ destinations. Best prices guaranteed.',
    keywords: [
        'tour packages India',
        'Goa tour packages',
        'Kashmir tour',
        'Manali trip',
        'honeymoon packages India',
        'family tours India',
        'adventure tours India',
        'Indian travel company',
        'Infinite Yatra',
    ],
    authors: [{ name: 'Infinite Yatra', url: 'https://infiniteyatra.com' }],
    creator: 'Infinite Yatra',
    openGraph: {
        type: 'website',
        locale: 'en_IN',
        url: 'https://infiniteyatra.com',
        siteName: 'Infinite Yatra',
        title: 'Infinite Yatra — Best Tour Packages India',
        description:
            'Discover the best tour packages in India. Family tours, honeymoon packages, adventure trips across 50+ destinations.',
        images: [
            {
                url: '/og-image.jpg',
                width: 1200,
                height: 630,
                alt: 'Infinite Yatra — Explore Infinite',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Infinite Yatra — Best Tour Packages India',
        description: 'Discover the best tour packages in India.',
        images: ['/og-image.jpg'],
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={outfit.variable}>
            <head>
                {/* Preconnect for Google Fonts */}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            </head>
            <body>
                <Providers>
                    <Navbar />
                    <main>{children}</main>
                    <Footer />
                </Providers>
            </body>
        </html>
    );
}
