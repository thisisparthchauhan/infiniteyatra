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
                        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-zoom-out"
                    >
                        <img
                            src={selectedImage}
                            alt="Review full size"
                            className="max-w-full max-h-[90vh] rounded-lg object-contain"
                        />
                        <button className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full">
                            <X size={24} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-slate-900">Customer Reviews</h2>
                <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-xl">
                    <div className="text-3xl font-bold text-slate-900">{averageRating.toFixed(1)}</div>
                    <div>
                        <div className="flex gap-1 mb-1">{renderStars(Math.round(averageRating))}</div>
                        <p className="text-xs text-slate-500 font-medium">{reviews.length} reviews</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviews.map((review, index) => (
                    <div
                        key={review.id || index}
                        className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                    {review.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-slate-900">{review.name}</h4>
                                        {review.verified && (
                                            <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-green-100 uppercase tracking-wide">
                                                <CheckCircle size={10} />
                                                Verified
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500">{formatDate(review.date)}</p>
                                </div>
                            </div>
                            <div className="flex gap-0.5">
                                {renderStars(review.rating)}
                            </div>
                        </div>

                        <p className="text-slate-600 text-sm leading-relaxed mb-4">{review.comment}</p>

                        {review.photos && review.photos.length > 0 && (
                            <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-thin">
                                {review.photos.map((photo, pIndex) => (
                                    <button
                                        key={pIndex}
                                        onClick={() => setSelectedImage(photo)}
                                        className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-slate-200 hover:border-blue-400 transition-colors group"
                                    >
                                        <img src={photo} alt={`Review ${pIndex}`} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
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

