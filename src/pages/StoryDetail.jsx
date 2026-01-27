import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { MapPin, Calendar, User, ArrowLeft, Heart, Share2, Tag } from 'lucide-react';
import SEO from '../components/SEO';
import { motion } from 'framer-motion';

const StoryDetail = () => {
    const { id } = useParams();
    const [story, setStory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLiked, setIsLiked] = useState(false);
    const { currentUser } = useAuth();

    useEffect(() => {
        const fetchStory = async () => {
            try {
                const docRef = doc(db, 'travelStories', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setStory({ id: docSnap.id, ...docSnap.data() });
                    // Increment view count
                    updateDoc(docRef, { views: increment(1) });
                } else {
                    console.error("No such story!");
                }
            } catch (error) {
                console.error("Error fetching story:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStory();
        window.scrollTo(0, 0);
    }, [id]);

    const handleLike = async () => {
        if (!currentUser) {
            alert('Please login to like stories');
            return;
        }
        if (isLiked) return; // Prevent spam

        try {
            const storyRef = doc(db, 'travelStories', id);
            await updateDoc(storyRef, {
                likes: increment(1)
            });
            setStory(prev => ({ ...prev, likes: (prev.likes || 0) + 1 }));
            setIsLiked(true);
        } catch (error) {
            console.error('Error liking story:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!story) {
        return (
            <div className="min-h-screen bg-black pt-32 pb-20 text-center flex flex-col items-center justify-center">
                <h2 className="text-2xl font-bold text-white mb-4">Experience Not Found</h2>
                <Link to="/stories" className="text-blue-400 hover:text-blue-300 flex items-center gap-2">
                    <ArrowLeft size={20} /> Back to Stories
                </Link>
            </div>
        );
    }

    return (
        <article className="min-h-screen bg-black text-white pb-20">
            <SEO
                title={`${story.title} - Infinite Yatra`}
                description={story.description.substring(0, 160)}
                image={story.imageUrl}
                url={`/story/${id}`}
            />

            {/* Premium Hero Section - Split Layout */}
            <div className="relative w-full min-h-[70vh] flex items-center bg-[#050505] overflow-hidden pt-32 pb-20">
                {/* Background ambient glows */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="container mx-auto px-6 relative z-10">
                    <div className="flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-20">
                        {/* Text Content - Left */}
                        <div className="flex-1 space-y-8">
                            <Link to="/stories" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 group">
                                <span className="p-2 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
                                    <ArrowLeft size={16} />
                                </span>
                                <span className="font-medium">Back to Experiences</span>
                            </Link>

                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-4xl md:text-5xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight"
                            >
                                {story.title}
                            </motion.h1>

                            <div className="flex flex-wrap items-center gap-6 md:gap-8 text-slate-300">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-blue-900/40">
                                        {story.authorName ? story.authorName.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-0.5">Written By</div>
                                        <div className="text-white font-medium text-lg">{story.authorName || 'Traveler'}</div>
                                    </div>
                                </div>

                                <div className="w-px h-12 bg-white/10 hidden md:block"></div>

                                {story.createdAt && (
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                                            <Calendar size={20} className="text-slate-400" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Published On</div>
                                            <div className="text-white font-medium">
                                                {story.createdAt?.toDate
                                                    ? story.createdAt.toDate().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                                                    : 'Recently'}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Location */}
                                {story.location && (
                                    <>
                                        <div className="w-px h-12 bg-white/10 hidden md:block"></div>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                                                <MapPin size={20} className="text-slate-400" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Location</div>
                                                <div className="text-white font-medium">{story.location}</div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Image Frame - Right */}
                        <div className="flex-1 w-full max-w-2xl">
                            {story.imageUrl ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
                                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-blue-900/30 group"
                                >
                                    <div className="aspect-[4/3] md:aspect-video w-full bg-slate-900">
                                        <img
                                            src={story.imageUrl}
                                            alt={story.title}
                                            className="w-full h-full object-contain bg-black/60 backdrop-blur-sm p-4"
                                        />
                                    </div>
                                    {/* Glossy Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none"></div>
                                </motion.div>
                            ) : (
                                <div className="aspect-video w-full bg-slate-900 rounded-3xl flex items-center justify-center border border-white/10">
                                    <MapPin size={64} className="text-slate-700" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="container mx-auto px-6 max-w-3xl mt-12 md:mt-20">
                <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
                    {/* Decorative top border gradient */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>

                    {/* Tags */}
                    {story.tags && story.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-8">
                            {story.tags.map((tag, index) => (
                                <span key={index} className="px-4 py-1.5 bg-blue-500/10 text-blue-400 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-500/20 flex items-center gap-1.5 hover:bg-blue-500/20 transition-colors cursor-default">
                                    <Tag size={12} /> {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Description */}
                    <div className="prose prose-lg prose-invert max-w-none">
                        <p className="whitespace-pre-line text-slate-300 leading-relaxed text-lg">
                            {story.description}
                        </p>
                    </div>

                    {/* Image Gallery (if multiple images) */}
                    {story.images && story.images.length > 1 && (
                        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {story.images.slice(1).map((img, idx) => (
                                <img
                                    key={idx}
                                    src={img}
                                    alt={`Gallery ${idx}`}
                                    className="rounded-xl w-full h-64 object-cover border border-white/10 hover:opacity-90 transition-opacity cursor-pointer"
                                />
                            ))}
                        </div>
                    )}

                    {/* Actions Footer */}
                    <div className="mt-12 pt-8 border-t border-white/10 flex items-center justify-between">
                        <button
                            onClick={handleLike}
                            className={`flex items-center gap-3 px-6 py-3 rounded-xl font-bold transition-all ${isLiked
                                ? 'bg-red-500/20 text-red-500 border border-red-500/30'
                                : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
                                }`}
                        >
                            <Heart size={20} className={isLiked ? 'fill-current' : ''} />
                            <span>{story.likes || 0} People felt this</span>
                        </button>

                        <button className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                            <Share2 size={20} />
                            <span className="hidden sm:inline">Share Journey</span>
                        </button>
                    </div>


                </div>
            </div>
        </article>
    );
};

export default StoryDetail;
