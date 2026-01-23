import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, MapPin, Image as ImageIcon, Loader } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
// import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // REMOVED
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const CreateStoryModal = ({ onClose, onStoryCreated }) => {
    const [formData, setFormData] = useState({
        title: '',
        location: '',
        description: '',
        tags: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const { currentUser } = useAuth();
    const { showToast } = useToast();

    // Cloudinary Config
    const CLOUD_NAME = "infiniteyatra";
    const UPLOAD_PRESET = "infinite_unsigned";

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                showToast('Image size should be less than 5MB', 'error');
                return;
            }

            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!currentUser) {
            showToast('Please login to share your story', 'error');
            return;
        }

        if (!formData.title || !formData.description) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        setLoading(true);

        try {
            let imageUrl = '';

            // Upload image if selected (Cloudinary)
            if (imageFile) {
                try {
                    const uploadData = new FormData();
                    uploadData.append("file", imageFile);
                    uploadData.append("upload_preset", UPLOAD_PRESET);

                    const response = await fetch(
                        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
                        {
                            method: "POST",
                            body: uploadData,
                        }
                    );

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error?.message || "Image upload failed");
                    }

                    const data = await response.json();
                    imageUrl = data.secure_url;
                } catch (storageError) {
                    console.error("Storage Error:", storageError);
                    showToast(`Image upload failed: ${storageError.message}`, 'error');
                    setLoading(false);
                    return;
                }
            }

            // Create story document
            const storyData = {
                title: formData.title,
                location: formData.location,
                description: formData.description,
                tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
                imageUrl,
                authorId: currentUser.uid,
                authorName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
                authorEmail: currentUser.email,
                likes: 0,
                comments: 0,
                views: 0,
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, 'travelStories'), storyData);

            showToast('Story shared successfully! 🎉', 'success');
            onStoryCreated();
            onClose();
        } catch (error) {
            console.error('Error creating story:', error);
            showToast(`Failed: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-200 px-8 py-6 flex items-center justify-between rounded-t-3xl z-10">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900">Share Your Journey</h2>
                        <p className="text-slate-600 mt-1">Inspire others with your travel story</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-3">
                            Cover Image
                        </label>
                        <div className="relative">
                            {imagePreview ? (
                                <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-slate-200">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setImageFile(null);
                                            setImagePreview(null);
                                        }}
                                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <label className="block aspect-video rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 transition-colors cursor-pointer bg-slate-50 hover:bg-blue-50/50">
                                    <div className="h-full flex flex-col items-center justify-center gap-3">
                                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                                            <ImageIcon size={28} className="text-blue-600" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-slate-900 font-semibold">Click to upload image</p>
                                            <p className="text-slate-500 text-sm mt-1">PNG, JPG up to 5MB</p>
                                        </div>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-3">
                            Story Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g., My Amazing Trek to Kedarkantha"
                            className="w-full px-5 py-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-slate-900 placeholder-slate-400"
                            required
                        />
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-3">
                            Location
                        </label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="e.g., Uttarakhand, India"
                                className="w-full pl-12 pr-5 py-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-slate-900 placeholder-slate-400"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-3">
                            Your Story <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Share your experience, tips, and memorable moments..."
                            rows={6}
                            className="w-full px-5 py-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-slate-900 placeholder-slate-400 resize-none"
                            required
                        />
                        <p className="text-sm text-slate-500 mt-2">
                            {formData.description.length} characters
                        </p>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-3">
                            Tags
                        </label>
                        <input
                            type="text"
                            value={formData.tags}
                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                            placeholder="e.g., trekking, adventure, mountains (comma separated)"
                            className="w-full px-5 py-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-slate-900 placeholder-slate-400"
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-4 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader size={20} className="animate-spin" />
                                    Sharing...
                                </>
                            ) : (
                                <>
                                    <Upload size={20} />
                                    Share Story
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

export default CreateStoryModal;
