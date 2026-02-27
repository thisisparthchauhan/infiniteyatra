import React, { useState, useEffect } from 'react';
import {
    collection,
    query,
    orderBy,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';
// import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'; // REMOVED
import { uploadToCloudinary } from '../services/cloudinary';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
    Star,
    Trash2,
    Edit,
    Plus,
    X,
    Upload,
    MapPin,
    Image as ImageIcon,
    Loader,
    Eye,
    Heart,
    MessageCircle,
    CheckCircle,
    XCircle
} from 'lucide-react';

const AdminBlogManagement = () => {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingStory, setEditingStory] = useState(null);
    const { currentUser } = useAuth();
    const { showToast } = useToast();

    useEffect(() => {
        fetchStories();
    }, []);

    const fetchStories = async () => {
        try {
            const storiesRef = collection(db, 'travelStories');
            const q = query(storiesRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);

            const storiesData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setStories(storiesData);
        } catch (error) {
            console.error('Error fetching stories:', error);
            showToast('Failed to load stories', 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleFeatured = async (storyId, currentStatus) => {
        try {
            const storyRef = doc(db, 'travelStories', storyId);
            await updateDoc(storyRef, {
                isFeatured: !currentStatus,
                isAdmin: !currentStatus // Mark as admin content when featured
            });

            setStories(stories.map(story =>
                story.id === storyId
                    ? { ...story, isFeatured: !currentStatus, isAdmin: !currentStatus }
                    : story
            ));

            showToast(
                !currentStatus ? 'Story featured successfully!' : 'Story unfeatured',
                'success'
            );
        } catch (error) {
            console.error('Error toggling featured:', error);
            showToast('Failed to update story', 'error');
        }
    };

    const deleteStory = async (storyId, imageUrl) => {
        if (!window.confirm('Are you sure you want to delete this story?')) return;

        try {
            // NOTE: Image deletion from Cloudinary (client-side unsigned) is restricted.
            // We just delete the reference in Firestore. The image will remain in Cloudinary.
            /*
            if (imageUrl) {
               // ... (Firebase Storage deletion removed)
            }
            */

            // Delete document from Firestore
            await deleteDoc(doc(db, 'travelStories', storyId));

            setStories(stories.filter(story => story.id !== storyId));
            showToast('Story deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting story:', error);
            showToast('Failed to delete story', 'error');
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900">Travel Stories Management</h2>
                    <p className="text-slate-600 mt-2">Manage travel stories and featured content</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                    <Plus size={20} />
                    Create Featured Story
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-600 font-semibold text-sm">Total Stories</p>
                            <p className="text-3xl font-bold text-blue-900 mt-1">{stories.length}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                            <Eye className="text-white" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-amber-600 font-semibold text-sm">Featured</p>
                            <p className="text-3xl font-bold text-amber-900 mt-1">
                                {stories.filter(s => s.isFeatured || s.isAdmin).length}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center">
                            <Star className="text-white" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-600 font-semibold text-sm">Community</p>
                            <p className="text-3xl font-bold text-purple-900 mt-1">
                                {stories.filter(s => !s.isFeatured && !s.isAdmin).length}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                            <MessageCircle className="text-white" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-600 font-semibold text-sm">Total Likes</p>
                            <p className="text-3xl font-bold text-red-900 mt-1">
                                {stories.reduce((sum, s) => sum + (s.likes || 0), 0)}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                            <Heart className="text-white" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Stories Table */}
            {loading ? (
                <div className="text-center py-12">
                    <Loader className="animate-spin mx-auto text-blue-600" size={40} />
                    <p className="text-slate-600 mt-4">Loading stories...</p>
                </div>
            ) : stories.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl">
                    <p className="text-slate-600">No stories yet</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="text-left py-4 px-4 font-semibold text-slate-700">Story</th>
                                <th className="text-left py-4 px-4 font-semibold text-slate-700">Author</th>
                                <th className="text-left py-4 px-4 font-semibold text-slate-700">Stats</th>
                                <th className="text-left py-4 px-4 font-semibold text-slate-700">Status</th>
                                <th className="text-left py-4 px-4 font-semibold text-slate-700">Date</th>
                                <th className="text-right py-4 px-4 font-semibold text-slate-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stories.map(story => (
                                <tr key={story.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-4">
                                            {story.imageUrl ? (
                                                <img
                                                    src={story.imageUrl}
                                                    alt={story.title}
                                                    loading="lazy"
                                                    className="w-16 h-16 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 rounded-lg bg-slate-200 flex items-center justify-center">
                                                    <ImageIcon size={24} className="text-slate-400" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-semibold text-slate-900 line-clamp-1">{story.title}</p>
                                                <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                                                    <MapPin size={12} />
                                                    {story.location || 'No location'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <p className="text-slate-900 font-medium">{story.authorName || 'Anonymous'}</p>
                                        <p className="text-sm text-slate-500">{story.authorEmail}</p>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm text-slate-600 flex items-center gap-1">
                                                <Heart size={14} className="text-red-500" />
                                                {story.likes || 0} likes
                                            </span>
                                            <span className="text-sm text-slate-600 flex items-center gap-1">
                                                <Eye size={14} className="text-blue-500" />
                                                {story.views || 0} views
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        {story.isFeatured || story.isAdmin ? (
                                            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-semibold">
                                                <Star size={12} />
                                                Featured
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-semibold">
                                                Community
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-4 px-4">
                                        <p className="text-sm text-slate-600">{formatDate(story.createdAt)}</p>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => toggleFeatured(story.id, story.isFeatured || story.isAdmin)}
                                                className={`p-2 rounded-lg transition-colors ${story.isFeatured || story.isAdmin
                                                    ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                    }`}
                                                title={story.isFeatured || story.isAdmin ? 'Unfeature' : 'Feature'}
                                            >
                                                <Star size={18} fill={story.isFeatured || story.isAdmin ? 'currentColor' : 'none'} />
                                            </button>
                                            <button
                                                onClick={() => deleteStory(story.id, story.imageUrl)}
                                                className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Modal - You can integrate the CreateStoryModal component here */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-slate-900">Create Featured Story</h3>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-slate-600 mb-4">
                            Use the "Share Your Story" button on the main page to create a new story,
                            then feature it from this admin panel.
                        </p>
                        <p className="text-sm text-blue-600 bg-blue-50 p-4 rounded-lg">
                            <strong>Tip:</strong> Featured stories appear first on the homepage with a special badge!
                        </p>
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold"
                        >
                            Got it!
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBlogManagement;
