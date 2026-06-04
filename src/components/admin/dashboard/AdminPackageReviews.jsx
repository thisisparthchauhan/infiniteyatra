import React, { useState, useEffect } from 'react';
import { Star, Check, X, Trash2, Edit2, Clock, CheckCircle2, XCircle, Image as ImageIcon, Save, Loader2 } from 'lucide-react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useToast } from '../../../context/ToastContext';

const STATUS_TABS = [
    { key: 'pending', label: 'Pending', icon: Clock, color: 'text-yellow-400' },
    { key: 'approved', label: 'Approved', icon: CheckCircle2, color: 'text-green-400' },
    { key: 'rejected', label: 'Rejected', icon: XCircle, color: 'text-red-400' },
];

const AdminPackageReviews = () => {
    const { addToast } = useToast();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');
    const [editing, setEditing] = useState(null); // review being edited
    const [editForm, setEditForm] = useState({ rating: 5, title: '', review: '' });
    const [photoModal, setPhotoModal] = useState(null);
    const [busy, setBusy] = useState(false);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, 'reviews'));
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setReviews(data);
        } catch (err) {
            console.error(err);
            addToast('Failed to load reviews.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReviews(); }, []);

    // Recompute and store package average rating + count from approved reviews
    const recomputePackageRating = async (packageId) => {
        if (!packageId) return;
        try {
            const snap = await getDocs(query(
                collection(db, 'reviews'),
                where('packageId', '==', packageId),
                where('status', '==', 'approved')
            ));
            const approved = snap.docs.map(d => d.data());
            const count = approved.length;
            const avg = count > 0 ? approved.reduce((s, r) => s + (r.rating || 0), 0) / count : 0;
            await updateDoc(doc(db, 'packages', packageId), {
                rating: Number(avg.toFixed(2)),
                reviewCount: count
            });
        } catch (err) {
            console.warn('Could not update package rating:', err);
        }
    };

    const setStatus = async (review, status) => {
        setBusy(true);
        try {
            await updateDoc(doc(db, 'reviews', review.id), { status });
            await recomputePackageRating(review.packageId);
            await fetchReviews();
            addToast(
                status === 'approved' ? '✅ Review approved & published!' :
                status === 'rejected' ? 'Review rejected (hidden from site).' :
                'Review updated.',
                status === 'approved' ? 'success' : 'warning', 3500
            );
        } catch (err) {
            addToast('Action failed. Try again.', 'error');
        } finally { setBusy(false); }
    };

    const handleDelete = async (review) => {
        if (!window.confirm(`Permanently delete this review by ${review.userName}? This cannot be undone.`)) return;
        setBusy(true);
        try {
            await deleteDoc(doc(db, 'reviews', review.id));
            await recomputePackageRating(review.packageId);
            await fetchReviews();
            addToast('Review deleted.', 'warning', 3000);
        } catch (err) {
            addToast('Failed to delete.', 'error');
        } finally { setBusy(false); }
    };

    const openEdit = (review) => {
        setEditing(review);
        setEditForm({ rating: review.rating, title: review.title || '', review: review.review || '' });
    };

    const saveEdit = async () => {
        setBusy(true);
        try {
            await updateDoc(doc(db, 'reviews', editing.id), {
                rating: Number(editForm.rating),
                title: editForm.title.trim(),
                review: editForm.review.trim(),
            });
            if (editing.status === 'approved') await recomputePackageRating(editing.packageId);
            setEditing(null);
            await fetchReviews();
            addToast('Review updated successfully.', 'success', 3000);
        } catch (err) {
            addToast('Failed to save changes.', 'error');
        } finally { setBusy(false); }
    };

    const filtered = reviews.filter(r => (r.status || 'pending') === activeTab);
    const counts = {
        pending: reviews.filter(r => (r.status || 'pending') === 'pending').length,
        approved: reviews.filter(r => r.status === 'approved').length,
        rejected: reviews.filter(r => r.status === 'rejected').length,
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Star className="text-yellow-400" /> Package Reviews
                </h3>
                <p className="text-slate-400 text-sm">Approve, edit, or remove customer reviews before they appear on the site.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 flex-wrap">
                {STATUS_TABS.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${activeTab === tab.key ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}>
                            <Icon size={16} className={tab.color} /> {tab.label}
                            <span className="ml-1 px-2 py-0.5 rounded-full bg-black/30 text-xs">{counts[tab.key]}</span>
                        </button>
                    );
                })}
            </div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-400" size={32} /></div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-slate-500">
                    <Star size={48} className="mx-auto mb-4 text-slate-700" />
                    No {activeTab} reviews.
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filtered.map(review => (
                        <div key={review.id} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="flex gap-1 mb-1">
                                        {[1,2,3,4,5].map(s => (
                                            <Star key={s} size={15} className={s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'} />
                                        ))}
                                    </div>
                                    <p className="font-bold text-white text-sm">{review.userName}</p>
                                    <p className="text-xs text-slate-500">{review.packageTitle}</p>
                                </div>
                                <span className="text-xs text-slate-600">
                                    {review.createdAt?.toDate?.()?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) || ''}
                                </span>
                            </div>

                            {/* Body */}
                            {review.title && <p className="font-semibold text-white text-sm mb-1">{review.title}</p>}
                            <p className="text-slate-300 text-sm mb-3 whitespace-pre-line">{review.review}</p>

                            {/* Photos */}
                            {review.photos && review.photos.length > 0 && (
                                <div className="flex gap-2 flex-wrap mb-3">
                                    {review.photos.map((p, i) => (
                                        <img key={i} src={p} alt="" onClick={() => setPhotoModal(p)}
                                            className="w-16 h-16 object-cover rounded-lg border border-white/10 cursor-pointer hover:opacity-80" />
                                    ))}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 flex-wrap pt-3 border-t border-white/5">
                                {activeTab !== 'approved' && (
                                    <button disabled={busy} onClick={() => setStatus(review, 'approved')}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600/15 hover:bg-green-600/25 text-green-400 border border-green-600/20 rounded-lg text-xs font-medium transition-colors disabled:opacity-50">
                                        <Check size={13} /> Approve
                                    </button>
                                )}
                                {activeTab !== 'rejected' && (
                                    <button disabled={busy} onClick={() => setStatus(review, 'rejected')}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600/15 hover:bg-orange-600/25 text-orange-400 border border-orange-600/20 rounded-lg text-xs font-medium transition-colors disabled:opacity-50">
                                        <X size={13} /> Reject
                                    </button>
                                )}
                                <button disabled={busy} onClick={() => openEdit(review)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 border border-blue-600/20 rounded-lg text-xs font-medium transition-colors disabled:opacity-50">
                                    <Edit2 size={13} /> Edit
                                </button>
                                <button disabled={busy} onClick={() => handleDelete(review)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/15 hover:bg-red-600/25 text-red-400 border border-red-600/20 rounded-lg text-xs font-medium transition-colors disabled:opacity-50">
                                    <Trash2 size={13} /> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            {editing && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
                        <div className="flex justify-between items-center p-5 border-b border-white/10">
                            <h3 className="text-white font-bold">Edit Review</h3>
                            <button onClick={() => setEditing(null)} className="p-2 hover:bg-white/10 rounded-full"><X size={18} className="text-slate-400" /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs text-slate-400 mb-2">Rating</label>
                                <div className="flex gap-2">
                                    {[1,2,3,4,5].map(s => (
                                        <button key={s} type="button" onClick={() => setEditForm(f => ({ ...f, rating: s }))}>
                                            <Star size={28} className={s <= editForm.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1.5">Title</label>
                                <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1.5">Review</label>
                                <textarea value={editForm.review} onChange={e => setEditForm(f => ({ ...f, review: e.target.value }))}
                                    rows={4} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm resize-none" />
                            </div>
                        </div>
                        <div className="p-5 border-t border-white/10 flex gap-3 justify-end">
                            <button onClick={() => setEditing(null)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-sm border border-white/10">Cancel</button>
                            <button onClick={saveEdit} disabled={busy} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50">
                                {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Photo viewer */}
            {photoModal && (
                <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/90 p-4" onClick={() => setPhotoModal(null)}>
                    <img src={photoModal} alt="" className="max-w-full max-h-[90vh] rounded-xl" />
                    <button className="absolute top-6 right-6 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center"><X size={20} className="text-white" /></button>
                </div>
            )}
        </div>
    );
};

export default AdminPackageReviews;
