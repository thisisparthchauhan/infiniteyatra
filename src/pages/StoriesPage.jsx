import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Plus, Filter, TrendingUp, Clock, Heart, Sparkles, User } from 'lucide-react';
import { collection, query, orderBy, getDocs, doc, updateDoc, increment, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import StoryCard from '../components/StoryCard';
import CreateStoryModal from '../components/CreateStoryModal';
import SEO from '../components/SEO';
import { seededStories } from '../data/seededStories';

const StoriesPage = () => {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editStory, setEditStory] = useState(null); // Story being edited
    const [filter, setFilter] = useState('recent'); // recent, popular, trending, my_stories
    const [category, setCategory] = useState('All');
    const { currentUser } = useAuth();

    // Refresh on user change too (for My Stories)
    useEffect(() => {
        fetchStories();
    }, [filter, currentUser, category]); // Added category to dependencies

    const fetchStories = async () => {
        setLoading(true);
        try {
            const storiesRef = collection(db, 'travelStories');
            let q;
            let fetchedStories = [];

            // FETCH ALL STORIES (Client-side filtering to avoid Index issues)
            // Note: In production with thousands of stories, you would enable indexing.
            // For now, to guarantee visibility, we fetch all and filter in JS.
            console.log("Starting fetch...");
            const allStoriesSnapshot = await getDocs(collection(db, 'travelStories'));

            console.log("Total docs fetched:", allStoriesSnapshot.size);

            let rawStories = allStoriesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Filter Logic
            if (filter === 'my_stories') {
                if (!currentUser) {
                    setStories([]);
                    setLoading(false);
                    return;
                }
                fetchedStories = rawStories.filter(s => s.authorId === currentUser.uid);
            } else {
                // Check for 'Approved' (case insensitive just in case)
                fetchedStories = rawStories.filter(s =>
                    s.status && s.status.toLowerCase() === 'approved'
                );
            }
            console.log(`Filtered stories for ${filter}:`, fetchedStories.length);

            // Client-side Sorting
            fetchedStories.sort((a, b) => {
                // Safe date handling
                const getMillis = (d) => {
                    if (!d) return 0;
                    if (d.toMillis) return d.toMillis();
                    if (d instanceof Date) return d.getTime();
                    return 0;
                };
                const dateA = getMillis(a.createdAt);
                const dateB = getMillis(b.createdAt);

                if (filter === 'popular') {
                    return (b.likes || 0) - (a.likes || 0);
                } else if (filter === 'trending') {
                    return (b.views || 0) - (a.views || 0);
                } else {
                    return dateB - dateA;
                }
            });

            if (category !== 'All') {
                const filtered = fetchedStories.filter(story =>
                    story.tags?.includes(category) ||
                    story.location?.includes(category)
                );
                setStories(filtered);
            } else {
                setStories(fetchedStories);
            }
        } catch (error) {
            console.error('Error fetching stories:', error);
            // Fallback: Show empty list instead of loading forever
            setStories([]);
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

    const handleEditStory = (story) => {
        setEditStory(story);
        setShowCreateModal(true);
    };

    const filterOptions = [
        { id: 'recent', label: 'Newest Experiences', icon: Clock },
        { id: 'popular', label: 'Most Felt', icon: Heart },
        { id: 'trending', label: 'People Are Reading', icon: TrendingUp },
        ...(currentUser ? [{ id: 'my_stories', label: 'My Experiences', icon: User }] : [])
    ];

    const categories = ['All', 'Treks', 'Spiritual', 'Solo Travel', 'First-Time Trekkers', 'Safety Tips'];

    return (
        <>
            <SEO
                title="Travel Stories - Infinite Yatra"
                description="Read inspiring travel stories from our community. Share your own adventures and connect with fellow travelers."
                keywords="travel stories, travel blog, adventure stories, travel experiences"
            />

            <div className="min-h-screen bg-black relative overflow-hidden">
                {/* Hero Section */}
                <section className="relative pt-32 pb-20 overflow-hidden">
                    {/* Background Glows */}
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] pointer-events-none"></div>
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] pointer-events-none"></div>


                    <div className="container mx-auto px-6 relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7 }}
                            className="text-center max-w-4xl mx-auto flex flex-col items-center"
                        >
                            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 backdrop-blur-md text-white px-6 py-3 rounded-full text-sm font-semibold mb-6 shadow-lg">
                                <MapPin size={18} className="text-blue-400" />
                                <span>Community Travel Stories</span>
                            </div>

                            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                                Real journeys. Real emotions. <br className="hidden md:block" />
                                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                    Real people.
                                </span>
                            </h1>

                            <p className="text-lg md:text-xl text-slate-400 mb-8 leading-relaxed max-w-2xl mx-auto">
                                Moments that no itinerary can capture.
                            </p>

                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="w-full md:w-auto inline-flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 md:px-10 py-4 md:py-5 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 text-lg"
                            >
                                <Plus size={24} />
                                Share Your Story
                            </button>
                        </motion.div>
                    </div>
                </section>

                {/* Categories Section */}
                <section className="py-4 border-b border-white/10 overflow-x-auto relative z-10 bg-black/50 backdrop-blur-sm">
                    <div className="container mx-auto px-6">
                        <div className="flex items-center gap-3 pb-2 md:pb-0 min-w-max">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setCategory(cat)}
                                    className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap ${category === cat
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Filter Section */}
                <section className="py-8 border-y border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-20">
                    <div className="container mx-auto px-6">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-3">
                                <Filter size={20} className="text-slate-400" />
                                <span className="font-semibold text-white">Filter by:</span>
                            </div>

                            <div className="flex gap-3">
                                {filterOptions.map(option => {
                                    const Icon = option.icon;
                                    return (
                                        <button
                                            key={option.id}
                                            onClick={() => setFilter(option.id)}
                                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${filter === option.id
                                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20'
                                                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10'
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
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="glass-card rounded-3xl overflow-hidden shadow-lg animate-pulse border border-white/10">
                                        <div className="aspect-[4/3] bg-white/10"></div>
                                        <div className="p-6 space-y-4">
                                            <div className="h-4 bg-white/10 rounded w-3/4"></div>
                                            <div className="h-4 bg-white/10 rounded w-1/2"></div>
                                            <div className="h-20 bg-white/10 rounded"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : stories.length === 0 ? (
                            <div className="flex flex-col items-center">
                                {/* Seeded Empty State Cards - REMOVED */}

                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-10 max-w-2xl mx-auto"
                                >
                                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Sparkles size={32} className="text-blue-600" />
                                    </div>
                                    <h3 className="text-3xl font-bold text-slate-900 mb-3">Be the First Explorer ✨</h3>
                                    <p className="text-lg text-slate-600 mb-8">Share your journey and inspire thousands of future travelers.</p>

                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                        <button
                                            onClick={() => setShowCreateModal(true)}
                                            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                                        >
                                            Share Your Story
                                        </button>
                                        <button
                                            className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-slate-600 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-300"
                                        >
                                            View All Stories
                                        </button>
                                    </div>

                                    {/* Benefits Section */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left">
                                        <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                                            <div className="p-2 bg-blue-50 rounded-lg w-fit mb-3">
                                                <Heart size={20} className="text-blue-600" />
                                            </div>
                                            <h4 className="font-bold text-slate-900 mb-1">Inspire Others</h4>
                                            <p className="text-sm text-slate-500">Your story could be the reason someone takes their first trip.</p>
                                        </div>
                                        <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                                            <div className="p-2 bg-purple-50 rounded-lg w-fit mb-3">
                                                <TrendingUp size={20} className="text-purple-600" />
                                            </div>
                                            <h4 className="font-bold text-slate-900 mb-1">Get Featured</h4>
                                            <p className="text-sm text-slate-500">Top stories get featured on our homepage and newsletter.</p>
                                        </div>
                                        <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                                            <div className="p-2 bg-pink-50 rounded-lg w-fit mb-3">
                                                <MapPin size={20} className="text-pink-600" />
                                            </div>
                                            <h4 className="font-bold text-slate-900 mb-1">Build Legacy</h4>
                                            <p className="text-sm text-slate-500">Create a permanent record of your travel memories.</p>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
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
                                        <StoryCard
                                            story={story}
                                            onLike={handleLike}
                                            onEdit={(currentUser?.uid === story.authorId || currentUser?.email === 'chauhanparth165@gmail.com') ? () => handleEditStory(story) : undefined}
                                        />
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
                    onClose={() => {
                        setShowCreateModal(false);
                        setEditStory(null);
                    }}
                    onStoryCreated={fetchStories}
                    storyToEdit={editStory}
                />
            )}
        </>
    );
};

export default StoriesPage;
