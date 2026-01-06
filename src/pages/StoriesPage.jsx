import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Plus, Filter, TrendingUp, Clock, Heart } from 'lucide-react';
import { collection, query, orderBy, getDocs, doc, updateDoc, increment, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import StoryCard from '../components/StoryCard';
import CreateStoryModal from '../components/CreateStoryModal';
import SEO from '../components/SEO';

const StoriesPage = () => {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [filter, setFilter] = useState('recent'); // recent, popular, trending
    const { currentUser } = useAuth();

    useEffect(() => {
        fetchStories();
    }, [filter]);

    const fetchStories = async () => {
        setLoading(true);
        try {
            const storiesRef = collection(db, 'travelStories');
            let q;

            switch (filter) {
                case 'popular':
                    q = query(storiesRef, orderBy('likes', 'desc'));
                    break;
                case 'trending':
                    q = query(storiesRef, orderBy('views', 'desc'));
                    break;
                default:
                    q = query(storiesRef, orderBy('createdAt', 'desc'));
            }

            const querySnapshot = await getDocs(q);
            const storiesData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setStories(storiesData);
        } catch (error) {
            console.error('Error fetching stories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async (storyId) => {
        if (!currentUser) return;

        try {
            const storyRef = doc(db, 'travelStories', storyId);
            await updateDoc(storyRef, {
                likes: increment(1)
            });

            setStories(stories.map(story =>
                story.id === storyId
                    ? { ...story, likes: (story.likes || 0) + 1 }
                    : story
            ));
        } catch (error) {
            console.error('Error liking story:', error);
        }
    };

    const filterOptions = [
        { id: 'recent', label: 'Recent', icon: Clock },
        { id: 'popular', label: 'Most Liked', icon: Heart },
        { id: 'trending', label: 'Trending', icon: TrendingUp }
    ];

    return (
        <>
            <SEO
                title="Travel Stories - Infinite Yatra"
                description="Read inspiring travel stories from our community. Share your own adventures and connect with fellow travelers."
                keywords="travel stories, travel blog, adventure stories, travel experiences"
            />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
                {/* Hero Section */}
                <section className="relative pt-32 pb-20 overflow-hidden">
                    {/* Background Decorations */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl"></div>
                    </div>

                    <div className="container mx-auto px-6 relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7 }}
                            className="text-center max-w-4xl mx-auto"
                        >
                            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full text-sm font-semibold mb-6 shadow-lg">
                                <MapPin size={18} />
                                <span>Community Travel Stories</span>
                            </div>

                            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 leading-tight">
                                Stories That
                                <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                    Inspire Wanderlust
                                </span>
                            </h1>

                            <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto">
                                Discover real experiences from real travelers. Get inspired, learn tips, and share your own adventures with our growing community.
                            </p>

                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-5 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 text-lg"
                            >
                                <Plus size={24} />
                                Share Your Story
                            </button>
                        </motion.div>
                    </div>
                </section>

                {/* Filter Section */}
                <section className="py-8 border-y border-slate-200 bg-white/50 backdrop-blur-sm sticky top-0 z-20">
                    <div className="container mx-auto px-6">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-3">
                                <Filter size={20} className="text-slate-600" />
                                <span className="font-semibold text-slate-900">Filter by:</span>
                            </div>

                            <div className="flex gap-3">
                                {filterOptions.map(option => {
                                    const Icon = option.icon;
                                    return (
                                        <button
                                            key={option.id}
                                            onClick={() => setFilter(option.id)}
                                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${filter === option.id
                                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                                }`}
                                        >
                                            <Icon size={18} />
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stories Grid */}
                <section className="py-16">
                    <div className="container mx-auto px-6">
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                                    <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-lg animate-pulse">
                                        <div className="aspect-[4/3] bg-slate-200"></div>
                                        <div className="p-6 space-y-4">
                                            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                                            <div className="h-20 bg-slate-200 rounded"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : stories.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-20"
                            >
                                <div className="bg-white rounded-3xl shadow-xl p-12 max-w-md mx-auto">
                                    <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <MapPin size={40} className="text-blue-600" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-4">No Stories Yet</h3>
                                    <p className="text-slate-600 mb-8">Be the first to share your travel adventure!</p>
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                                    >
                                        Share Your Story
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                            >
                                {stories.map((story, index) => (
                                    <motion.div
                                        key={story.id}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <StoryCard story={story} onLike={handleLike} />
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </div>
                </section>
            </div>

            {/* Create Story Modal */}
            {showCreateModal && (
                <CreateStoryModal
                    onClose={() => setShowCreateModal(false)}
                    onStoryCreated={fetchStories}
                />
            )}
        </>
    );
};

export default StoriesPage;
