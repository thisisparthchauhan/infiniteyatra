import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Heart, MessageCircle, Eye, Calendar, User, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const StoryCard = ({ story, onLike }) => {
    const [isLiked, setIsLiked] = useState(false);
    const [localLikes, setLocalLikes] = useState(story.likes || 0);
    const { currentUser } = useAuth();

    const handleLike = () => {
        if (!currentUser) {
            alert('Please login to like stories');
            return;
        }

        if (!isLiked) {
            setIsLiked(true);
            setLocalLikes(prev => prev + 1);
            onLike(story.id);
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Recently';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <motion.div
            whileHover={{ y: -8 }}
            className="group glass-card overflow-hidden hover:shadow-2xl transition-all duration-500"
        >
            {/* Image Container */}
            <div className="relative aspect-[4/3] overflow-hidden bg-slate-800">
                {story.imageUrl ? (
                    <img
                        src={story.imageUrl}
                        alt={story.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <MapPin size={60} className="text-blue-400" />
                    </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* Location Badge */}
                {story.location && (
                    <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
                        <MapPin size={16} className="text-blue-400" />
                        <span className="text-sm font-semibold text-white">{story.location}</span>
                    </div>
                )}

                {/* Featured/Admin Badge */}
                {(story.isFeatured || story.isAdmin) && (
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 font-bold text-xs uppercase tracking-wide">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span>Featured</span>
                    </div>
                )}

                {/* View Count */}
                {!story.isFeatured && !story.isAdmin && (
                    <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-2 rounded-full flex items-center gap-2 text-white border border-white/10">
                        <Eye size={14} />
                        <span className="text-xs font-semibold">{story.views || 0}</span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-6">
                {/* Author Info */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                        {story.authorName?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">{story.authorName || 'Anonymous'}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Calendar size={12} />
                            <span>{formatDate(story.createdAt)}</span>
                        </div>
                    </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 leading-tight group-hover:text-blue-400 transition-colors">
                    {story.title}
                </h3>

                {/* Description */}
                <p className="text-slate-300 text-sm leading-relaxed mb-5 line-clamp-3">
                    {story.description}
                </p>

                {/* Tags */}
                {story.tags && story.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-5">
                        {story.tags.slice(0, 3).map((tag, index) => (
                            <span
                                key={index}
                                className="px-3 py-1 bg-white/5 text-blue-300 text-xs font-semibold rounded-full border border-white/10"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleLike}
                            className={`flex items-center gap-2 transition-all duration-300 ${isLiked
                                ? 'text-red-500'
                                : 'text-slate-400 hover:text-red-400'
                                }`}
                        >
                            <Heart
                                size={20}
                                className={`transition-all duration-300 ${isLiked ? 'fill-current scale-110' : ''}`}
                            />
                            <span className="text-sm font-semibold">{localLikes}</span>
                        </button>

                        <button className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors">
                            <MessageCircle size={20} />
                            <span className="text-sm font-semibold">{story.comments || 0}</span>
                        </button>
                    </div>

                    <Link
                        to={`/story/${story.id}`}
                        className="text-blue-400 hover:text-purple-400 font-semibold text-sm flex items-center gap-1 group/link"
                    >
                        Read More
                        <span className="group-hover/link:translate-x-1 transition-transform inline-block">→</span>
                    </Link>
                </div>
            </div>
        </motion.div>
    );
};

export default StoryCard;
