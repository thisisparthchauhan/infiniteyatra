'use client';
interface BlogListClientProps { initialPosts: Record<string, unknown>[]; }
export default function BlogListClient({ initialPosts }: BlogListClientProps) {
    return <div className="min-h-screen pt-24"><p className="p-8 text-white/40 text-sm">BlogListClient — migrate BlogPage.jsx here. {initialPosts.length} posts loaded.</p></div>;
}
