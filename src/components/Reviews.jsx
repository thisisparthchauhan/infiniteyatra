import React, { useState } from 'react';
import { Star, CheckCircle, Image as ImageIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Reviews = ({ reviews }) => {
    const [selectedImage, setSelectedImage] = useState(null);

    // Calculate average rating
    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

    // Render star icons
    const renderStars = (rating) => {
        return [...Array(5)].map((_, index) => (
            <Star
                key={index}
                size={14}
                className={`inline-block ${index < rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`}
            />
        ));
    };

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
    };

    return (
        <div className="py-8">
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedImage(null)}
                        className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 cursor-zoom-out backdrop-blur-sm"
                    >
                        <img
                            src={selectedImage}
                            alt="Review full size"
                            className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl border border-white/10"
                        />
                        <button className="absolute top-4 right-4 text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X size={24} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <h2 className="text-3xl font-bold text-white">Customer Reviews</h2>
                <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md border border-white/10 px-5 py-3 rounded-2xl">
                    <div className="text-3xl font-bold text-white">{averageRating.toFixed(1)}</div>
                    <div>
                        <div className="flex gap-1 mb-1">{renderStars(Math.round(averageRating))}</div>
                        <p className="text-xs text-slate-400 font-medium">{reviews.length} reviews</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviews.map((review, index) => (
                    <div
                        key={review.id || index}
                        className="glass-card p-6 !bg-white/5 hover:!bg-white/10 transition-colors"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner border border-white/20">
                                    {review.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-white">{review.name}</h4>
                                        {review.verified && (
                                            <div className="flex items-center gap-1 bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full text-[10px] font-bold border border-green-500/30 uppercase tracking-wide">
                                                <CheckCircle size={10} />
                                                Verified
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400">{formatDate(review.date)}</p>
                                </div>
                            </div>
                            <div className="flex gap-0.5">
                                {renderStars(review.rating)}
                            </div>
                        </div>

                        <p className="text-slate-300 text-sm leading-relaxed mb-4">{review.comment}</p>

                        {review.photos && review.photos.length > 0 && (
                            <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                                {review.photos.map((photo, pIndex) => (
                                    <button
                                        key={pIndex}
                                        onClick={() => setSelectedImage(photo)}
                                        className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-white/10 hover:border-blue-400 transition-colors group"
                                    >
                                        <img src={photo} alt={`Review ${pIndex}`} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Reviews;

