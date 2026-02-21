'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Plus, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, orderBy, limit, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/context/AuthContext';
import StoryCard from '@/components/stories/StoryCard';

interface Story {
    id: string;
    title?: string;
    description?: string;
    imageUrl?: string;
    location?: string;
    authorName?: string;
    likes?: number;
    tags?: string[];
    status?: string;
    isFeatured?: boolean;
    createdAt?: { toDate?: () => Date } | string;
    [key: string]: unknown;
}

interface TravelStoriesProps {
    featuredOnly?: boolean;
    limitCount?: number;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};
const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

export default function TravelStories({ featuredOnly = false, limitCount = 6 }: TravelStoriesProps) {
    const router = useRouter();
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();

    useEffect(() => {
        fetchStories();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [featuredOnly, limitCount]);

    const fetchStories = async () => {
        try {
            const storiesRef = collection(db, 'travelStories');
            let snapshot;
            try {
                const q = query(storiesRef, orderBy('createdAt', 'desc'), limit(50));
                snapshot = await getDocs(q);
            } catch {
                const q2 = query(storiesRef, limit(50));
                snapshot = await getDocs(q2);
            }
            let all = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Story));
            all = all.filter(s => s.status === 'approved');
            if (featuredOnly) all = all.filter(s => s.isFeatured);
            all.sort((a, b) => {
                if (a.isFeatured && !b.isFeatured) return -1;
                if (!a.isFeatured && b.isFeatured) return 1;
                const getTime = (s: Story) => {
                    const ca = s.createdAt;
                    if (ca && typeof ca === 'object' && 'toDate' in ca && typeof (ca as { toDate?: () => Date }).toDate === 'function') {
                        return (ca as { toDate: () => Date }).toDate().getTime();
                    }
                    return 0;
                };
                return getTime(b) - getTime(a);
            });
            setStories(all.slice(0, limitCount));
        } catch (err) {
            console.error('Error fetching stories:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async (storyId: string) => {
        if (!currentUser) return;
        try {
            await updateDoc(doc(db, 'travelStories', storyId), { likes: increment(1) });
            setStories(prev => prev.map(s => s.id === storyId ? { ...s, likes: (s.likes || 0) + 1 } : s));
        } catch (err) {
            console.error('Error liking story:', err);
        }
    };

    const handleShareStoryClick = () => {
        if (!currentUser) {
            if (window.confirm('Please login to share your travel story! Click OK to go to login page.')) {
                router.push('/login');
            }
            return;
        }
        // TODO: open create story modal — wire up CreateStoryModal when migrated
        alert('Create story modal — migrate CreateStoryModal.jsx to complete this');
    };

    return (
        <section id="stories-preview" className="py-24 relative overflow-hidden">
            <div className="container mx-auto px-6 relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-16 gap-6">
                    <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 glass-card border border-blue-500/20 text-blue-300 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                            <MapPin size={16} /><span>Community Stories</span>
                        </div>
                        <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                            Latest Travel
                            <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Adventures</span>
                        </h2>
                        <p className="text-white/70 text-lg md:text-xl leading-relaxed font-light">
                            Real stories from real travelers. Share your journey, inspire others, and discover amazing experiences from our community.
                        </p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="flex flex-col sm:flex-row gap-4">
                        <button onClick={handleShareStoryClick} className="group flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                            <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" /> Share Your Story
                        </button>
                        <Link href="/stories" className="hidden md:flex items-center gap-2 text-white/80 font-semibold hover:text-white transition-colors px-6 py-4 rounded-full hover:bg-white/10 border border-white/10">
                            View All Stories <ArrowRight size={20} />
                        </Link>
                    </motion.div>
                </div>

                {/* Stories Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="glass-card rounded-3xl overflow-hidden shadow-lg animate-pulse">
                                <div className="aspect-[4/3] bg-white/5" />
                                <div className="p-6 space-y-4">
                                    <div className="h-4 bg-white/10 rounded w-3/4" />
                                    <div className="h-4 bg-white/10 rounded w-1/2" />
                                    <div className="h-20 bg-white/10 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : stories.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="bg-white/5 rounded-3xl border border-white/10 p-12 max-w-md mx-auto">
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <MapPin size={40} className="text-blue-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4">No Stories Yet</h3>
                            <p className="text-white/60 mb-8">Be the first to share your travel adventure!</p>
                            <button onClick={handleShareStoryClick} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105">
                                Share Your Story
                            </button>
                        </div>
                    </div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        className={`grid grid-cols-1 md:grid-cols-2 ${limitCount === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6`}
                    >
                        {stories.map(story => (
                            <motion.div key={story.id} variants={itemVariants} className="h-full">
                                <StoryCard story={story} onLike={handleLike} />
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {stories.length > 0 && (
                    <div className="mt-12 md:hidden text-center">
                        <Link href="/stories" className="inline-flex items-center gap-2 text-blue-400 font-semibold px-8 py-4 rounded-2xl bg-white/5 border border-white/10">
                            View All Stories <ArrowRight size={20} />
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
}
