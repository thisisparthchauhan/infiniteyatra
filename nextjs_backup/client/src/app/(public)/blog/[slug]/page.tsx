// Blog post page — SSG + 24h ISR for travel content
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBlogPost, getAllBlogSlugs } from '@/lib/firebase/server';
import JsonLd, { blogArticleJsonLd } from '@/components/common/JsonLd';
import BlogPostClient from '@/components/blog/BlogPostClient';

export const revalidate = 86400; // 24 hours ISR

interface Props {
    params: { slug: string };
}

export async function generateStaticParams() {
    const slugs = await getAllBlogSlugs();
    return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const post = await getBlogPost(params.slug);
    if (!post) return { title: 'Article Not Found | Infinite Yatra' };

    return {
        title: `${post.title} | Infinite Yatra Blog`,
        description: (post.excerpt || post.description) as string,
        openGraph: {
            type: 'article',
            title: post.title as string,
            description: (post.excerpt || post.description) as string,
            images: post.coverImage
                ? [{ url: post.coverImage as string, width: 1200, height: 630 }]
                : [{ url: '/og-image.jpg' }],
            publishedTime: post.createdAt as string,
            modifiedTime: (post.updatedAt || post.createdAt) as string,
            authors: ['Infinite Yatra'],
        },
        twitter: {
            card: 'summary_large_image',
            title: post.title as string,
            description: (post.excerpt || post.description) as string,
        },
    };
}

export default async function BlogPostPage({ params }: Props) {
    const post = await getBlogPost(params.slug);
    if (!post) notFound();

    return (
        <>
            <JsonLd data={blogArticleJsonLd(post)} />
            <BlogPostClient post={post} />
        </>
    );
}
