import React, { useState } from 'react';
import { Star, Upload, X, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';

const ReviewForm = ({ packageId, packageTitle, onClose, onReviewSubmitted }) => {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [name, setName] = useState('');
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { addToast } = useToast();

    // Mock photo upload state - in real implementation this would go to Cloudinary/Firebase Storage
    const [photos, setPhotos] = useState([]);

    const handlePhotoChange = (e) => {
        // For demo, we just read the file name or show a placeholder. 
        // Real implementation would upload here.
        if (e.target.files && e.target.files[0]) {
            // In a real app, upload logic here.
            addToast("Photo upload simulation: File selected", "info");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            addToast("Please select a rating", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, "reviews"), {
                packageId,
                packageTitle,
                name,
                rating,
                comment,
                date: new Date().toISOString(),
                createdAt: serverTimestamp(),
                verified: false, // Default to false, admin can verify
                photos: [] // Placeholder for now
            });

            addToast("Review submitted successfully!", "success");
            if (onReviewSubmitted) onReviewSubmitted();
            onClose();
        } catch (error) {
            console.error("Error submitting review:", error);
            addToast("Failed to submit review. Please try again.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="glass-card shadow-2xl rounded-2xl w-full max-w-lg p-6 relative !border-white/20"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                    <X size={24} />
                </button>

                <h3 className="text-2xl font-bold text-white mb-2">Write a Review</h3>
                <p className="text-slate-400 mb-6 text-sm">How was your experience with <strong>{packageTitle}</strong>?</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Star Rating */}
                    <div className="flex flex-col items-center gap-2 mb-6">
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    onClick={() => setRating(star)}
                                    className="p-1 focus:outline-none transition-transform hover:scale-110"
                                >
                                    <Star
                                        size={32}
                                        className={`${star <= (hoveredRating || rating)
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-white/20'
                                            } transition-colors`}
                                    />
                                </button>
                            ))}
                        </div>
                        <p className="text-slate-400 text-sm font-medium">
                            {hoveredRating || rating ? (
                                <span className="text-blue-400">
                                    {['Terrible', 'Bad', 'Average', 'Good', 'Excellent'][(hoveredRating || rating) - 1]}
                                </span>
                            ) : 'Select a rating'}
                        </p>
                    </div>

                    {/* Reviewer Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Your Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all outline-none text-white placeholder:text-slate-500"
                            placeholder="John Doe"
                        />
                    </div>

                    {/* Comment */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Your Review</label>
                        <textarea
                            required
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all outline-none resize-none text-white placeholder:text-slate-500"
                            placeholder="Tell us about your trip..."
                        />
                    </div>

                    {/* Photo Upload UI (Mock) */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Add Photos</label>
                        <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border border-white/10 border-dashed rounded-xl cursor-pointer hover:bg-white/5 transition-colors bg-white/5">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload size={24} className="text-slate-400 mb-2" />
                                    <p className="mb-2 text-sm text-slate-400"><span className="font-semibold text-blue-400">Click to upload</span> or drag and drop</p>
                                    <p className="text-xs text-slate-500">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
                                </div>
                                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                            </label>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 hover:shadow-blue-600/40"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader size={20} className="animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            'Submit Review'
                        )}
                    </button>
                </form>
            </motion.div>
        </motion.div>
    );
};

export default ReviewForm;
