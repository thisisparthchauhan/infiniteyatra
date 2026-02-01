import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, MapPin, Image as ImageIcon, Loader, Check } from 'lucide-react';
import { collection, addDoc, updateDoc, doc, serverTimestamp, Timestamp, getDoc } from 'firebase/firestore';
// import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // REMOVED
import { db } from '../firebase';
import { uploadMultipleToCloudinary } from '../services/cloudinary';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const CreateStoryModal = ({ onClose, onStoryCreated, storyToEdit = null }) => {
    const { currentUser } = useAuth();
    const { showToast } = useToast();
    const [authorIdentity, setAuthorIdentity] = useState('Parth Chauhan (Founder)');
    const isAdmin = currentUser?.email === 'chauhanparth165@gmail.com';

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        location: '',
        description: '',
        tags: []
    });
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Categories State
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const docRef = doc(db, 'settings', 'storyCategories');
                const docSnap = await import('firebase/firestore').then(mod => mod.getDoc(docRef));
                if (docSnap.exists() && docSnap.data().categories) {
                    setCategories(docSnap.data().categories);
                } else {
                    // Fallback default categories
                    setCategories([
                        { id: 'trek', label: 'Trek', emoji: '🏔' },
                        { id: 'spiritual', label: 'Spiritual', emoji: '🛕' },
                        { id: 'solo', label: 'Solo', emoji: '🧍' },
                        { id: 'friends', label: 'With Friends', emoji: '🫂' },
                        { id: 'difficult', label: 'Difficult', emoji: '🌧' },
                        { id: 'life-changing', label: 'Life-changing', emoji: '🌅' },
                        { id: 'self-discovery', label: 'Self-discovery', emoji: '🧠' },
                        { id: 'safety', label: 'Safety lesson', emoji: '🛡' }
                    ]);
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
            } finally {
                setLoadingCategories(false);
            }
        };

        fetchCategories();
    }, []);

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

            // Set Author Identity for Admin
            if (storyToEdit.authorName === 'Infinite Yatra') {
                setAuthorIdentity('Infinite Yatra');
            } else if (storyToEdit.authorName === 'Parth Chauhan (Founder)') {
                setAuthorIdentity('Parth Chauhan (Founder)');
            }
        }
    }, [storyToEdit]);

    // Helper Functions
    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + existingImages.length + imageFiles.length > 5) {
            showToast('Maximum 5 images allowed', 'error');
            return;
        }

        const newFiles = [...imageFiles, ...files];
        setImageFiles(newFiles);

        // Create previews
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setImagePreviews([...imagePreviews, ...newPreviews]);
    };

    const removeNewImage = (index) => {
        const newFiles = imageFiles.filter((_, i) => i !== index);
        const newPreviews = imagePreviews.filter((_, i) => i !== index);
        setImageFiles(newFiles);
        setImagePreviews(newPreviews);
    };

    const removeExistingImage = (index) => {
        const newImages = existingImages.filter((_, i) => i !== index);
        setExistingImages(newImages);
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

            let overrideTimestamp = null;
            if (isAdmin && formData.customDate) {
                overrideTimestamp = Timestamp.fromDate(new Date(formData.customDate + 'T12:00:00'));
            }

            let finalAuthorName = isAdmin ? authorIdentity : (currentUser.displayName || 'Anonymous');

            // Try to use First Name + Last Name from user profile if available
            if (!isAdmin && currentUser) {
                if (currentUser.firstName || currentUser.lastName) {
                    finalAuthorName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
                } else if (currentUser.name) {
                    finalAuthorName = currentUser.name;
                }
            }

            if (!finalAuthorName) finalAuthorName = 'Anonymous';

            const storyData = {
                title: formData.title,
                location: formData.location,
                description: formData.description,
                tags: formData.tags,
                imageUrl: finalImages.length > 0 ? finalImages[0] : '',
                images: finalImages,
                status: 'pending',
                isFeatured: isAdmin && storyToEdit ? storyToEdit.isFeatured : false,
                updatedAt: serverTimestamp(),
                authorName: finalAuthorName
            };

            if (overrideTimestamp) {
                storyData.createdAt = overrideTimestamp;
            }

            if (storyToEdit) {
                // Update existing
                await updateDoc(doc(db, 'travelStories', storyToEdit.id), storyData);
                // Success handled by state
            } else {
                // Create new
                await addDoc(collection(db, 'travelStories'), {
                    ...storyData,
                    authorId: currentUser.uid,
                    authorName: finalAuthorName,
                    authorEmail: currentUser.email,
                    likes: 0,
                    comments: 0,
                    views: 0,
                    createdAt: overrideTimestamp || serverTimestamp(),
                    slug: formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4),
                });
                // Success handled by state
            }

            setSuccess(true);
            setTimeout(() => {
                onStoryCreated();
                onClose();
            }, 2500);
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
                {success ? (
                    <div className="p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200 }}
                            className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-500/20"
                        >
                            <Check size={48} className="text-white" strokeWidth={3} />
                        </motion.div>
                        <motion.h3
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-2xl font-bold text-white mb-2"
                        >
                            {storyToEdit ? 'Experience Updated!' : 'Experience Shared!'}
                        </motion.h3>
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-slate-400"
                        >
                            Thank you for contributing to Infinite Yatra.
                        </motion.p>
                    </div>
                ) : (
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
                                {loadingCategories ? (
                                    <span className="text-slate-500 text-sm">Loading tags...</span>
                                ) : (categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => {
                                            // Construct the tag string: "Emoji Name"
                                            const tagString = `${cat.emoji} ${cat.label}`;
                                            const newTags = formData.tags.includes(tagString)
                                                ? formData.tags.filter(t => t !== tagString)
                                                : [...formData.tags, tagString];
                                            setFormData({ ...formData, tags: newTags });
                                        }}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${formData.tags.includes(`${cat.emoji} ${cat.label}`)
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                                            : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
                                            }`}
                                    >
                                        {cat.emoji} {cat.label}
                                    </button>
                                )))}
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

                        {/* ADMIN ONLY: Author Identity & Date Picker */}
                        {isAdmin && (
                            <div className="space-y-4">
                                {/* Author Identity */}
                                <div className="p-4 bg-blue-900/20 rounded-xl border border-blue-500/20">
                                    <label className="block text-sm font-bold text-blue-400 mb-3">
                                        ✍️ Admin: Publish As
                                    </label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="authorIdentity"
                                                value="Parth Chauhan (Founder)"
                                                checked={authorIdentity === 'Parth Chauhan (Founder)'}
                                                onChange={(e) => setAuthorIdentity(e.target.value)}
                                                className="w-4 h-4 text-blue-500 bg-white/5 border-white/20 focus:ring-blue-500"
                                            />
                                            <span className="text-white text-sm">Parth Chauhan (Founder)</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="authorIdentity"
                                                value="Infinite Yatra"
                                                checked={authorIdentity === 'Infinite Yatra'}
                                                onChange={(e) => setAuthorIdentity(e.target.value)}
                                                className="w-4 h-4 text-blue-500 bg-white/5 border-white/20 focus:ring-blue-500"
                                            />
                                            <span className="text-white text-sm">Infinite Yatra</span>
                                        </label>
                                    </div>
                                </div>


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
                )}
            </motion.div>
        </motion.div>
    );
};

export default CreateStoryModal;
