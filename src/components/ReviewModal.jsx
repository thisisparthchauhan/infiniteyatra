import React, { useState } from 'react';
import { X, Star, Upload, Camera, Loader2, CheckCircle } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { uploadToCloudinary } from '../services/cloudinary';
import { useAuth } from '../context/AuthContext';

const ReviewModal = ({ booking, onClose }) => {
    const { currentUser } = useAuth();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [title, setTitle] = useState('');
    const [review, setReview] = useState('');
    const [photos, setPhotos] = useState([]);
    const [photoPreviews, setPhotoPreviews] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

    const handlePhotoChange = (e) => {
        const files = Array.from(e.target.files).slice(0, 5 - photos.length);
        if (files.length === 0) return;
        const newPreviews = files.map(f => URL.createObjectURL(f));
        setPhotos(prev => [...prev, ...files]);
        setPhotoPreviews(prev => [...prev, ...newPreviews]);
    };

    const removePhoto = (idx) => {
        URL.revokeObjectURL(photoPreviews[idx]);
        setPhotos(prev => prev.filter((_, i) => i !== idx));
        setPhotoPreviews(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async () => {
        if (rating === 0) { setError('Please select a star rating.'); return; }
        if (!review.trim()) { setError('Please write your review.'); return; }
        setError('');
        setSubmitting(true);

        try {
            // Check if review already submitted for this booking
            const existing = await getDocs(query(collection(db, 'reviews'), where('bookingId', '==', booking.id)));
            if (!existing.empty) {
                setError('You have already submitted a review for this trip.');
                setSubmitting(false);
                return;
            }

            // Upload photos to Cloudinary if any
            let photoUrls = [];
            for (const photo of photos) {
                try {
                    const url = await uploadToCloudinary(photo);
                    if (url) photoUrls.push(url);
                } catch (e) { console.error('Photo upload failed', e); }
            }

            await addDoc(collection(db, 'reviews'), {
                packageId: booking.packageId,
                packageTitle: booking.packageTitle,
                bookingId: booking.id,
                userId: currentUser?.uid || '',
                userName: currentUser?.displayName || currentUser?.name || booking.name || 'Traveler',
                rating,
                title: title.trim(),
                review: review.trim(),
                photos: photoUrls,
                status: 'pending', // awaits admin approval
                createdAt: serverTimestamp(),
            });

            setSubmitted(true);
        } catch (err) {
            console.error(err);
            setError('Failed to submit review. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="bg-[#1a1f2e] border border-green-500/30 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={36} className="text-green-400" />
                    </div>
                    <h3 className="text-white font-bold text-xl mb-2">Review Submitted! 🎉</h3>
                    <p className="text-slate-400 text-sm mb-2">Thank you for sharing your experience.</p>
                    <p className="text-slate-500 text-xs mb-6">Your review is under review by our team and will be published shortly after approval. This usually takes 24–48 hours.</p>
                    <button onClick={onClose} className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium transition-colors">
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/10">
                    <div>
                        <h3 className="text-white font-bold text-lg">Write a Review</h3>
                        <p className="text-slate-400 text-sm">{booking.packageTitle}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto p-5 space-y-5 flex-1">
                    {/* Star Rating */}
                    <div className="text-center">
                        <p className="text-slate-400 text-sm mb-3">How was your experience?</p>
                        <div className="flex justify-center gap-2 mb-1">
                            {[1,2,3,4,5].map(star => (
                                <button key={star} type="button"
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRating(star)}
                                    className="transition-transform hover:scale-110">
                                    <Star size={36} className={`${star <= (hoverRating || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'} transition-colors`} />
                                </button>
                            ))}
                        </div>
                        {(hoverRating || rating) > 0 && (
                            <p className="text-yellow-400 text-sm font-medium">{ratingLabels[hoverRating || rating]}</p>
                        )}
                    </div>

                    {/* Review Title */}
                    <div>
                        <label className="block text-sm text-slate-400 mb-1.5">Review Title <span className="text-slate-600">(optional)</span></label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                            placeholder="Summarize your experience..."
                            maxLength={80}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50" />
                    </div>

                    {/* Review Text */}
                    <div>
                        <label className="block text-sm text-slate-400 mb-1.5">Your Review *</label>
                        <textarea value={review} onChange={e => setReview(e.target.value)}
                            placeholder="Tell others about your experience — what you loved, tips for future travelers..."
                            rows={4} maxLength={1000}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 resize-none" />
                        <p className="text-xs text-slate-600 text-right mt-1">{review.length}/1000</p>
                    </div>

                    {/* Photos */}
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">Add Photos <span className="text-slate-600">(up to 5)</span></label>
                        <div className="flex flex-wrap gap-3">
                            {photoPreviews.map((src, idx) => (
                                <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10">
                                    <img src={src} alt="" className="w-full h-full object-cover" />
                                    <button onClick={() => removePhoto(idx)}
                                        className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center">
                                        <X size={10} className="text-white" />
                                    </button>
                                </div>
                            ))}
                            {photos.length < 5 && (
                                <label className="w-20 h-20 rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-white/40 transition-colors">
                                    <Camera size={20} className="text-slate-500" />
                                    <span className="text-[10px] text-slate-600">Add Photo</span>
                                    <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoChange} />
                                </label>
                            )}
                        </div>
                    </div>

                    {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-white/10">
                    <p className="text-xs text-slate-600 mb-3">⏳ Your review will be published after admin approval (24–48 hrs)</p>
                    <button onClick={handleSubmit} disabled={submitting}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                        {submitting ? <><Loader2 size={18} className="animate-spin" /> Submitting...</> : '⭐ Submit Review'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReviewModal;
