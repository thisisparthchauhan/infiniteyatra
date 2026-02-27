import type { MetadataRoute } from 'next';
import {
    getAllTourIds,
    getAllBlogSlugs,
    getAllDestinationSlugs,
    getAllHotelIds,
} from '@/lib/firebase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const [tourIds, blogSlugs, destSlugs, hotelIds] = await Promise.all([
        getAllTourIds(),
        getAllBlogSlugs(),
        getAllDestinationSlugs(),
        getAllHotelIds(),
    ]);

    const staticPages: MetadataRoute.Sitemap = [
        { url: 'https://infiniteyatra.com', lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
        { url: 'https://infiniteyatra.com/destinations', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
        { url: 'https://infiniteyatra.com/tours', lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
        { url: 'https://infiniteyatra.com/hotels', lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
        { url: 'https://infiniteyatra.com/blog', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
        { url: 'https://infiniteyatra.com/stories', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
        { url: 'https://infiniteyatra.com/contact', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
        { url: 'https://infiniteyatra.com/about', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
        { url: 'https://infiniteyatra.com/careers', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
        { url: 'https://infiniteyatra.com/terms', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    ];

    const tourPages: MetadataRoute.Sitemap = tourIds.map((id) => ({
        url: `https://infiniteyatra.com/tours/${id}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
    }));

    const blogPages: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
        url: `https://infiniteyatra.com/blog/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
    }));

    const destPages: MetadataRoute.Sitemap = destSlugs.map((slug) => ({
        url: `https://infiniteyatra.com/destinations/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
    }));

    const hotelPages: MetadataRoute.Sitemap = hotelIds.map((id) => ({
        url: `https://infiniteyatra.com/hotels/${id}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
    }));

    return [...staticPages, ...tourPages, ...blogPages, ...destPages, ...hotelPages];
}
