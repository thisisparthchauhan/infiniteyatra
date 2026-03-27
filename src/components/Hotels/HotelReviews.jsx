import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MessageCircle, ThumbsUp, User, ShieldCheck, Send, ChevronDown, X, Loader2 } from 'lucide-react';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

// ─── Review Submission Modal ───
export const HotelReviewModal = ({ isOpen, onClose, hotelId, hotelName }) => {
    const { user } = useAuth();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (rating === 0) return setError('Please select a rating.');
        if (!title.trim()) return setError('Please add a title.');
        if (body.trim().length < 50) return setError('Review must be at least 50 characters.');

        setSubmitting(true);
        try {
            await addDoc(collection(db, 'hotel_reviews'), {
                hotelId,
                hotelName,
                userId: user?.uid || 'anonymous',
                userName: user?.displayName || user?.email?.split('@')[0] || 'Anonymous Guest',
                userEmail: user?.email || '',
                rating,
                title: title.trim(),
                body: body.trim(),
                status: 'pending', // pending → approved/rejected by admin
                helpful: 0,
                createdAt: serverTimestamp()
            });
            setSuccess(true);
        } catch (err) {
            console.error('Error submitting review:', err);
            setError('Failed to submit review. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="bg-[#0f172a] w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 shadow-2xl">
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-white">Write a Review</h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg"><X size={18} className="text-zinc-400" /></button>
                </div>

                {success ? (
                    <div className="p-8 text-center space-y-3">
                        <div className="text-5xl">⭐</div>
                        <h3 className="text-xl font-bold text-white">Thank you!</h3>
                        <p className="text-sm text-zinc-400">Your review has been submitted for approval. Once verified, you'll earn IY Passport credits!</p>
                        <button onClick={onClose} className="mt-4 px-6 py-2 bg-white/10 text-white rounded-xl text-sm">Close</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <p className="text-sm text-zinc-400">Reviewing: <strong className="text-white">{hotelName}</strong></p>

                        {/* Star Rating */}
                        <div className="flex gap-2 justify-center py-2">
                            {[1, 2, 3, 4, 5].map(s => (
                                <button
                                    key={s}
                                    type="button"
                                    onMouseEnter={() => setHoverRating(s)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRating(s)}
                                    className="transition-transform hover:scale-125"
                                >
                                    <Star
                                        size={32}
                                        className={`${(hoverRating || rating) >= s ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-600'} transition-colors`}
                                    />
                                </button>
                            ))}
                        </div>

                        <div>
                            <label className="text-sm text-zinc-400 block mb-1">Title</label>
                            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none" placeholder="e.g. Amazing stay with breathtaking views!" />
                        </div>
                        <div>
                            <label className="text-sm text-zinc-400 block mb-1">Your Review (min 50 chars)</label>
                            <textarea value={body} onChange={e => setBody(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none resize-none h-28" placeholder="Share your experience..." />
                            <p className="text-xs text-zinc-600 mt-1">{body.length}/50 characters</p>
                        </div>

                        {error && <p className="text-sm text-red-400 text-center">{error}</p>}

                        <button type="submit" disabled={submitting} className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                            {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : <><Send size={16} /> Submit Review</>}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

// ─── Reviews Display Component ───
const HotelReviews = ({ hotelId, hotelName }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const q = query(
                    collection(db, 'hotel_reviews'),
                    where('hotelId', '==', hotelId),
                    where('status', '==', 'approved')
                );
                const snap = await getDocs(q);
                const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                data.sort((a, b) => {
                    const dateA = a.createdAt?.toDate?.() || new Date(0);
                    const dateB = b.createdAt?.toDate?.() || new Date(0);
                    return dateB - dateA;
                });
                setReviews(data);
            } catch (err) {
                console.error('Error fetching reviews:', err);
            } finally {
                setLoading(false);
            }
        };
        if (hotelId) fetchReviews();
    }, [hotelId]);

    const avgRating = reviews.length > 0
        ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
        : 0;

    const displayed = showAll ? reviews : reviews.slice(0, 3);

    const handleWriteReview = () => {
        if (user) {
            setShowModal(true);
        } else {
            addToast('Please log in to write a review.', 'info');
            navigate('/login');
        }
    };

    return (
        <section id="reviews" className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold font-display flex items-center gap-3">
                    Reviews
                    {reviews.length > 0 && (
                        <span className="flex items-center gap-1 text-lg bg-yellow-500/10 text-yellow-400 px-3 py-1 rounded-full font-bold">
                            <Star size={16} fill="currentColor" /> {avgRating}
                            <span className="text-xs text-zinc-500 font-normal ml-1">({reviews.length})</span>
                        </span>
                    )}
                </h2>
                <button
                    onClick={handleWriteReview}
                    className="px-4 py-2 bg-orange-500/20 text-orange-400 border border-orange-500/20 rounded-xl text-sm font-bold hover:bg-orange-500/30 transition-colors"
                >
                    ✍️ Write a Review
                </button>
            </div>

            {loading ? (
                <div className="text-zinc-500 text-sm">Loading reviews...</div>
            ) : reviews.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
                    <p className="text-zinc-400 mb-2">No reviews yet.</p>
                    <p className="text-sm text-zinc-600">Be the first to share your experience!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Rating Bars */}
                    <div className="bg-white/5 border border-white/5 rounded-xl p-5">
                        <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-x-6 gap-y-1.5">
                            {[5, 4, 3, 2, 1].map(s => {
                                const count = reviews.filter(r => r.rating === s).length;
                                const pct = (count / reviews.length) * 100;
                                return (
                                    <React.Fragment key={s}>
                                        <div className="flex items-center gap-1 text-sm text-zinc-400 whitespace-nowrap">
                                            {s} <Star size={12} fill="currentColor" className="text-yellow-400" />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                            </div>
                                            <span className="text-xs text-zinc-500 w-8 text-right">{count}</span>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>

                    {/* Review Cards */}
                    {displayed.map(review => (
                        <div key={review.id} className="bg-white/5 border border-white/5 rounded-xl p-5 hover:bg-white/[0.07] transition-colors">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
                                        {(review.userName || 'A')[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-white flex items-center gap-2">
                                            {review.userName}
                                            <span className="inline-flex items-center gap-1 text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded border border-green-500/20 font-bold uppercase">
                                                <ShieldCheck size={10} /> Verified
                                            </span>
                                        </p>
                                        <p className="text-xs text-zinc-500">
                                            {review.createdAt?.toDate?.()?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) || ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <Star key={s} size={14} className={s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-700'} />
                                    ))}
                                </div>
                            </div>
                            <h4 className="font-bold text-white mb-1">{review.title}</h4>
                            <p className="text-sm text-zinc-400 leading-relaxed">{review.body}</p>
                        </div>
                    ))}

                    {reviews.length > 3 && !showAll && (
                        <button onClick={() => setShowAll(true)} className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                            <ChevronDown size={16} /> Show all {reviews.length} reviews
                        </button>
                    )}
                </div>
            )}

            {/* Review Modal */}
            <HotelReviewModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                hotelId={hotelId}
                hotelName={hotelName}
            />
        </section>
    );
};

export default HotelReviews;
