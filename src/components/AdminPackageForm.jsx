import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Upload, Image as ImageIcon } from 'lucide-react';
// Firebase Storage imports removed
// import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
// import { storage } from '../firebase'; 
import { uploadMultipleToCloudinary, uploadToCloudinary } from '../services/cloudinary';

const AdminPackageForm = ({ initialData, onSave, onCancel }) => {
    // ... [Rest of state remains same]

    const [formData, setFormData] = useState({
        title: '',
        image: '', // Main Thumbnail
        location: '',
        pickupDrop: '',
        price: '',
        discount: '',
        duration: '',
        difficulty: 'Moderate',
        bestTime: '',
        maxGroupSize: '',
        category: 'trek',
        description: '',
        isVisible: true,
        highlights: [''],
        inclusions: [''],
        exclusions: [''],
        goodToKnow: [''],
        whoIsThisFor: [''],
        thingsToCarry: [''],
        faqs: [
            { question: '', answer: '' }
        ],
        itinerary: [
            { day: 1, title: '', description: '', activities: [''] }
        ],
        images: [], // Array of URLs
        ...initialData
    });

    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);

    // Handle Basic Fields
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Handle Simple Lists (Highlights, Inclusions, Exclusions)
    const handleListChange = (field, index, value) => {
        const newList = [...formData[field]];
        newList[index] = value;
        setFormData(prev => ({ ...prev, [field]: newList }));
    };

    const addListItem = (field) => {
        setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
    };

    const removeListItem = (field, index) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }));
    };

    // Handle Itinerary
    const handleItineraryChange = (index, field, value) => {
        const newItinerary = [...formData.itinerary];
        newItinerary[index] = { ...newItinerary[index], [field]: value };
        setFormData(prev => ({ ...prev, itinerary: newItinerary }));
    };

    const addItineraryDay = () => {
        setFormData(prev => ({
            ...prev,
            itinerary: [
                ...prev.itinerary,
                { day: prev.itinerary.length + 1, title: '', description: '', activities: [''] }
            ]
        }));
    };

    const removeItineraryDay = (index) => {
        setFormData(prev => ({
            ...prev,
            itinerary: prev.itinerary.filter((_, i) => i !== index)
        }));
    };

    // Itinerary Activities
    const handleActivityChange = (dayIndex, activityIndex, value) => {
        const newItinerary = [...formData.itinerary];
        const newActivities = [...newItinerary[dayIndex].activities];
        newActivities[activityIndex] = value;
        newItinerary[dayIndex].activities = newActivities;
        setFormData(prev => ({ ...prev, itinerary: newItinerary }));
    };

    const addActivity = (dayIndex) => {
        const newItinerary = [...formData.itinerary];
        newItinerary[dayIndex].activities.push('');
        setFormData(prev => ({ ...prev, itinerary: newItinerary }));
    };

    const removeActivity = (dayIndex, activityIndex) => {
        const newItinerary = [...formData.itinerary];
        newItinerary[dayIndex].activities = newItinerary[dayIndex].activities.filter((_, i) => i !== activityIndex);
        setFormData(prev => ({ ...prev, itinerary: newItinerary }));
    };

    // Handle FAQs
    const handleFaqChange = (index, field, value) => {
        const newFaqs = [...formData.faqs];
        newFaqs[index] = { ...newFaqs[index], [field]: value };
        setFormData(prev => ({ ...prev, faqs: newFaqs }));
    };

    const addFaq = () => {
        setFormData(prev => ({
            ...prev,
            faqs: [...prev.faqs, { question: '', answer: '' }]
        }));
    };

    const removeFaq = (index) => {
        setFormData(prev => ({
            ...prev,
            faqs: prev.faqs.filter((_, i) => i !== index)
        }));
    };

    // Image Upload (Cloudinary)
    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Validation: Check file sizes (Max 5MB)
        const invalidFiles = files.filter(file => file.size > 5 * 1024 * 1024);
        if (invalidFiles.length > 0) {
            alert(`File size too large: ${invalidFiles[0].name}. Max allowed size is 5MB.`);
            return;
        }

        setUploading(true);
        setUploadError(null);

        try {
            // Use the centralized utility service
            const uploadedUrls = await uploadMultipleToCloudinary(files);

            setFormData(prev => ({
                ...prev,
                images: [...(prev.images || []), ...uploadedUrls]
            }));
        } catch (error) {
            console.error("UPLOAD ERROR:", error);
            setUploadError(`Upload Failed: ${error.message}`);
            alert(`Failed to upload: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    // Thumbnail Upload Helper
    const handleThumbnailUpload = async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setUploadError("Thumbnail size must be less than 5MB");
            return;
        }

        setUploading(true);
        setUploadError(null);

        try {
            const url = await uploadToCloudinary(file);
            setFormData(prev => ({ ...prev, image: url }));
        } catch (error) {
            console.error("THUMBNAIL UPLOAD ERROR:", error);
            setUploadError(`Thumbnail Upload Failed: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Clean up empty fields
        const cleanedData = {
            ...formData,
            price: Number(formData.price),
            priceDisplay: `₹${Number(formData.price).toLocaleString('en-IN')}`,  // Sync priceDisplay
            maxGroupSize: Number(formData.maxGroupSize),
            highlights: formData.highlights.filter(i => i.trim()),
            inclusions: formData.inclusions.filter(i => i.trim()),
            exclusions: formData.exclusions.filter(i => i.trim()),
            goodToKnow: formData.goodToKnow.filter(i => i.trim()),
            whoIsThisFor: formData.whoIsThisFor.filter(i => i.trim()),
            thingsToCarry: formData.thingsToCarry.filter(i => i.trim()),
            faqs: formData.faqs.filter(f => f.question.trim() && f.answer.trim()),
            itinerary: formData.itinerary.map(day => ({
                ...day,
                activities: day.activities.filter(a => a.trim())
            }))
        };

        onSave(cleanedData);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0f172a] w-full max-w-4xl h-[90vh] rounded-2xl border border-white/10 shadow-2xl flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                    <h2 className="text-2xl font-bold text-white">
                        {initialData ? 'Edit Package' : 'Create New Package'}
                    </h2>
                    <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="text-slate-400 hover:text-white" />
                    </button>
                </div>

                {/* Scrollable Form Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                    {/* Basic Info Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-blue-400">Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Package Title *</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Location *</label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Pickup/Drop Location</label>
                                <input
                                    type="text"
                                    name="pickupDrop"
                                    value={formData.pickupDrop}
                                    onChange={handleChange}
                                    placeholder="e.g. Dehradun / Delhi"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Price (₹) *</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Discount Text (Optional)</label>
                                <input
                                    type="text"
                                    name="discount"
                                    placeholder="e.g. 10% OFF"
                                    value={formData.discount}
                                    onChange={handleChange}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Category</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="trek">Trek</option>
                                    <option value="spiritual">Spiritual</option>
                                    <option value="international">International</option>
                                    <option value="leisure">Leisure</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Visibility</label>
                                <div className="flex items-center gap-3 h-[42px]">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="isVisible"
                                            checked={formData.isVisible}
                                            onChange={handleChange}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                        <span className="ml-3 text-sm font-medium text-white">
                                            {formData.isVisible ? 'Visible to Public' : 'Hidden (Draft)'}
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <input type="text" name="duration" placeholder="Duration (e.g. 5 Days)" value={formData.duration} onChange={handleChange} className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white" />
                            <input type="text" name="difficulty" placeholder="Difficulty" value={formData.difficulty} onChange={handleChange} className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white" />
                            <input type="text" name="bestTime" placeholder="Best Time" value={formData.bestTime} onChange={handleChange} className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white" />
                            <input type="number" name="maxGroupSize" placeholder="Max Group Size" value={formData.maxGroupSize} onChange={handleChange} className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white" />
                        </div>

                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            />
                        </div>
                    </div>

                    {/* Thumbnail Image Section */}
                    <div className="space-y-4 pt-6 border-t border-white/10">
                        <h3 className="text-lg font-bold text-blue-400">Thumbnail Image (Main Display)</h3>
                        <div className="flex items-start gap-6">
                            {formData.image ? (
                                <div className="relative group w-48 aspect-[4/5] rounded-lg overflow-hidden border border-white/10">
                                    <img src={formData.image} alt="Thumbnail" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <label className="w-48 aspect-[4/5] border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all">
                                    <Upload className="text-slate-400 mb-2" />
                                    <span className="text-xs text-slate-400 text-center px-4">
                                        Upload Main Thumbnail
                                    </span>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} disabled={uploading} />
                                </label>
                            )}
                            <div className="flex-1 text-sm text-slate-400">
                                <p>This is the main image displayed on the card in the "Destinations" list.</p>
                                <p className="mt-2">Recommended aspect ratio: 4:5 (Portrait)</p>
                            </div>
                        </div>
                    </div>

                    {/* Images Section (Gallery) */}
                    <div className="space-y-4 pt-6 border-t border-white/10">
                        <h3 className="text-lg font-bold text-blue-400">Images</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {formData.images?.map((url, index) => (
                                <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-white/10">
                                    <img src={url} alt={`Package ${index}`} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            <label className="border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all aspect-square">
                                <Upload className="text-slate-400 mb-2" />
                                <span className="text-xs text-slate-400">
                                    {uploading ? 'Uploading...' : 'Upload Images'}
                                </span>
                                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                            </label>
                        </div>
                        {uploadError && (
                            <div className="text-red-500 text-sm mt-2 bg-red-500/10 p-2 rounded border border-red-500/20">
                                {uploadError}
                            </div>
                        )}
                    </div>

                    {/* Lists Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-white/10">
                        {/* Highlights */}
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-300">Highlights</label>
                            {formData.highlights.map((item, index) => (
                                <div key={index} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={item}
                                        onChange={(e) => handleListChange('highlights', index, e.target.value)}
                                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
                                        placeholder="Highlight point"
                                    />
                                    <button onClick={() => removeListItem('highlights', index)} className="text-slate-500 hover:text-red-400"><X size={16} /></button>
                                </div>
                            ))}
                            <button onClick={() => addListItem('highlights')} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                <Plus size={14} /> Add Highlight
                            </button>
                        </div>

                        {/* Inclusions */}
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-300">Inclusions</label>
                            {formData.inclusions.map((item, index) => (
                                <div key={index} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={item}
                                        onChange={(e) => handleListChange('inclusions', index, e.target.value)}
                                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
                                        placeholder="Inclusion point"
                                    />
                                    <button onClick={() => removeListItem('inclusions', index)} className="text-slate-500 hover:text-red-400"><X size={16} /></button>
                                </div>
                            ))}
                            <button onClick={() => addListItem('inclusions')} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                <Plus size={14} /> Add Inclusion
                            </button>
                        </div>

                        {/* Exclusions */}
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-300">Exclusions</label>
                            {formData.exclusions.map((item, index) => (
                                <div key={index} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={item}
                                        onChange={(e) => handleListChange('exclusions', index, e.target.value)}
                                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
                                        placeholder="Exclusion point"
                                    />
                                    <button onClick={() => removeListItem('exclusions', index)} className="text-slate-500 hover:text-red-400"><X size={16} /></button>
                                </div>
                            ))}
                            <button onClick={() => addListItem('exclusions')} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                <Plus size={14} /> Add Exclusion
                            </button>
                        </div>

                        {/* Good to Know */}
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-300">Good To Know</label>
                            {formData.goodToKnow.map((item, index) => (
                                <div key={index} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={item}
                                        onChange={(e) => handleListChange('goodToKnow', index, e.target.value)}
                                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
                                        placeholder="Mobile network, ATM..."
                                    />
                                    <button onClick={() => removeListItem('goodToKnow', index)} className="text-slate-500 hover:text-red-400"><X size={16} /></button>
                                </div>
                            ))}
                            <button onClick={() => addListItem('goodToKnow')} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                <Plus size={14} /> Add Item
                            </button>
                        </div>

                        {/* Who is this for? */}
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-300">Who is this for?</label>
                            {formData.whoIsThisFor.map((item, index) => (
                                <div key={index} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={item}
                                        onChange={(e) => handleListChange('whoIsThisFor', index, e.target.value)}
                                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
                                        placeholder="Beginners, Families..."
                                    />
                                    <button onClick={() => removeListItem('whoIsThisFor', index)} className="text-slate-500 hover:text-red-400"><X size={16} /></button>
                                </div>
                            ))}
                            <button onClick={() => addListItem('whoIsThisFor')} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                <Plus size={14} /> Add Item
                            </button>
                        </div>

                        {/* Things to Carry */}
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-300">Things to Carry</label>
                            {formData.thingsToCarry.map((item, index) => (
                                <div key={index} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={item}
                                        onChange={(e) => handleListChange('thingsToCarry', index, e.target.value)}
                                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
                                        placeholder="Trekking shoes, Warm clothes..."
                                    />
                                    <button onClick={() => removeListItem('thingsToCarry', index)} className="text-slate-500 hover:text-red-400"><X size={16} /></button>
                                </div>
                            ))}
                            <button onClick={() => addListItem('thingsToCarry')} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                <Plus size={14} /> Add Item
                            </button>
                        </div>

                        {/* FAQs */}
                        <div className="col-span-1 md:col-span-3 space-y-4 pt-4 mt-2 border-t border-white/10">
                            <h3 className="text-md font-bold text-blue-400">Frequently Asked Questions</h3>
                            {formData.faqs.map((faq, index) => (
                                <div key={index} className="flex flex-col gap-2 bg-white/5 p-3 rounded-lg border border-white/5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-500 font-bold uppercase">Question {index + 1}</span>
                                        <button onClick={() => removeFaq(index)} className="text-slate-500 hover:text-red-400"><Trash2 size={14} /></button>
                                    </div>
                                    <input
                                        type="text"
                                        value={faq.question}
                                        onChange={(e) => handleFaqChange(index, 'question', e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-medium"
                                        placeholder="Type question here..."
                                    />
                                    <textarea
                                        value={faq.answer}
                                        onChange={(e) => handleFaqChange(index, 'answer', e.target.value)}
                                        rows={2}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300"
                                        placeholder="Type answer here..."
                                    />
                                </div>
                            ))}
                            <button onClick={addFaq} className="w-full py-2 border border-dashed border-white/20 rounded-lg text-slate-400 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center gap-2">
                                <Plus size={16} /> Add FAQ
                            </button>
                        </div>
                    </div>

                    {/* Itinerary Section */}
                    <div className="space-y-4 pt-6 border-t border-white/10">
                        <h3 className="text-lg font-bold text-blue-400">Itinerary</h3>
                        <div className="space-y-4">
                            {formData.itinerary.map((day, dayIndex) => (
                                <div key={dayIndex} className="bg-white/5 p-4 rounded-xl border border-white/10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <input
                                                type="number"
                                                value={day.day}
                                                onChange={(e) => handleItineraryChange(dayIndex, 'day', Number(e.target.value))}
                                                className="w-20 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white"
                                                placeholder="Day"
                                            />
                                            <input
                                                type="text"
                                                value={day.title}
                                                onChange={(e) => handleItineraryChange(dayIndex, 'title', e.target.value)}
                                                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white font-bold"
                                                placeholder="Day Title"
                                            />
                                        </div>
                                        <button onClick={() => removeItineraryDay(dayIndex)} className="text-slate-500 hover:text-red-400 p-2">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        <textarea
                                            value={day.description}
                                            onChange={(e) => handleItineraryChange(dayIndex, 'description', e.target.value)}
                                            placeholder="Day Description"
                                            rows={2}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                        />

                                        {/* Activities */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase">Activities</label>
                                            {day.activities.map((activity, actIndex) => (
                                                <div key={actIndex} className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={activity}
                                                        onChange={(e) => handleActivityChange(dayIndex, actIndex, e.target.value)}
                                                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                                                        placeholder="Activity"
                                                    />
                                                    <button onClick={() => removeActivity(dayIndex, actIndex)} className="text-slate-500 hover:text-red-400"><X size={14} /></button>
                                                </div>
                                            ))}
                                            <button onClick={() => addActivity(dayIndex)} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                                <Plus size={12} /> Add Activity
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addItineraryDay}
                                className="w-full py-3 border border-dashed border-white/20 rounded-xl text-slate-400 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus size={20} /> Add Day
                            </button>
                        </div>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-white/10 bg-black/20 flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 border border-white/10 text-slate-300 font-medium rounded-lg hover:bg-white/5 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={uploading}
                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        <Save size={18} />
                        {uploading ? 'Processing...' : 'Save Package'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminPackageForm;
