import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, MapPin, Image as ImageIcon, Loader } from 'lucide-react';
import { collection, addDoc, updateDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
// import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // REMOVED
import { db } from '../firebase';
import { uploadMultipleToCloudinary } from '../services/cloudinary';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const CreateStoryModal = ({ onClose, onStoryCreated, storyToEdit = null }) => {
    const [formData, setFormData] = useState({
        title: '',
        location: '',
        description: '',
        tags: []
    });
    const [imageFiles, setImageFiles] = useState([]); // New files
    const [imagePreviews, setImagePreviews] = useState([]); // Previews for new files
    const [existingImages, setExistingImages] = useState([]); // URLs of existing images
    const [loading, setLoading] = useState(false);
    const { currentUser } = useAuth();
    const { showToast } = useToast();

    useEffect(() => {
        if (storyToEdit) {
            setFormData({
                title: storyToEdit.title || '',
                location: storyToEdit.location || '',
                description: storyToEdit.description || '',
                tags: storyToEdit.tags || [],
                customDate: storyToEdit.createdAt && storyToEdit.createdAt.toDate
                    ? storyToEdit.createdAt.toDate().toISOString().split('T')[0]
                    : ''
            });
            setExistingImages(storyToEdit.images || (storyToEdit.imageUrl ? [storyToEdit.imageUrl] : []));
        }
    }, [storyToEdit]);

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            const totalImages = existingImages.length + imageFiles.length + files.length;
            if (totalImages > 5) {
                showToast('You can upload a maximum of 5 images', 'error');
                return;
            }

            const validFiles = [];

            files.forEach(file => {
                if (file.size > 5 * 1024 * 1024) { // 5MB limit
                    showToast(`Image ${file.name} is too large (max 5MB)`, 'error');
                } else {
                    validFiles.push(file);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setImagePreviews(prev => [...prev, reader.result]);
                    };
                    reader.readAsDataURL(file);
                }
            });

            setImageFiles(prev => [...prev, ...validFiles]);
        }
    };

    const removeNewImage = (index) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingImage = (index) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!currentUser) {
            showToast('Please login to share your story', 'error');
            return;
        }

        if (imageFiles.length === 0 && existingImages.length === 0) {
            showToast('Please add at least one image', 'error');
            return;
        }

        setLoading(true);

        try {
            // Validation: Minimum 300 characters
            if (formData.description.length < 300) {
                showToast(`Your experience is too short. Please write at least 300 characters (currently ${formData.description.length}).`, 'error');
                setLoading(false);
                return;
            }

            let newImageUrls = [];
            // Upload new images if selected
            if (imageFiles.length > 0) {
                try {
                    newImageUrls = await uploadMultipleToCloudinary(imageFiles);
                } catch (storageError) {
                    console.error("Storage Error:", storageError);
                    showToast(`Image upload failed: ${storageError.message}`, 'error');
                    setLoading(false);
                    return;
                }
            }

            const finalImages = [...existingImages, ...newImageUrls];

            const isAdmin = currentUser?.email === 'chauhanparth165@gmail.com';

            let overrideTimestamp = null;
            if (isAdmin && formData.customDate) {
                overrideTimestamp = Timestamp.fromDate(new Date(formData.customDate + 'T12:00:00'));
            }

            const storyData = {
                title: formData.title,
                location: formData.location,
                description: formData.description,
                tags: formData.tags,
                imageUrl: finalImages.length > 0 ? finalImages[0] : '',
                images: finalImages,
                status: isAdmin ? 'approved' : 'pending',
                isFeatured: isAdmin && storyToEdit ? storyToEdit.isFeatured : false,
                updatedAt: serverTimestamp()
            };

            if (overrideTimestamp) {
                storyData.createdAt = overrideTimestamp;
            }

            if (storyToEdit) {
                // Update existing
                await updateDoc(doc(db, 'travelStories', storyToEdit.id), storyData);
                showToast('✨ Experience updated. It will be reviewed shortly.', 'success');
            } else {
                // Create new
                await addDoc(collection(db, 'travelStories'), {
                    ...storyData,
                    authorId: currentUser.uid,
                    authorName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
                    authorEmail: currentUser.email,
                    likes: 0,
                    comments: 0,
                    views: 0,
                    createdAt: overrideTimestamp || serverTimestamp(),
                    slug: formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4),
                });
                showToast('✨ Thank you for sharing. Your experience will be published after review.', 'success');
            }

            onStoryCreated();
            onClose();
        } catch (error) {
            console.error('Error saving story:', error);
            showToast('Failed to save story. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="bg-[#0A0A0A] border border-white/10 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header and Close Button */}
                <div className="sticky top-0 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/10 px-8 py-6 flex items-center justify-between rounded-t-3xl z-10">
                    <div>
                        <h2 className="text-3xl font-bold text-white">{storyToEdit ? 'Edit Your Journey' : 'Share Your Journey'}</h2>
                        <p className="text-slate-400 mt-1">Inspire others with your travel story</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-slate-300 hover:text-white border border-white/5"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-semibold text-white mb-1">
                            Cover Image
                        </label>
                        <p className="text-xs text-slate-400 mb-3">Upload a moment, not a perfect photo.</p>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                            {/* Existing Images */}
                            {existingImages.map((img, index) => (
                                <div key={`existing-${index}`} className="relative aspect-video rounded-xl overflow-hidden border border-white/10 group">
                                    <img src={img} alt={`Existing ${index + 1}`} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeExistingImage(index)}
                                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}

                            {/* New Previews */}
                            {imagePreviews.map((preview, index) => (
                                <div key={`new-${index}`} className="relative aspect-video rounded-xl overflow-hidden border border-white/10 group">
                                    <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeNewImage(index)}
                                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}

                            {existingImages.length + imageFiles.length < 5 && (
                                <label className="relative aspect-video rounded-xl border-2 border-dashed border-white/10 hover:border-blue-500 transition-colors cursor-pointer bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center gap-2 group">
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                                        <ImageIcon size={20} className="text-slate-400 group-hover:text-blue-400" />
                                    </div>
                                    <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-200">Add Image</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-semibold text-white mb-3">
                            Experience Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="The night I felt fearless in the Himalayas"
                            className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all text-white placeholder-slate-500"
                            required
                        />
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-semibold text-white mb-3">
                            Location
                        </label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="e.g., Uttarakhand, India"
                                className="w-full pl-12 pr-5 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all text-white placeholder-slate-500"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-white mb-3">
                            Your Experience <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder={`Start anywhere. You can talk about:

• Why you decided to go
• One moment you’ll never forget
• What scared or surprised you
• What this journey taught you
• Something future travelers should know`}
                            rows={8}
                            className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all text-white placeholder-slate-500 resize-none"
                            required
                        />
                        <p className="text-sm text-slate-500 mt-2">
                            {formData.description.length} characters
                        </p>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-semibold text-white mb-3">
                            Feelings & Journey Type
                        </label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {['🏔 Trek', '🛕 Spiritual', '🧍 Solo', '🫂 With Friends', '🌧 Difficult', '🌅 Life-changing', '🧠 Self-discovery', '🛡 Safety lesson'].map(tag => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => {
                                        const newTags = formData.tags.includes(tag)
                                            ? formData.tags.filter(t => t !== tag)
                                            : [...formData.tags, tag];
                                        setFormData({ ...formData, tags: newTags });
                                    }}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${formData.tags.includes(tag)
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
                                        }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                        <input
                            type="text"
                            placeholder="Add custom tags..."
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const val = e.target.value.trim();
                                    if (val && !formData.tags.includes(val)) {
                                        setFormData({ ...formData, tags: [...formData.tags, val] });
                                        e.target.value = '';
                                    }
                                }
                            }}
                            className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 outline-none transition-all text-white placeholder-slate-500"
                        />
                    </div>

                    {/* ADMIN ONLY: Date Picker */}
                    {currentUser?.email === 'chauhanparth165@gmail.com' && (
                        <div className="p-4 bg-red-900/20 rounded-xl border border-red-500/20">
                            <label className="block text-sm font-bold text-red-400 mb-2">
                                🔧 Admin: Override Publish Date
                            </label>
                            <input
                                type="date"
                                value={formData.customDate || ''}
                                onChange={(e) => setFormData({ ...formData, customDate: e.target.value })}
                                className="w-full px-4 py-3 rounded-lg bg-black/40 border border-red-500/30 text-white focus:border-red-500 outline-none placeholder-white/30"
                            />
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-4 rounded-xl border border-white/10 text-slate-300 font-semibold hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:shadow-xl hover:shadow-blue-900/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader size={20} className="animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Upload size={20} />
                                    {storyToEdit ? 'Update Experience' : 'Share Experience'}
                                </>
                            )}
                        </button>
                    </div>
                    <p className="text-xs text-center text-slate-500 px-4">
                        We review experiences to keep Infinite Yatra authentic, safe, and respectful.
                    </p>
                </form>
            </motion.div>
        </motion.div>
    );
};

export default CreateStoryModal;
