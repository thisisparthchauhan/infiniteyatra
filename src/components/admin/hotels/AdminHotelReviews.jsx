import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Search, Star, Check, X, Trash2, Eye, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { addCredits } from '../../../services/passportService';

const STATUS_COLORS = {
    pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/20',
    approved: 'bg-green-500/20 text-green-300 border-green-500/20',
    rejected: 'bg-red-500/20 text-red-300 border-red-500/20'
};

const AdminHotelReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        const q = query(collection(db, 'hotel_reviews'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        }, (err) => {
            console.error(err);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const updateStatus = async (review, status) => {
        try {
            await updateDoc(doc(db, 'hotel_reviews', review.id), { status, updatedAt: serverTimestamp() });

            // Award credits if approving a review
            if (status === 'approved' && review.userId && review.userId !== 'anonymous') {
                try {
                    await addCredits(review.userId, 'review', `Verified review for ${review.hotelName}`, 25, review.id);
                } catch (creditErr) {
                    console.warn('Could not award credits:', creditErr);
                }
            }
        } catch (err) {
            console.error(err);
            alert('Failed to update review');
        }
    };

    const deleteReview = async (id) => {
        if (!window.confirm('Delete this review permanently?')) return;
        try {
            await deleteDoc(doc(db, 'hotel_reviews', id));
        } catch (err) {
            console.error(err);
            alert('Failed to delete');
        }
    };

    const filtered = reviews.filter(r => {
        const matchSearch = !search ||
            r.userName?.toLowerCase().includes(search.toLowerCase()) ||
            r.hotelName?.toLowerCase().includes(search.toLowerCase()) ||
            r.title?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || r.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const stats = {
        total: reviews.length,
        pending: reviews.filter(r => r.status === 'pending').length,
        approved: reviews.filter(r => r.status === 'approved').length,
        rejected: reviews.filter(r => r.status === 'rejected').length
    };

    if (loading) {
        return <div className="flex items-center justify-center h-[60vh]"><div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" /></div>;
    }

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total', value: stats.total, icon: Star, color: 'text-blue-400' },
                    { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-yellow-400' },
                    { label: 'Approved', value: stats.approved, icon: CheckCircle2, color: 'text-green-400' },
                    { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-red-400' }
                ].map((s, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                        <div className={`p-2.5 rounded-lg bg-black/40 ${s.color}`}><s.icon size={20} /></div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">{s.label}</p>
                            <p className="text-xl font-bold text-white">{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reviews..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                </div>
                <div className="flex gap-2">
                    {['all', 'pending', 'approved', 'rejected'].map(s => (
                        <button key={s} onClick={() => setStatusFilter(s)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'}`}>
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Reviews List */}
            {filtered.length === 0 ? (
                <div className="text-center py-20 text-slate-500">
                    <Star size={48} className="mx-auto mb-4 text-slate-700" />
                    <p className="text-lg font-bold text-white mb-1">No reviews found</p>
                    <p className="text-sm">Reviews submitted by guests will appear here for moderation.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map(review => (
                        <div key={review.id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/[0.07] transition-colors">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold text-white">{(review.userName || 'A')[0].toUpperCase()}</div>
                                    <div>
                                        <p className="font-medium text-white">{review.userName}</p>
                                        <p className="text-xs text-slate-500">{review.userEmail} • {review.hotelName}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <Star key={s} size={14} className={s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-700'} />
                                        ))}
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border capitalize ${STATUS_COLORS[review.status] || STATUS_COLORS.pending}`}>
                                        {review.status}
                                    </span>
                                </div>
                            </div>
                            <h4 className="font-bold text-white mb-1">{review.title}</h4>
                            <p className="text-sm text-zinc-400 leading-relaxed mb-4">{review.body}</p>
                            <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                <p className="text-xs text-slate-600">{review.createdAt?.toDate?.()?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) || ''}</p>
                                <div className="flex gap-2">
                                    {review.status === 'pending' && (
                                        <>
                                            <button onClick={() => updateStatus(review, 'approved')} className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs font-bold hover:bg-green-500/30 flex items-center gap-1"><Check size={12} /> Approve</button>
                                            <button onClick={() => updateStatus(review, 'rejected')} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/30 flex items-center gap-1"><X size={12} /> Reject</button>
                                        </>
                                    )}
                                    <button onClick={() => deleteReview(review.id)} className="px-3 py-1.5 bg-white/5 text-slate-500 rounded-lg text-xs hover:bg-red-500/20 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminHotelReviews;
