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
            className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-100"
        >
            {/* Image Container */}
            <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100">
                {story.imageUrl ? (
                    <img
                        src={story.imageUrl}
                        alt={story.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <MapPin size={60} className="text-blue-400" />
                    </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* Location Badge */}
                {story.location && (
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                        <MapPin size={16} className="text-blue-600" />
                        <span className="text-sm font-semibold text-slate-900">{story.location}</span>
                    </div>
                )}

                {/* View Count */}
                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-2 rounded-full flex items-center gap-2 text-white">
                    <Eye size={14} />
                    <span className="text-xs font-semibold">{story.views || 0}</span>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {/* Author Info */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        {story.authorName?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{story.authorName || 'Anonymous'}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Calendar size={12} />
                            <span>{formatDate(story.createdAt)}</span>
                        </div>
                    </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                    {story.title}
                </h3>

                {/* Description */}
                <p className="text-slate-600 text-sm leading-relaxed mb-5 line-clamp-3">
                    {story.description}
                </p>

                {/* Tags */}
                {story.tags && story.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-5">
                        {story.tags.slice(0, 3).map((tag, index) => (
                            <span
                                key={index}
                                className="px-3 py-1 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleLike}
                            className={`flex items-center gap-2 transition-all duration-300 ${isLiked
                                    ? 'text-red-500'
                                    : 'text-slate-400 hover:text-red-500'
                                }`}
                        >
                            <Heart
                                size={20}
                                className={`transition-all duration-300 ${isLiked ? 'fill-current scale-110' : ''}`}
                            />
                            <span className="text-sm font-semibold">{localLikes}</span>
                        </button>

                        <button className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors">
                            <MessageCircle size={20} />
                            <span className="text-sm font-semibold">{story.comments || 0}</span>
                        </button>
                    </div>

                    <Link
                        to={`/story/${story.id}`}
                        className="text-blue-600 hover:text-purple-600 font-semibold text-sm flex items-center gap-1 group/link"
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
