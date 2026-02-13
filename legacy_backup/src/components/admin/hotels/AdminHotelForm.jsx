import React, { useState } from 'react';
import { X, Plus, Trash2, Save, Upload, Image as ImageIcon, CheckCircle2, XCircle, Info, BedDouble, Calendar } from 'lucide-react';
import { uploadMultipleToCloudinary, uploadToCloudinary } from '../../../services/cloudinary';
import PricingSimulator from './PricingSimulator';

const AdminHotelForm = ({ initialData, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        // 1. Basic Information
        name: '',
        location: '', // City/State
        address: '', // Nearby landmark/Full address
        category: '3 Star', // Star Category
        price: '', // Starting Price
        costPrice: '',
        tokenPrice: '',
        discount: '',
        isVisible: true,

        // 2. Images
        image: '', // Thumbnail
        images: [], // Gallery

        ...initialData,
        // Ensure arrays are initialized if editing old data
        hotelType: initialData?.hotelType || [],
        rooms: (initialData?.rooms || []).map(r => ({ ...r, pricing: r.pricing || [] })),
        highlights: initialData?.highlights || [],
        inclusions: initialData?.inclusions || [],
        exclusions: initialData?.exclusions || [],
        goodToKnow: initialData?.goodToKnow || [],
        whoIsThisFor: initialData?.whoIsThisFor || [],
        thingsToCarry: initialData?.thingsToCarry || [],
        faqs: initialData?.faqs || [],
        policies: { ...initialData?.policies }
    });

    const [uploading, setUploading] = useState(false);

    // --- GENERIC HANDLERS ---
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: { ...prev[parent], [child]: value }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

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

    // --- IMAGE HANDLERS ---
    const handleThumbnailUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const url = await uploadToCloudinary(file);
            setFormData(prev => ({ ...prev, image: url }));
        } catch (err) {
            console.error(err);
            alert("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleGalleryUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        setUploading(true);
        try {
            const urls = await uploadMultipleToCloudinary(files);
            setFormData(prev => ({ ...prev, images: [...prev.images, ...urls] }));
        } catch (err) {
            console.error(err);
            alert("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    // --- ROOM MANAGEMENT ---
    const addRoom = () => {
        setFormData(prev => ({
            ...prev,
            rooms: [
                ...prev.rooms,
                { id: Date.now(), name: '', occupancy: 2, price: '', costPrice: '', count: 1, description: '', images: [] }
            ]
        }));
    };

    const updateRoom = (index, field, value) => {
        const newRooms = [...formData.rooms];
        newRooms[index] = { ...newRooms[index], [field]: value };
        setFormData(prev => ({ ...prev, rooms: newRooms }));
    };

    const removeRoom = (index) => {
        if (!window.confirm("Delete this room type?")) return;
        setFormData(prev => ({
            ...prev,
            rooms: prev.rooms.filter((_, i) => i !== index)
        }));
    };

    // --- SUBMISSION ---
    const handleSubmit = (e) => {
        e.preventDefault();

        // Manual Validation
        const requiredFields = ['name', 'location', 'price', 'category'];
        const missing = requiredFields.filter(field => !formData[field]);
        if (missing.length > 0) {
            alert(`Please fill in all required fields: ${missing.join(', ')}`);
            return;
        }

        // Clean & Sanitize Data
        const cleaned = {
            ...formData,
            // Ensure numbers are numbers, fallback to 0 if NaN/empty
            price: Number(formData.price) || 0,
            costPrice: Number(formData.costPrice) || 0,
            tokenPrice: Number(formData.tokenPrice) || 0,

            rooms: formData.rooms.map(r => ({
                ...r,
                price: Number(r.price) || 0,
                costPrice: Number(r.costPrice) || 0,
                occupancy: Number(r.occupancy) || 1, // Default occupancy 1
                count: Number(r.count) || 0
            })),

            // Filter empty strings from lists
            highlights: (formData.highlights || []).filter(s => s && s.trim()),
            inclusions: (formData.inclusions || []).filter(s => s && s.trim()),
            exclusions: (formData.exclusions || []).filter(s => s && s.trim()),
            goodToKnow: (formData.goodToKnow || []).filter(s => s && s.trim()),
            whoIsThisFor: (formData.whoIsThisFor || []).filter(s => s && s.trim()),
            thingsToCarry: (formData.thingsToCarry || []).filter(s => s && s.trim()),
            faqs: (formData.faqs || []).filter(f => f.question && f.question.trim() && f.answer && f.answer.trim()),

            // Ensure policies object exists
            policies: {
                cancellation: formData.policies?.cancellation || '',
                refund: formData.policies?.refund || '',
                child: formData.policies?.child || '',
                pet: formData.policies?.pet || ''
            }
        };

        // Remove undefined keys (Firestore doesn't like undefined)
        Object.keys(cleaned).forEach(key => cleaned[key] === undefined && delete cleaned[key]);

        onSave(cleaned);
    };

    // Common Input Styles
    const inputClass = "w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all";
    const labelClass = "block text-sm text-slate-400 mb-1 font-medium";

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0f172a] w-full max-w-5xl h-[95vh] rounded-2xl border border-white/10 shadow-2xl flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            {initialData ? 'Edit Hotel' : 'New Hotel Property'}
                        </h2>
                        <p className="text-slate-400 text-sm">Detailed inventory management</p>
                    </div>
                    <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="text-slate-400 hover:text-white" />
                    </button>
                </div>

                {/* Content - Wrapped in Form */}
                <form id="hotelForm" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">

                    {/* SECTION 1: BASIC INFO */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2">
                            <Info size={18} /> Basic Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column */}
                            <div>
                                <label className={labelClass}>Hotel Name *</label>
                                <input name="name" value={formData.name} onChange={handleChange} className={inputClass} required placeholder="e.g. The Grand Hotel" />
                            </div>
                            <div>
                                <label className={labelClass}>Category *</label>
                                <select name="category" value={formData.category} onChange={handleChange} className={inputClass}>
                                    <option value="3 Star">3 Star</option>
                                    <option value="4 Star">4 Star</option>
                                    <option value="5 Star">5 Star</option>
                                    <option value="Resort">Resort</option>
                                    <option value="Homestay">Homestay</option>
                                    <option value="Villa">Villa</option>
                                    <option value="Cottage">Cottage</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Starting Price (₹) *</label>
                                <input type="number" name="price" value={formData.price} onChange={handleChange} className={inputClass} required />
                            </div>
                            <div>
                                <label className={labelClass}>Google Maps Link</label>
                                <input name="googleMapsUrl" value={formData.googleMapsUrl || ''} onChange={handleChange} className={inputClass} placeholder="https://maps.app.goo.gl/..." />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>City / Location *</label>
                        <input name="location" value={formData.location} onChange={handleChange} className={inputClass} required placeholder="e.g. Shimla" />
                    </div>
                    <div>
                        <label className={labelClass}>Full Address / Landmark</label>
                        <textarea name="address" value={formData.address} onChange={handleChange} className={`${inputClass} h-[124px] resize-none`} placeholder="Full address including zip code" />
                    </div>

                    <div>
                        <label className={labelClass}>Visibility</label>
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
                                {formData.isVisible ? 'Publicly Visible on Website' : 'Hidden (Draft)'}
                            </span>
                        </label>
                    </div>

                    {/* Hotel Type Tags */}
                    <div>
                        <label className={labelClass}>Hotel Type Tags</label>
                        <div className="flex flex-wrap gap-2">
                            {['Luxury', 'Budget', 'Trek Stay', 'Spiritual', 'Business', 'Honeymoon', 'Family', 'Couple Friendly'].map(tag => (
                                <button
                                    type="button"
                                    key={tag}
                                    onClick={() => {
                                        const current = formData.hotelType || [];
                                        const create = current.includes(tag)
                                            ? current.filter(t => t !== tag)
                                            : [...current, tag];
                                        setFormData(prev => ({ ...prev, hotelType: create }));
                                    }}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${formData.hotelType.includes(tag)
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20'
                                        : 'bg-black/40 border-white/10 text-slate-400 hover:border-white/30 hover:text-white'
                                        }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    <hr className="border-white/10" />

                    {/* SECTION 2: IMAGES */}
                    <div className="space-y-4 pt-6 border-t border-white/10">
                        <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2">
                            <ImageIcon size={18} /> Gallery & Cover
                        </h3>

                        {/* Thumbnail Image Section */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-bold text-blue-300">Thumbnail Image (Main Display)</h4>
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
                        <div className="space-y-2 pt-4">
                            <h4 className="text-sm font-bold text-blue-300">Images (Gallery)</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {formData.images?.map((url, index) => (
                                    <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-white/10">
                                        <img src={url} alt={`Gallery ${index}`} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => setFormData(p => ({ ...p, images: p.images.filter((_, i) => i !== index) }))}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={14} />
                                        </button>
                                        {/* Reordering Controls */}
                                        <div className="absolute bottom-1 left-1 right-1 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                            {index > 0 && (
                                                <button type="button" onClick={() => {
                                                    const newImages = [...formData.images];
                                                    [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
                                                    setFormData(p => ({ ...p, images: newImages }));
                                                }} className="p-1 bg-black/60 text-white rounded hover:bg-blue-600">
                                                    &lt;
                                                </button>
                                            )}
                                            {index < formData.images.length - 1 && (
                                                <button type="button" onClick={() => {
                                                    const newImages = [...formData.images];
                                                    [newImages[index + 1], newImages[index]] = [newImages[index], newImages[index + 1]];
                                                    setFormData(p => ({ ...p, images: newImages }));
                                                }} className="p-1 bg-black/60 text-white rounded hover:bg-blue-600">
                                                    &gt;
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <label className="border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all aspect-square">
                                    <Upload className="text-slate-400 mb-2" />
                                    <span className="text-xs text-slate-400">
                                        {uploading ? 'Uploading...' : 'Upload Images'}
                                    </span>
                                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleGalleryUpload} disabled={uploading} />
                                </label>
                            </div>
                        </div>
                    </div>

                    <hr className="border-white/10" />

                    {/* SECTION 3: ROOM TYPES */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2">
                                <BedDouble size={18} /> Room Types
                            </h3>
                            <button type="button" onClick={addRoom} className="px-3 py-1.5 bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2 border border-blue-600/20">
                                <Plus size={16} /> Add Room Type
                            </button>
                        </div>

                        <div className="space-y-4">
                            {formData.rooms.map((room, idx) => (
                                <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-5 relative group hover:border-white/20 transition-all">
                                    <button type="button" onClick={() => removeRoom(idx)} className="absolute top-4 right-4 text-slate-500 hover:text-red-500"><Trash2 size={18} /></button>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                        <div className="md:col-span-2">
                                            <label className={labelClass}>Room Name</label>
                                            <input value={room.name} onChange={e => updateRoom(idx, 'name', e.target.value)} className={inputClass} placeholder="e.g. Deluxe Room with Balcony" />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Max Occupancy</label>
                                            <input type="number" value={room.occupancy} onChange={e => updateRoom(idx, 'occupancy', e.target.value)} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Inventory Count</label>
                                            <input type="number" value={room.count} onChange={e => updateRoom(idx, 'count', e.target.value)} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Base Price (₹)</label>
                                            <input type="number" value={room.price} onChange={e => updateRoom(idx, 'price', e.target.value)} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Cost Price (₹)</label>
                                            <input type="number" value={room.costPrice} onChange={e => updateRoom(idx, 'costPrice', e.target.value)} className={`${inputClass} border-purple-500/30`} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Room Description</label>
                                        <textarea value={room.description} onChange={e => updateRoom(idx, 'description', e.target.value)} className={`${inputClass} h-20 resize-none`} placeholder="Amenities specific to this room..." />
                                    </div>

                                    {/* Room Images */}
                                    <div className="space-y-4 pt-4 border-t border-white/10">

                                        {/* Room Thumbnail */}
                                        <div className="space-y-2">
                                            <label className={labelClass}>Room Thumbnail (Main Image)</label>
                                            {room.image ? (
                                                <div className="relative group w-48 aspect-[4/5] rounded-lg overflow-hidden border border-white/10">
                                                    <img src={room.image} alt="Room Thumbnail" className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => updateRoom(idx, 'image', '')}
                                                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="w-48 aspect-[4/5] border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all">
                                                    <Upload className="text-slate-400 mb-2" />
                                                    <span className="text-xs text-slate-400 text-center px-4">
                                                        Add Thumb
                                                    </span>
                                                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        setUploading(true);
                                                        try {
                                                            const url = await uploadToCloudinary(file);
                                                            updateRoom(idx, 'image', url);
                                                        } catch (err) {
                                                            console.error(err);
                                                            alert("Upload failed");
                                                        } finally {
                                                            setUploading(false);
                                                        }
                                                    }} disabled={uploading} />
                                                </label>
                                            )}
                                        </div>

                                        {/* Room Gallery */}
                                        <div className="space-y-2 pt-2">
                                            <label className={labelClass}>Room Gallery (Reorder with arrows)</label>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {(room.images || []).map((img, imgIdx) => (
                                                    <div key={imgIdx} className="relative group aspect-square rounded-lg overflow-hidden border border-white/10">
                                                        <img src={img} className="w-full h-full object-cover" />
                                                        <button type="button" onClick={() => {
                                                            const newImages = room.images.filter((_, i) => i !== imgIdx);
                                                            updateRoom(idx, 'images', newImages);
                                                        }} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <X size={14} />
                                                        </button>
                                                        {/* Reordering Controls */}
                                                        <div className="absolute bottom-1 left-1 right-1 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {imgIdx > 0 && (
                                                                <button type="button" onClick={() => {
                                                                    const newImages = [...room.images];
                                                                    [newImages[imgIdx - 1], newImages[imgIdx]] = [newImages[imgIdx], newImages[imgIdx - 1]];
                                                                    updateRoom(idx, 'images', newImages);
                                                                }} className="p-1 bg-black/60 text-white rounded hover:bg-blue-600">
                                                                    &lt;
                                                                </button>
                                                            )}
                                                            {imgIdx < room.images.length - 1 && (
                                                                <button type="button" onClick={() => {
                                                                    const newImages = [...room.images];
                                                                    [newImages[imgIdx + 1], newImages[imgIdx]] = [newImages[imgIdx], newImages[imgIdx + 1]];
                                                                    updateRoom(idx, 'images', newImages);
                                                                }} className="p-1 bg-black/60 text-white rounded hover:bg-blue-600">
                                                                    &gt;
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                                <label className="border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all aspect-square">
                                                    <Upload className="text-slate-400 mb-2" />
                                                    <span className="text-xs text-slate-400">
                                                        Add
                                                    </span>
                                                    <input type="file" multiple accept="image/*" className="hidden" onChange={async (e) => {
                                                        const files = Array.from(e.target.files || []);
                                                        if (files.length === 0) return;
                                                        setUploading(true);
                                                        try {
                                                            const urls = await Promise.all(files.map(file => uploadToCloudinary(file)));
                                                            updateRoom(idx, 'images', [...(room.images || []), ...urls]);
                                                        } catch (err) {
                                                            console.error(err);
                                                            alert("Upload failed");
                                                        } finally {
                                                            setUploading(false);
                                                        }
                                                    }} disabled={uploading} />
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Date Specific Pricing */}
                                    <div className="mt-4 p-4 bg-black/20 rounded-lg border border-white/10">
                                        <h4 className="text-sm font-bold text-blue-300 flex items-center gap-2 mb-3">
                                            <Calendar size={14} /> Date-Specific Pricing
                                        </h4>
                                        <p className="text-xs text-slate-400 mb-3">Set custom rates for specific dates. These override the base price.</p>

                                        <div className="flex gap-2 mb-3">
                                            <input
                                                type="date"
                                                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                                                value={room.tempDate || ''}
                                                onChange={(e) => updateRoom(idx, 'tempDate', e.target.value)}
                                            />
                                            <input
                                                type="number"
                                                placeholder="Price (₹)"
                                                className="w-32 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                                                value={room.tempPrice || ''}
                                                onChange={(e) => updateRoom(idx, 'tempPrice', e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (!room.tempDate || !room.tempPrice) {
                                                        alert("Please select both a date and a price.");
                                                        return;
                                                    }
                                                    // Filter out existing entry to update
                                                    const existingFiltered = (room.pricing || []).filter(r => r.date !== room.tempDate);
                                                    const newPricing = [...existingFiltered, { date: room.tempDate, price: room.tempPrice }].sort((a, b) => new Date(a.date) - new Date(b.date));

                                                    // Update room directly
                                                    updateRoom(idx, 'pricing', newPricing);
                                                    updateRoom(idx, 'tempDate', '');
                                                    updateRoom(idx, 'tempPrice', '');
                                                }}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-colors"
                                            >
                                                Add Rate
                                            </button>
                                        </div>

                                        {/* List of active rates */}
                                        {(room.pricing && room.pricing.length > 0) ? (
                                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                                {room.pricing.map((rate, rIdx) => (
                                                    <div key={rIdx} className="flex justify-between items-center bg-white/5 px-3 py-2 rounded border border-white/5 hover:border-white/10 transition-colors">
                                                        <span className="text-sm text-slate-300 font-mono">
                                                            {new Date(rate.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </span>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-sm font-bold text-green-400">₹{parseInt(rate.price).toLocaleString()}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newPricing = room.pricing.filter((_, i) => i !== rIdx);
                                                                    updateRoom(idx, 'pricing', newPricing);
                                                                }}
                                                                className="text-slate-500 hover:text-red-500 transition-colors"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-600 italic text-center py-2">No specific rates added.</p>
                                        )}
                                    </div>

                                    {/* Dynamic Pricing Tools */}
                                    <PricingSimulator
                                        basePrice={room.price}
                                        costPrice={room.costPrice}
                                        inventory={room.count}
                                        hotelId={initialData?.id}
                                        roomId={room.id}
                                    />
                                </div >
                            ))}
                            {
                                formData.rooms.length === 0 && (
                                    <div className="text-center py-8 border border-dashed border-white/10 rounded-xl text-slate-500">
                                        No room types added yet.
                                    </div>
                                )
                            }
                        </div >
                    </div >

                    <hr className="border-white/10" />

                    {/* SECTION 4 & 5: LISTS (Highlights, Amenities) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <ListSection
                            title="Hotel Highlights"
                            data={formData.highlights}
                            onChange={(idx, val) => handleListChange('highlights', idx, val)}
                            onAdd={() => addListItem('highlights')}
                            onRemove={(idx) => removeListItem('highlights', idx)}
                            placeholder="e.g. Mountain View"
                        />
                        <ListSection
                            title="Who is this for?"
                            data={formData.whoIsThisFor}
                            onChange={(idx, val) => handleListChange('whoIsThisFor', idx, val)}
                            onAdd={() => addListItem('whoIsThisFor')}
                            onRemove={(idx) => removeListItem('whoIsThisFor', idx)}
                            placeholder="e.g. Couples, Trekkers"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <ListSection
                            title="Included Amenities"
                            data={formData.inclusions}
                            onChange={(idx, val) => handleListChange('inclusions', idx, val)}
                            onAdd={() => addListItem('inclusions')}
                            onRemove={(idx) => removeListItem('inclusions', idx)}
                            placeholder="e.g. Breakfast, WiFi"
                            icon={<CheckCircle2 className="text-green-500" size={16} />}
                        />
                        <ListSection
                            title="Not Included / Extra"
                            data={formData.exclusions}
                            onChange={(idx, val) => handleListChange('exclusions', idx, val)}
                            onAdd={() => addListItem('exclusions')}
                            onRemove={(idx) => removeListItem('exclusions', idx)}
                            placeholder="e.g. Lunch, Laundry"
                            icon={<XCircle className="text-red-500" size={16} />}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <ListSection
                            title="Good To Know"
                            data={formData.goodToKnow}
                            onChange={(idx, val) => handleListChange('goodToKnow', idx, val)}
                            onAdd={() => addListItem('goodToKnow')}
                            onRemove={(idx) => removeListItem('goodToKnow', idx)}
                            placeholder="e.g. Check-in 12PM"
                        />
                        <ListSection
                            title="Things To Carry"
                            data={formData.thingsToCarry}
                            onChange={(idx, val) => handleListChange('thingsToCarry', idx, val)}
                            onAdd={() => addListItem('thingsToCarry')}
                            onRemove={(idx) => removeListItem('thingsToCarry', idx)}
                            placeholder="e.g. Valid ID Proof"
                        />
                    </div>

                    <hr className="border-white/10" />

                    {/* SECTION 9: FAQs */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-blue-400">FAQs</h3>
                        {formData.faqs.map((faq, idx) => (
                            <div key={idx} className="flex gap-4 items-start bg-white/5 p-4 rounded-xl border border-white/10">
                                <div className="flex-1 space-y-2">
                                    <input
                                        value={faq.question}
                                        onChange={e => {
                                            const newFaqs = [...formData.faqs];
                                            newFaqs[idx].question = e.target.value;
                                            setFormData(p => ({ ...p, faqs: newFaqs }));
                                        }}
                                        className={inputClass}
                                        placeholder="Question"
                                    />
                                    <textarea
                                        value={faq.answer}
                                        onChange={e => {
                                            const newFaqs = [...formData.faqs];
                                            newFaqs[idx].answer = e.target.value;
                                            setFormData(p => ({ ...p, faqs: newFaqs }));
                                        }}
                                        className={`${inputClass} resize-none h-20 text-sm`}
                                        placeholder="Answer"
                                    />
                                </div>
                                <button type="button" onClick={() => setFormData(p => ({ ...p, faqs: p.faqs.filter((_, i) => i !== idx) }))} className="text-slate-500 hover:text-red-500 mt-2"><Trash2 size={18} /></button>
                            </div>
                        ))}
                        <button type="button" onClick={() => setFormData(p => ({ ...p, faqs: [...p.faqs, { question: '', answer: '' }] }))} className="w-full py-3 border border-dashed border-white/20 rounded-xl text-slate-400 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center gap-2">
                            <Plus size={16} /> Add FAQ
                        </button>
                    </div>

                    {/* SECTION 10: POLICIES */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-blue-400">Hotel Policies</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClass}>Cancellation Policy</label>
                                <textarea name="policies.cancellation" value={formData.policies.cancellation} onChange={handleChange} className={`${inputClass} h-24 resize-none`} />
                            </div>
                            <div>
                                <label className={labelClass}>Refund Policy</label>
                                <textarea name="policies.refund" value={formData.policies.refund} onChange={handleChange} className={`${inputClass} h-24 resize-none`} />
                            </div>
                            <div>
                                <label className={labelClass}>Child Policy</label>
                                <textarea name="policies.child" value={formData.policies.child} onChange={handleChange} className={`${inputClass} h-24 resize-none`} />
                            </div>
                            <div>
                                <label className={labelClass}>Pet Policy</label>
                                <textarea name="policies.pet" value={formData.policies.pet} onChange={handleChange} className={`${inputClass} h-24 resize-none`} />
                            </div>
                        </div>
                    </div>

                </form >

                {/* Footer */}
                < div className="p-6 border-t border-white/10 bg-black/50 backdrop-blur-md flex justify-end gap-4 rounded-b-2xl" >
                    <button onClick={onCancel} className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                        Cancel
                    </button>
                    {/* Submit via form ID trigger or just keep onClick if logic is robust. Using form="hotelForm" is cleaner. */}
                    <button type="submit" form="hotelForm" disabled={uploading} className="px-8 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2">
                        {uploading ? 'Uploading...' : <><Save size={18} /> Save Hotel</>}
                    </button>
                </div >
            </div >
        </div >
    );
};


// Helper Component for List Sections
const ListSection = ({ title, data, onChange, onAdd, onRemove, placeholder, icon }) => (
    <div className="space-y-3">
        <label className="block text-sm font-bold text-slate-300 flex items-center gap-2">
            {icon} {title}
        </label>
        {data.map((item, idx) => (
            <div key={idx} className="flex gap-2">
                <input
                    value={item}
                    onChange={e => onChange(idx, e.target.value)}
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder={placeholder}
                />
                <button type="button" onClick={() => onRemove(idx)} className="text-slate-600 hover:text-red-500 transition-colors"><X size={16} /></button>
            </div>
        ))}
        <button type="button" onClick={onAdd} className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 transition-colors">
            <Plus size={12} /> Add Item
        </button>
    </div>
);

export default AdminHotelForm;
