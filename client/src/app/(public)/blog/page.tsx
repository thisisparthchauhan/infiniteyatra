// Blog listing page — SSG with ISR
import type { Metadata } from 'next';
import { getAllBlogPosts } from '@/lib/firebase/server';
import BlogListClient from '@/components/blog/BlogListClient';

export const revalidate = 86400; // 24 hours

export const metadata: Metadata = {
    title: 'Travel Blog — India Travel Guides & Tips | Infinite Yatra',
    description:
        'Explore our travel guides, destination tips, and itineraries for India. From Goa beaches to Himalayan treks — find your perfect trip inspiration.',
    openGraph: {
        title: 'Travel Blog | Infinite Yatra',
        description: 'India travel guides, tips and itineraries for every type of traveler.',
        images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
    },
};

export default async function BlogPage() {
    const posts = await getAllBlogPosts();
    return <BlogListClient initialPosts={posts} />;
}
