import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/admin',
                    '/admin/',
                    '/dashboard',
                    '/profile',
                    '/booking/',
                    '/my-bookings',
                    '/my-trips',
                    '/wishlist',
                    '/migrate-packages-fix',
                ],
            },
        ],
        sitemap: 'https://infiniteyatra.com/sitemap.xml',
        host: 'https://infiniteyatra.com',
    };
}
