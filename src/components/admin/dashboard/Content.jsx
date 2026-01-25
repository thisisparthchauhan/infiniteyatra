import React, { useEffect, useState } from 'react';
import { Image, CheckCircle, XCircle, Trash2, Eye, Filter, Loader } from 'lucide-react';
import { collection, getDocs, updateDoc, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../../firebase';

const Content = () => {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        fetchStories();
    }, []);

    const fetchStories = async () => {
        setLoading(true);
        try {
            // Using query with orderBy might require an index if mixed with where(), 
            // for now, let's fetch all and filter locally for simplicity in this V2 prototype, 
            // or confirm index exists. Let's do client-side sort for safer "no-index" dev experience.
            const q = query(collection(db, 'travel_stories'));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt)
            }));

            // Sort Descending
            data.sort((a, b) => b.createdAt - a.createdAt);

            setStories(data);
        } catch (error) {
            console.error("Error fetching stories:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await updateDoc(doc(db, 'travel_stories', id), {
                status: newStatus,
                moderatedAt: new Date()
            });
            // Optimistic update
            setStories(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
        } catch (error) {
            console.error("Error updating story:", error);
            alert("Failed to update status");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this story permanently?")) return;
        try {
            await deleteDoc(doc(db, 'travel_stories', id));
            setStories(prev => prev.filter(s => s.id !== id));
        } catch (error) {
            console.error("Error deleting story:", error);
            alert("Failed to delete story");
        }
    };

    const filteredStories = stories.filter(s => {
        if (filter === 'all') return true;
        return s.status === filter;
    });

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center text-slate-400">
                <Loader className="animate-spin mr-2" /> Loading Content...
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white/5 p-6 rounded-2xl border border-white/10 gap-4">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Image className="text-pink-400" /> Content Moderation
                    </h3>
                    <p className="text-slate-400 text-sm">Review user travel stories and photos.</p>
                </div>
                <div className="flex gap-2">
                    {['all', 'pending', 'approved', 'rejected'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border ${filter === f
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-black/20 text-slate-400 border-white/5 hover:bg-white/5'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* GALLERY GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStories.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-slate-500 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                        No stories found in this category.
                    </div>
                ) : filteredStories.map(story => (
                    <div key={story.id} className="glass-card group rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all flex flex-col">

                        {/* Image Preview */}
                        <div
                            className="relative h-48 bg-black/50 cursor-pointer overflow-hidden"
                            onClick={() => setSelectedImage(story.imageUrl)}
                        >
                            {story.imageUrl ? (
                                <img
                                    src={story.imageUrl}
                                    alt="User Story"
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-600">
                                    <Image size={24} /> No Image
                                </div>
                            )}

                            {/* Status Badge */}
                            <div className="absolute top-3 right-3">
                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border backdrop-blur-md shadow-lg ${story.status === 'approved' ? 'bg-green-500/20 text-green-400 border-green-500/20' :
                                        story.status === 'rejected' ? 'bg-red-500/20 text-red-400 border-red-500/20' :
                                            'bg-yellow-500/20 text-yellow-400 border-yellow-500/20'
                                    }`}>
                                    {story.status || 'Pending'}
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 flex-1 flex flex-col">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-xs font-bold text-white">
                                    {story.userName?.[0] || 'U'}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">{story.userName || 'Anonymous'}</p>
                                    <p className="text-[10px] text-slate-500">{story.createdAt?.toLocaleDateString()} • {story.location || 'Unknown Loc'}</p>
                                </div>
                            </div>

                            <p className="text-slate-300 text-sm italic mb-4 line-clamp-3 flex-1">
                                "{story.caption}"
                            </p>

                            {/* Actions */}
                            <div className="pt-3 border-t border-white/5 flex gap-2">
                                <button
                                    onClick={() => handleStatusUpdate(story.id, 'approved')}
                                    className="flex-1 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-xs font-bold transition-colors border border-green-500/10 flex items-center justify-center gap-1"
                                    title="Approve"
                                >
                                    <CheckCircle size={14} /> Approve
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate(story.id, 'rejected')}
                                    className="flex-1 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-lg text-xs font-bold transition-colors border border-yellow-500/10 flex items-center justify-center gap-1"
                                    title="Reject"
                                >
                                    <XCircle size={14} /> Reject
                                </button>
                                <button
                                    onClick={() => handleDelete(story.id)}
                                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/10"
                                    title="Delete"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Lightbox */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setSelectedImage(null)}
                >
                    <img
                        src={selectedImage}
                        className="max-w-full max-h-full rounded-lg shadow-2xl border border-white/10"
                        alt="Zoomed"
                    />
                    <button className="absolute top-8 right-8 text-white/50 hover:text-white">
                        <XCircle size={40} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default Content;
