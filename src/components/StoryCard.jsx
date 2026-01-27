import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Heart, MessageCircle, Eye, Calendar, User, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const StoryCard = ({ story, onLike, onEdit }) => {
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

    return (
        <motion.div
            whileHover={{ y: -8 }}
            className="group glass-card rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 relative"
        >
            {/* Image Container */}
            <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100">
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* Location Badge */}
                {story.location && (
                    <div className="absolute top-4 left-4 glass-card !bg-black/40 !backdrop-blur-md !rounded-full px-3 py-1.5 flex items-center gap-1.5 border border-white/10">
                        <MapPin size={14} className="text-white/90" />
                        <span className="text-xs font-medium text-white/90 tracking-wide">{story.location}</span>
                    </div>
                )}

                {/* Owner Status Badge (Only visible if onEdit/Owner) */}
                {onEdit && (
                    <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg ${story.status === 'approved' ? 'bg-green-500/90 text-white' :
                            story.status === 'rejected' ? 'bg-red-500/90 text-white' :
                                'bg-yellow-500/90 text-white'
                        }`}>
                        {story.status || 'Pending'}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-6">

                {/* Title */}
                <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 leading-tight group-hover:text-blue-400 transition-colors">
                    {story.title}
                </h3>

                {/* Description - Emotional Preview */}
                <p className="text-white/60 text-sm leading-relaxed mb-4 line-clamp-2 font-light">
                    {story.description}
                </p>

                {/* Author Info */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[10px] text-white font-bold">
                        {story.authorName ? story.authorName.charAt(0).toUpperCase() : 'A'}
                    </div>
                    <span className="text-xs text-white/50 font-medium">
                        by {story.authorName || 'Traveler'}
                    </span>
                </div>

                {/* Tags */}
                {story.tags && story.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        {story.tags.slice(0, 3).map((tag, index) => (
                            <span
                                key={index}
                                className="px-2.5 py-0.5 bg-white/5 text-slate-300 text-[10px] font-medium uppercase tracking-wider rounded border border-white/10"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Actions Footer */}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleLike}
                            className={`flex items-center gap-2 transition-all duration-300 ${isLiked
                                ? 'text-red-500'
                                : 'text-white/40 hover:text-red-500'
                                }`}
                        >
                            <Heart
                                size={18}
                                className={`transition-all duration-300 ${isLiked ? 'fill-current scale-110' : ''}`}
                            />
                            <span className="text-xs font-medium">{localLikes > 0 && localLikes}</span>
                        </button>

                        {/* Edit Button (if owner) */}
                        {onEdit && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit();
                                }}
                                className="text-xs font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wide"
                            >
                                Edit
                            </button>
                        )}
                    </div>

                    <Link
                        to={`/story/${story.id}`}
                        className="text-white/90 hover:text-white font-medium text-sm flex items-center gap-2 group/link"
                    >
                        <span className="hidden sm:inline">Read Experience</span>
                        <span className="sm:hidden">Read</span>
                        <MessageCircle size={16} className="text-blue-400 group-hover/link:scale-110 transition-transform" />
                    </Link>
                </div>
            </div>
        </motion.div>
    );
};

export default StoryCard;
