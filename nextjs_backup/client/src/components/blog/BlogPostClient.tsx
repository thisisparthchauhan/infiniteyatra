'use client';
interface BlogPostClientProps { post: Record<string, unknown>; }
export default function BlogPostClient({ post }: BlogPostClientProps) {
    return <div className="min-h-screen pt-24"><p className="p-8 text-white/40 text-sm">BlogPostClient — migrate BlogPost.jsx here. Post: {post.title as string}</p></div>;
}
