import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Check, X, Eye, Edit2, MapPin, Calendar, Clock, ArrowRight, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CreateStoryModal from '../../CreateStoryModal';
import StoryCategoryManager from './StoryCategoryManager';

const AdminExperiences = () => {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStory, setSelectedStory] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [activeTab, setActiveTab] = useState('review'); // review, categories
    const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all

    useEffect(() => {
        if (activeTab === 'review') {
            fetchStories();
        }
    }, [activeTab]);

    // Helper: Status Color
    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        }
    };

    // Fetch Stories
    const fetchStories = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'travelStories'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            setStories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error fetching stories:", error);
        } finally {
            setLoading(false);
        }
    };

    // Update Status
    const handleUpdateStatus = async (storyId, newStatus) => {
        try {
            const storyRef = doc(db, 'travelStories', storyId);
            await updateDoc(storyRef, { status: newStatus });

            // Optimization: Update local state instead of refetching
            setStories(prev => prev.map(s => s.id === storyId ? { ...s, status: newStatus } : s));

            if (activeTab === 'review' && selectedStory?.id === storyId) {
                setSelectedStory(prev => ({ ...prev, status: newStatus }));
                // Close modal on success if desired, or keep open
                setSelectedStory(null);
            }
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status");
        }
    };

    // Filter Stories
    const filteredStories = stories.filter(s => {
        if (filter === 'all') return true;
        // Default status is 'pending' if undefined
        const status = s.status || 'pending';
        return status === filter;
    });

    // AI Insight Panel Component (Internal)
    const AiInsightPanel = ({ story }) => {
        if (!story) return null;

        // Mock AI analysis for now
        const wordCount = story.description?.split(/\s+/).length || 0;
        const hasImages = story.imageUrl || (story.images && story.images.length > 0);
        const sentiment = wordCount > 50 ? "Detailed & Engaging" : "Short & Sweet";
        const score = Math.min(100, (wordCount / 200 * 50) + (hasImages ? 50 : 0));

        return (
            <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <Shield size={16} className="text-blue-400" />
                    <h4 className="text-sm font-bold text-blue-300 uppercase tracking-wider">AI Content Analysis</h4>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-black/40 rounded-lg p-3 border border-white/5">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-1">Quality Score</div>
                        <div className="text-xl font-bold text-white">{Math.round(score)}/100</div>
                    </div>
                    <div className="bg-black/40 rounded-lg p-3 border border-white/5">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-1">Sentiment</div>
                        <div className="text-sm font-medium text-white">{sentiment}</div>
                    </div>
                    <div className="bg-black/40 rounded-lg p-3 border border-white/5">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-1">Uniqueness</div>
                        <div className="text-sm font-medium text-white">High</div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Experience Manager</h1>
                    <p className="text-slate-400">Manage user stories and system categories</p>
                </div>
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 w-fit">
                    <button
                        onClick={() => setActiveTab('review')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'review'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Review Stories
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'categories'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Manage Categories
                    </button>
                </div>
            </div>

            {activeTab === 'categories' ? (
                <StoryCategoryManager />
            ) : (
                <>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-white">Story Review Queue</h2>
                        <div className="flex gap-2">
                            {['pending', 'approved', 'rejected', 'all'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${filter === f
                                        ? 'bg-white text-black shadow-lg shadow-white/10'
                                        : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-20 text-slate-500">Loading...</div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredStories.map(story => (
                                <div key={story.id} className="bg-[#0A0A0A] rounded-xl shadow-lg border border-white/10 overflow-hidden flex flex-col group hover:border-white/20 transition-colors">
                                    {/* Card Image */}
                                    <div className="h-48 bg-white/5 relative">
                                        {story.imageUrl ? (
                                            <img src={story.imageUrl} alt={story.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                                                <MapPin size={32} />
                                            </div>
                                        )}
                                        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getStatusColor(story.status || 'pending')}`}>
                                            {story.status || 'pending'}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-5 flex-1 flex flex-col">
                                        <h3 className="font-bold text-lg text-white mb-1 line-clamp-1">{story.title}</h3>
                                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                                            <MapPin size={14} />
                                            <span className="truncate">{story.location}</span>
                                        </div>
                                        <p className="text-slate-400 text-sm line-clamp-3 mb-4 flex-1">
                                            {story.description}
                                        </p>

                                        <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-auto">
                                            <div className="text-xs text-slate-500">
                                                by {story.authorName} • {new Date(story.createdAt?.toDate ? story.createdAt.toDate() : story.createdAt).toLocaleDateString()}
                                            </div>
                                            <button
                                                onClick={() => setSelectedStory(story)}
                                                className="text-white hover:text-blue-400 text-sm font-semibold flex items-center gap-1 transition-colors"
                                            >
                                                Review <ArrowRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Review Modal */}
                    <AnimatePresence>
                        {selectedStory && (
                            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-end">
                                <motion.div
                                    initial={{ x: "100%" }}
                                    animate={{ x: 0 }}
                                    exit={{ x: "100%" }}
                                    className="w-full max-w-2xl h-full bg-[#0A0A0A] shadow-2xl overflow-y-auto p-8 border-l border-white/10"
                                >
                                    <div className="flex items-center justify-between mb-8">
                                        <h2 className="text-2xl font-bold text-white">Review Experience</h2>
                                        <button onClick={() => setSelectedStory(null)} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                                            <X size={24} />
                                        </button>
                                    </div>

                                    {/* AI Insight */}
                                    <AiInsightPanel story={selectedStory} />

                                    {/* Main Content */}
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Experience Title</label>
                                            <h3 className="text-xl font-bold text-white mt-1">{selectedStory.title}</h3>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Images</label>
                                            <div className="grid grid-cols-3 gap-3 mt-2">
                                                {selectedStory.images && selectedStory.images.length > 0 ? (
                                                    selectedStory.images.map((img, i) => (
                                                        <img key={i} src={img} className="rounded-lg h-32 w-full object-cover border border-white/10" />
                                                    ))
                                                ) : selectedStory.imageUrl ? (
                                                    <img src={selectedStory.imageUrl} className="rounded-lg h-32 w-full object-cover border border-white/10" />
                                                ) : (
                                                    <div className="h-32 bg-white/5 rounded-lg flex items-center justify-center text-slate-600">No images</div>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Story</label>
                                            <p className="text-slate-300 leading-relaxed mt-2 p-4 bg-white/5 rounded-xl whitespace-pre-line border border-white/10">
                                                {selectedStory.description}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tags</label>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {selectedStory.tags?.map(tag => (
                                                        <span key={tag} className="px-3 py-1 bg-blue-900/30 text-blue-300 border border-blue-500/20 rounded-full text-xs font-semibold">{tag}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Author</label>
                                                <p className="mt-1 font-medium text-white">{selectedStory.authorName}</p>
                                                <p className="text-sm text-slate-500">{selectedStory.authorEmail}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="sticky bottom-0 bg-[#0A0A0A] border-t border-white/10 pt-6 mt-8 flex flex-col gap-3">
                                        <div className="flex gap-4">
                                            {/* EDIT BUTTON */}
                                            <button
                                                onClick={() => setShowEditModal(true)}
                                                className="flex-1 py-4 rounded-xl border border-blue-500/30 text-blue-400 font-bold hover:bg-blue-500/10 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Edit2 size={20} /> Edit Story
                                            </button>

                                            {/* REJECT BUTTON */}
                                            <button
                                                onClick={() => handleUpdateStatus(selectedStory.id, 'rejected')}
                                                className="flex-1 py-4 rounded-xl border border-red-500/30 text-red-400 font-bold hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <X size={20} /> Reject
                                            </button>
                                        </div>

                                        {/* APPROVE BUTTON */}
                                        <button
                                            onClick={() => handleUpdateStatus(selectedStory.id, 'approved')}
                                            className="w-full py-4 rounded-xl bg-white text-black font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 shadow-xl shadow-white/5"
                                        >
                                            <Check size={20} /> Approve & Publish
                                        </button>

                                        {/* CANCEL REVIEW BUTTON */}
                                        <button
                                            onClick={() => setSelectedStory(null)}
                                            className="w-full py-2 text-slate-500 hover:text-slate-300 font-medium text-sm transition-colors"
                                        >
                                            Cancel Review
                                        </button>
                                    </div>

                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* EDIT MODAL */}
                    {showEditModal && selectedStory && (
                        <CreateStoryModal
                            storyToEdit={selectedStory}
                            onClose={() => setShowEditModal(false)}
                            onStoryCreated={() => {
                                fetchStories();
                                setShowEditModal(false);
                                setSelectedStory(null); // Close review panel after edit to refresh context or keep it? 
                                // Better to close it to force refresh or re-select.
                            }}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default AdminExperiences;
