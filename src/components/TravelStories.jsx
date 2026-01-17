import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Plus, MapPin, Heart, MessageCircle, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, orderBy, limit, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import StoryCard from './StoryCard';
import CreateStoryModal from './CreateStoryModal';
import { seededStories } from '../data/seededStories';

const TravelStories = () => {
    const navigate = useNavigate();
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const { currentUser } = useAuth();

    useEffect(() => {
        fetchStories();
    }, []);

    const fetchStories = async () => {
        try {
            const storiesRef = collection(db, 'travelStories');
            const q = query(storiesRef, orderBy('createdAt', 'desc'), limit(20));
            const querySnapshot = await getDocs(q);

            const allStories = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Separate featured/admin stories from community stories
            const featuredStories = allStories.filter(story => story.isFeatured || story.isAdmin);
            const communityStories = allStories.filter(story => !story.isFeatured && !story.isAdmin);

            // Combine fetched stories with seeded stories
            // Show featured stories first, then community stories (limit to 3 for homepage)
            const combinedStories = [...featuredStories, ...communityStories, ...seededStories];
            // Remove duplicates based on ID if real stories start flowing in that might match seeds (unlikely with random IDs but good practice)
            const uniqueStories = Array.from(new Map(combinedStories.map(item => [item.id, item])).values());

            const sortedStories = uniqueStories.slice(0, 3);
            setStories(sortedStories);
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

            // Update local state
            setStories(stories.map(story =>
                story.id === storyId
                    ? { ...story, likes: (story.likes || 0) + 1 }
                    : story
            ));
        } catch (error) {
            console.error('Error liking story:', error);
        }
    };

    const handleShareStoryClick = () => {
        if (!currentUser) {
            if (window.confirm('Please login or sign up to share your travel story! Click OK to go to login page.')) {
                navigate('/login');
            }
            return;
        }
        setShowCreateModal(true);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 40 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1]
            }
        }
    };

    return (
        <>
            <section id="stories-preview" className="py-24 bg-slate-900 relative overflow-hidden">
                {/* Background Decorations */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl mix-blend-screen"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl mix-blend-screen"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-slate-800/30 rounded-full blur-3xl"></div>
                </div>

                <div className="container mx-auto px-6 relative z-10">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-16 gap-6">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7 }}
                            className="max-w-2xl"
                        >
                            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4 shadow-lg shadow-blue-900/20">
                                <MapPin size={16} />
                                <span>Community Stories</span>
                            </div>
                            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                                Latest Travel
                                <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                    Adventures
                                </span>
                            </h2>
                            <p className="text-slate-300 text-lg md:text-xl leading-relaxed">
                                Real stories from real travelers. Share your journey, inspire others, and discover amazing experiences from our community.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7 }}
                            className="flex flex-col sm:flex-row gap-4"
                        >
                            <button
                                onClick={handleShareStoryClick}
                                className="group flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold shadow-xl hover:shadow-2xl shadow-blue-900/20 transition-all duration-300 hover:scale-105"
                            >
                                <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" />
                                Share Your Story
                            </button>

                            <Link
                                to="/stories"
                                className="hidden md:flex items-center gap-2 text-blue-400 font-semibold hover:text-purple-400 transition-colors px-6 py-4 rounded-2xl hover:bg-white/5 backdrop-blur-sm border border-transparent hover:border-white/10"
                            >
                                View All Stories
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </motion.div>
                    </div>

                    {/* Stories Grid */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="glass-card overflow-hidden shadow-lg animate-pulse h-[400px]">
                                    <div className="h-48 bg-white/5"></div>
                                    <div className="p-6 space-y-4">
                                        <div className="h-4 bg-white/10 rounded w-3/4"></div>
                                        <div className="h-4 bg-white/10 rounded w-1/2"></div>
                                        <div className="h-20 bg-white/5 rounded"></div>
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
                            <div className="glass-card p-12 max-w-md mx-auto">
                                <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <MapPin size={40} className="text-blue-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">No Stories Yet</h3>
                                <p className="text-slate-300 mb-8">Be the first to share your travel adventure with our community!</p>
                                <button
                                    onClick={handleShareStoryClick}
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                                >
                                    Share Your Story
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-100px" }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                        >
                            {stories.map(story => (
                                <motion.div key={story.id} variants={itemVariants}>
                                    <StoryCard story={story} onLike={handleLike} />
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                    {/* Mobile View All Button */}
                    {stories.length > 0 && (
                        <div className="mt-12 md:hidden text-center">
                            <Link
                                to="/stories"
                                className="inline-flex items-center gap-2 text-blue-400 font-semibold hover:text-purple-400 transition-colors px-8 py-4 rounded-2xl glass-card hover:bg-white/10"
                            >
                                View All Stories
                                <ArrowRight size={20} />
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* Create Story Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <CreateStoryModal
                        onClose={() => setShowCreateModal(false)}
                        onStoryCreated={fetchStories}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default TravelStories;
