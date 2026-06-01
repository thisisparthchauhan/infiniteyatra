import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Upload, Image as ImageIcon } from 'lucide-react';
// Firebase Storage imports removed
// import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
// import { storage } from '../firebase'; 
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { uploadMultipleToCloudinary, uploadToCloudinary } from '../services/cloudinary';

const AdminPackageForm = ({ initialData, onSave, onCancel }) => {
    // ... [Rest of state remains same]

    const [formData, setFormData] = useState({
        title: '',
        image: '', // Main Thumbnail
        location: '',
        pickupDrop: '',
        price: '',
        tokenPrice: '',
        costPrice: '',
        discount: '',
        duration: '',
        difficulty: 'Moderate',
        bestTime: '',
        maxGroupSize: '',

        description: '',
        isVisible: true,
        highlights: [''],
        inclusions: [''],
        exclusions: [''],
        goodToKnow: [''],
        whoIsThisFor: [''],
        thingsToCarry: [''],
        cancellationPolicy: initialData?.cancellationPolicy?.length ? initialData.cancellationPolicy : [
            'Token Amount: ₹2,000 per person (Non-Refundable & Non-Transferable)',
            'More than 7 days before trip: Full refund minus token amount',
            '4–7 days before trip: 50% refund only',
            'Less than 72 hours / No Show: No refund',
        ],
        generalPolicy: initialData?.generalPolicy || 'All participants must carry valid ID proof. Follow trek leader instructions at all times. Respect local culture and environment.',
        faqs: [
            { question: '', answer: '' }
        ],
        itinerary: [
            { day: 1, title: '', description: '', activities: [''], distance: '', time: '', trekDistance: '', trekTime: '', altitude: '', stay: '', meals: '' }
        ],
        images: [], // Array of URLs
        ...initialData,
        // Ensure category is always an array
        category: initialData?.category
            ? (Array.isArray(initialData.category) ? initialData.category : [initialData.category])
            : ['trek'],
        batchDates: initialData?.batchDates || [],
        linkedHotelIds: initialData?.linkedHotelIds || [],
        linkedVehicleIds: initialData?.linkedVehicleIds || [],
        packageRoute: initialData?.packageRoute || '',
        // Pickup locations with per-location pricing
        pickupLocations: initialData?.pickupLocations || [],
        // Departure type
        departureType: initialData?.departureType || 'daily',
        minimumClients: initialData?.minimumClients || '',
        weeklyDay: initialData?.weeklyDay !== undefined ? initialData.weeklyDay : 5, // 5 = Friday default
        // Minimum persons per booking (applies to all departure types)
        minimumPersons: initialData?.minimumPersons || '',
        // Season window
        seasonStartDate: initialData?.seasonStartDate || '',
        seasonEndDate: initialData?.seasonEndDate || '',
    });

    const [allHotels, setAllHotels] = useState([]);
    const [fetchingHotels, setFetchingHotels] = useState(false);
    
    const [allVehicles, setAllVehicles] = useState([]);
    const [fetchingVehicles, setFetchingVehicles] = useState(false);
    const [vehicleSearch, setVehicleSearch] = useState('');

    const [tempBatchDate, setTempBatchDate] = useState('');
    const [tempAvailableSeats, setTempAvailableSeats] = useState('');

    // Fetch visible hotels on mount
    useEffect(() => {
        const fetchHotels = async () => {
            setFetchingHotels(true);
            try {
                // Remove orderBy to prevent Firestore Composite Index errors
                const hotelsSnap = await getDocs(query(
                    collection(db, 'hotels'),
                    where('isVisible', '==', true)
                ));
                // Sort client-side instead
                const fetchedHotels = hotelsSnap.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                
                setAllHotels(fetchedHotels);
            } catch (err) {
                console.error("Error fetching hotels:", err);
            } finally {
                setFetchingHotels(false);
            }
        };

        const fetchVehicles = async () => {
            setFetchingVehicles(true);
            try {
                // Fetch vehicles where isActive is true
                const vehiclesSnap = await getDocs(query(
                    collection(db, 'transportation'),
                    where('isActive', '==', true)
                ));
                // Sort client-side by vehicleType to avoid needing composite index
                const fetchedVehicles = vehiclesSnap.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .sort((a, b) => (a.vehicleType || '').localeCompare(b.vehicleType || ''));
                setAllVehicles(fetchedVehicles);
            } catch (err) {
                console.error("Error fetching vehicles:", err);
            } finally {
                setFetchingVehicles(false);
            }
        };

        fetchHotels();
        fetchVehicles();
    }, []);

    const toggleHotelLink = (hotelId) => {
        const current = formData.linkedHotelIds || [];
        const updated = current.includes(hotelId)
            ? current.filter(id => id !== hotelId)
            : [...current, hotelId];
        setFormData(prev => ({ ...prev, linkedHotelIds: updated }));
    };

    const toggleVehicleLink = (vehicleId) => {
        const current = formData.linkedVehicleIds || [];
        const updated = current.includes(vehicleId)
            ? current.filter(id => id !== vehicleId)
            : [...current, vehicleId];
        setFormData(prev => ({ ...prev, linkedVehicleIds: updated }));
    };

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

    // Handle Pickup Locations
    const addPickupLocation = () => {
        setFormData(prev => ({
            ...prev,
            pickupLocations: [...prev.pickupLocations, { location: '', price: '', b2bPrice: '' }]
        }));
    };
    const removePickupLocation = (index) => {
        setFormData(prev => ({
            ...prev,
            pickupLocations: prev.pickupLocations.filter((_, i) => i !== index)
        }));
    };
    const updatePickupLocation = (index, field, value) => {
        const updated = [...formData.pickupLocations];
        updated[index] = { ...updated[index], [field]: value };
        setFormData(prev => ({ ...prev, pickupLocations: updated }));
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
                { day: prev.itinerary.length + 1, title: '', description: '', activities: [''], distance: '', time: '', trekDistance: '', trekTime: '', altitude: '', stay: '', meals: '' }
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
            tokenPrice: Number(formData.tokenPrice) || 0,
            costPrice: Number(formData.costPrice),
            priceDisplay: `₹${Number(formData.price).toLocaleString('en-IN')}`,  // Sync priceDisplay
            maxGroupSize: Number(formData.maxGroupSize),
            highlights: formData.highlights.filter(i => i.trim()),
            inclusions: formData.inclusions.filter(i => i.trim()),
            exclusions: formData.exclusions.filter(i => i.trim()),
            goodToKnow: formData.goodToKnow.filter(i => i.trim()),
            whoIsThisFor: formData.whoIsThisFor.filter(i => i.trim()),
            thingsToCarry: formData.thingsToCarry.filter(i => i.trim()),
            cancellationPolicy: formData.cancellationPolicy.filter(i => i.trim()),
            generalPolicy: formData.generalPolicy?.trim() || '',
            faqs: formData.faqs.filter(f => f.question.trim() && f.answer.trim()),
            itinerary: formData.itinerary.map(day => ({
                ...day,
                activities: day.activities.filter(a => a.trim())
            })),
            linkedHotelIds: formData.linkedHotelIds || [],
            linkedVehicleIds: formData.linkedVehicleIds || [],
            packageRoute: formData.packageRoute || '',
            pickupLocations: (formData.pickupLocations || [])
                .filter(p => p.location.trim())
                .map(p => ({ location: p.location.trim(), price: Number(p.price) || 0, b2bPrice: Number(p.b2bPrice) || 0 })),
            departureType: formData.departureType || 'daily',
            minimumClients: formData.departureType === 'minimum-clients' ? (Number(formData.minimumClients) || 0) : 0,
            weeklyDay: formData.departureType === 'weekly' ? Number(formData.weeklyDay) : null,
            minimumPersons: Number(formData.minimumPersons) || 1,
            seasonStartDate: formData.seasonStartDate || '',
            seasonEndDate: formData.seasonEndDate || '',
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
                                <label className="block text-sm text-slate-400 mb-1">Selling Price (₹) *</label>
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
                                <label className="block text-sm text-slate-400 mb-1">Token Price (₹) *</label>
                                <input
                                    type="number"
                                    name="tokenPrice"
                                    value={formData.tokenPrice}
                                    onChange={handleChange}
                                    placeholder="e.g. 1000"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Cost Price (₹) *</label>
                                <input
                                    type="number"
                                    name="costPrice"
                                    value={formData.costPrice || ''}
                                    onChange={handleChange}
                                    placeholder="For profit calculation"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 outline-none"
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
                            {/* ── Pickup Locations with Per-Location Pricing ── */}
                            <div className="col-span-1 md:col-span-2 border border-white/10 rounded-xl p-4 space-y-3 bg-black/20">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-slate-300">📍 Pickup Locations & Pricing <span className="text-slate-500 font-normal text-xs">(optional — leave empty to use main price above)</span></label>
                                    <button type="button" onClick={addPickupLocation} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 border border-blue-500/30 px-2 py-1 rounded-lg">
                                        <Plus size={12} /> Add Location
                                    </button>
                                </div>
                                {formData.pickupLocations.length === 0 && (
                                    <p className="text-xs text-slate-500 italic">No pickup locations added. All clients pay the main Selling Price above.</p>
                                )}
                                {formData.pickupLocations.map((loc, idx) => (
                                    <div key={idx} className="grid grid-cols-3 gap-2 items-center">
                                        <input type="text" value={loc.location} onChange={(e) => updatePickupLocation(idx, 'location', e.target.value)}
                                            className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" placeholder="📍 Location (e.g. Delhi)" />
                                        <input type="number" value={loc.price} onChange={(e) => updatePickupLocation(idx, 'price', e.target.value)}
                                            className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" placeholder="₹ Client Price" />
                                        <div className="flex gap-2">
                                            <input type="number" value={loc.b2bPrice} onChange={(e) => updatePickupLocation(idx, 'b2bPrice', e.target.value)}
                                                className="flex-1 bg-black/40 border border-purple-500/20 rounded-lg px-3 py-2 text-white text-sm" placeholder="₹ B2B Price" />
                                            <button type="button" onClick={() => removePickupLocation(idx)} className="text-slate-500 hover:text-red-400 shrink-0"><X size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* ── Departure Type ── */}
                            <div className="col-span-1 md:col-span-2 border border-white/10 rounded-xl p-4 space-y-3 bg-black/20">
                                <label className="text-sm font-bold text-slate-300">🚀 Departure Type</label>
                                <div className="flex gap-3 flex-wrap">
                                    {[
                                        { value: 'daily', label: '📅 Daily Departure' },
                                        { value: 'weekly', label: '📆 Weekly Departure' },
                                        { value: 'minimum-clients', label: '👥 Minimum Clients' },
                                    ].map(opt => (
                                        <label key={opt.value} className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border transition-all text-sm ${formData.departureType === opt.value ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-black/40 border-white/10 text-slate-400 hover:border-white/30'}`}>
                                            <input type="radio" name="departureType" value={opt.value} checked={formData.departureType === opt.value}
                                                onChange={handleChange} className="accent-blue-500" />
                                            {opt.label}
                                        </label>
                                    ))}
                                </div>
                                {formData.departureType === 'weekly' && (
                                    <div className="space-y-2">
                                        <label className="text-sm text-slate-400">Departure Day — small groups join every week on:</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                                                <button
                                                    key={idx} type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, weeklyDay: idx }))}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${Number(formData.weeklyDay) === idx ? 'bg-blue-600 border-blue-600 text-white' : 'bg-black/40 border-white/10 text-slate-400 hover:border-white/30 hover:text-white'}`}
                                                >
                                                    {day}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-xs text-slate-500">1 person or any size group → only this day of the week.</p>
                                    </div>
                                )}
                                {formData.departureType === 'minimum-clients' && (
                                    <div className="flex items-center gap-3">
                                        <label className="text-sm text-slate-400 whitespace-nowrap">Minimum Clients Required (to run trip):</label>
                                        <input type="number" name="minimumClients" value={formData.minimumClients}
                                            onChange={handleChange} min="1" placeholder="e.g. 6"
                                            className="w-28 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                                    </div>
                                )}

                                {/* Private Group — any-date departure (works alongside weekly/daily) */}
                                <div className="mt-2 pt-3 border-t border-white/10 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-amber-300">🚀 Private Group Departure</span>
                                        <span className="text-xs text-slate-500">(works alongside weekly/daily above)</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <label className="text-sm text-slate-400 whitespace-nowrap">If group has</label>
                                        <input type="number" name="minimumPersons" value={formData.minimumPersons}
                                            onChange={handleChange} min="1" placeholder="e.g. 4"
                                            className="w-24 bg-black/40 border border-amber-500/30 rounded-lg px-3 py-2 text-white text-sm" />
                                        <label className="text-sm text-slate-400">or more persons → they can pick <strong className="text-amber-300">any date</strong></label>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        Example: Weekly (Fridays) + Private Group (4+) → 1–3 people book only Fridays. 4+ people pick any date.
                                    </p>
                                </div>
                            </div>

                            {/* ── Season Dates ── */}
                            <div className="col-span-1 md:col-span-2 border border-white/10 rounded-xl p-4 space-y-3 bg-black/20">
                                <label className="text-sm font-bold text-slate-300">📅 Season / Booking Window <span className="text-slate-500 font-normal text-xs">(optional — leave empty to allow any date)</span></label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">Season Opens</label>
                                        <input type="date" name="seasonStartDate" value={formData.seasonStartDate} onChange={handleChange}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">Season Closes</label>
                                        <input type="date" name="seasonEndDate" value={formData.seasonEndDate} onChange={handleChange}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Categories</label>
                                <div className="flex flex-wrap gap-2">
                                    {['Trek', 'Spiritual', 'International', 'Leisure', 'Honeymoon', 'Backpacking'].map(cat => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => {
                                                const currentCats = Array.isArray(formData.category) ? formData.category : [];
                                                const newCats = currentCats.includes(cat.toLowerCase())
                                                    ? currentCats.filter(c => c !== cat.toLowerCase())
                                                    : [...currentCats, cat.toLowerCase()];
                                                setFormData(prev => ({ ...prev, category: newCats }));
                                            }}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${(Array.isArray(formData.category) ? formData.category : []).includes(cat.toLowerCase())
                                                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20'
                                                : 'bg-black/40 border-white/10 text-slate-400 hover:border-white/30 hover:text-white'
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="col-span-1 md:col-span-2">
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

                    {/* Batch Dates & Availability */}
                    <div className="space-y-4 pt-6 border-t border-white/10">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-blue-400">Batch Dates & Availability</h3>
                                <p className="text-xs text-slate-400">Manage real-time seat availability for specific dates.</p>
                            </div>
                        </div>

                        <div className="bg-black/20 p-4 rounded-xl border border-white/10">
                            <div className="flex gap-4 mb-4">
                                <div className="flex-1">
                                    <label className="block text-sm text-slate-400 mb-1">Select Date</label>
                                    <input 
                                        type="date" 
                                        value={tempBatchDate} 
                                        onChange={(e) => setTempBatchDate(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white" 
                                    />
                                </div>
                                <div className="w-32">
                                    <label className="block text-sm text-slate-400 mb-1">Available Seats</label>
                                    <input 
                                        type="number" 
                                        value={tempAvailableSeats} 
                                        onChange={(e) => setTempAvailableSeats(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white" 
                                        min="0"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            if (!tempBatchDate || !tempAvailableSeats) {
                                                alert("Please select a date and enter available seats.");
                                                return;
                                            }
                                            const newBatch = { date: tempBatchDate, availableSeats: parseInt(tempAvailableSeats, 10) };
                                            // Remove if date already exists
                                            const filtered = formData.batchDates.filter(b => b.date !== tempBatchDate);
                                            const updated = [...filtered, newBatch].sort((a, b) => new Date(a.date) - new Date(b.date));
                                            setFormData(prev => ({ ...prev, batchDates: updated }));
                                            setTempBatchDate('');
                                            setTempAvailableSeats('');
                                        }}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold transition-colors h-[42px]"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>

                            {formData.batchDates && formData.batchDates.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    {formData.batchDates.map((batch, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-white/5 border border-white/10 p-3 rounded-lg">
                                            <div>
                                                <div className="text-sm font-bold text-white">
                                                    {new Date(batch.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </div>
                                                <div className={`text-xs ${batch.availableSeats > 10 ? 'text-green-400' : batch.availableSeats > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                    {batch.availableSeats} spots left
                                                </div>
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    const updated = formData.batchDates.filter((_, i) => i !== idx);
                                                    setFormData(prev => ({ ...prev, batchDates: updated }));
                                                }}
                                                className="text-slate-500 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 italic">No batch dates added yet. The package will not have specific date availability shown.</p>
                            )}
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

                        {/* General Policy */}
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-300">📋 General Policy</label>
                            <p className="text-xs text-slate-500">Applies to all clients. Edit freely.</p>
                            <textarea
                                value={formData.generalPolicy || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, generalPolicy: e.target.value }))}
                                rows={3}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-y"
                                placeholder="All participants must carry valid ID proof. Follow trek leader instructions at all times..."
                            />
                        </div>

                        {/* Cancellation Policy */}
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-300">❌ Cancellation Policy</label>
                            <p className="text-xs text-slate-500">Token amount auto-updates from Token Price field. Edit each item as needed.</p>
                            {(formData.cancellationPolicy || []).map((item, index) => (
                                <div key={index} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={item}
                                        onChange={(e) => handleListChange('cancellationPolicy', index, e.target.value)}
                                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
                                        placeholder="e.g. More than 7 days: Full refund minus token amount"
                                    />
                                    <button onClick={() => removeListItem('cancellationPolicy', index)} className="text-slate-500 hover:text-red-400"><X size={16} /></button>
                                </div>
                            ))}
                            <button onClick={() => addListItem('cancellationPolicy')} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                <Plus size={14} /> Add Policy Item
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

                                        {/* Day Info (optional) */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase">Day Info <span className="text-slate-600 normal-case font-normal">(optional — leave blank to hide)</span></label>
                                            {/* Drive */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                <input
                                                    type="text"
                                                    value={day.distance || ''}
                                                    onChange={(e) => handleItineraryChange(dayIndex, 'distance', e.target.value)}
                                                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                                    placeholder="🚗 Drive Distance (e.g. 180 km)"
                                                />
                                                <input
                                                    type="text"
                                                    value={day.time || ''}
                                                    onChange={(e) => handleItineraryChange(dayIndex, 'time', e.target.value)}
                                                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                                    placeholder="⏱ Drive Time (e.g. 7-8 hours)"
                                                />
                                            </div>
                                            {/* Trek */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                <input
                                                    type="text"
                                                    value={day.trekDistance || ''}
                                                    onChange={(e) => handleItineraryChange(dayIndex, 'trekDistance', e.target.value)}
                                                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                                    placeholder="🥾 Trek Distance (e.g. 18-20 km)"
                                                />
                                                <input
                                                    type="text"
                                                    value={day.trekTime || ''}
                                                    onChange={(e) => handleItineraryChange(dayIndex, 'trekTime', e.target.value)}
                                                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                                    placeholder="⏱ Trek Time (e.g. 8-10 hours)"
                                                />
                                            </div>
                                            {/* Altitude, Stay, Meals */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                <input
                                                    type="text"
                                                    value={day.altitude || ''}
                                                    onChange={(e) => handleItineraryChange(dayIndex, 'altitude', e.target.value)}
                                                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                                    placeholder="⛰ Altitude (e.g. 12,100 ft)"
                                                />
                                                <input
                                                    type="text"
                                                    value={day.stay || ''}
                                                    onChange={(e) => handleItineraryChange(dayIndex, 'stay', e.target.value)}
                                                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                                    placeholder="🏕 Stay (e.g. Camping / Hotel)"
                                                />
                                                <input
                                                    type="text"
                                                    value={day.meals || ''}
                                                    onChange={(e) => handleItineraryChange(dayIndex, 'meals', e.target.value)}
                                                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                                    placeholder="🍽 Meals (e.g. Breakfast & Dinner)"
                                                />
                                            </div>
                                        </div>

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

                    {/* Linked Hotels Section */}
                    <div className="space-y-4 pt-6 mt-4 border-t border-white/10">
                        <h3 className="text-lg font-bold text-blue-400">🏨 Linked Hotels</h3>
                        <p className="text-sm text-slate-400 mb-4">Select Infinite Yatra hotels to display as recommended accommodations on this package's public detail page.</p>
                        
                        {fetchingHotels ? (
                            <p className="text-slate-500">Loading hotels...</p>
                        ) : allHotels.length === 0 ? (
                            <p className="text-slate-500 bg-white/5 p-4 rounded-lg">No visible hotels found in the database. Add some hotels first.</p>
                        ) : (
                            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow-inner">
                                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                    {allHotels.map(hotel => (
                                        <label key={hotel.id} className={`flex items-center gap-4 p-4 border-b border-white/10 hover:bg-white/5 cursor-pointer transition-colors ${formData.linkedHotelIds?.includes(hotel.id) ? 'bg-blue-500/10' : ''}`}>
                                            <input
                                                type="checkbox"
                                                checked={formData.linkedHotelIds?.includes(hotel.id)}
                                                onChange={() => toggleHotelLink(hotel.id)}
                                                className="w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900 bg-black/40"
                                            />
                                            <div className="flex-1">
                                                <div className="text-white font-bold">{hotel.name}</div>
                                                <div className="text-xs text-slate-400 mt-1 flex gap-2">
                                                    <span>📍 {hotel.city}</span>
                                                    <span>•</span>
                                                    <span>⭐ {hotel.category}</span>
                                                </div>
                                            </div>
                                            {formData.linkedHotelIds?.includes(hotel.id) && (
                                                <div className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full">Linked</div>
                                            )}
                                        </label>
                                    ))}
                                </div>
                                <div className="p-3 bg-black/40 border-t border-white/10 text-xs text-slate-400 font-medium">
                                    Selected: {formData.linkedHotelIds?.length || 0} hotel(s) linked
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Linked Vehicles Section */}
                    <div className="space-y-4 pt-6 mt-4 border-t border-white/10">
                        <h3 className="text-lg font-bold text-blue-400">🚗 Linked Vehicles</h3>
                        <p className="text-sm text-slate-400 mb-4">Select infinite yatra managed vehicles available to service this package route.</p>

                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <label className="block text-slate-400 text-sm mb-2 rounded font-bold">Package Route Hint (Optional)</label>
                            <input
                                type="text"
                                value={formData.packageRoute || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, packageRoute: e.target.value }))}
                                placeholder="e.g. Dehradun → Manali"
                                className="w-full bg-black/40 border border-white/10 text-white rounded p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-600 mb-4"
                            />
                            
                            <label className="block text-slate-400 text-sm mb-2 rounded font-bold">Search Vehicles</label>
                            <input
                                type="text"
                                value={vehicleSearch}
                                onChange={(e) => setVehicleSearch(e.target.value)}
                                placeholder="Search by name or category..."
                                className="w-full bg-black/40 border border-white/10 text-white rounded p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-600 mb-4"
                            />

                            {fetchingVehicles ? (
                                <p className="text-slate-500 py-4">Loading vehicles...</p>
                            ) : allVehicles.length === 0 ? (
                                <p className="text-slate-500 bg-white/5 p-4 rounded-lg">No active vehicles found in the database. Add some vehicles first.</p>
                            ) : (
                                <div className="border border-white/10 rounded-lg overflow-hidden shadow-inner bg-black/20">
                                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                        {allVehicles
                                            .filter(v => v.vehicleType?.toLowerCase().includes(vehicleSearch.toLowerCase()) || v.category?.toLowerCase().includes(vehicleSearch.toLowerCase()))
                                            .map(vehicle => (
                                                <label key={vehicle.id} className={`flex items-center gap-4 p-4 border-b border-white/10 hover:bg-white/5 cursor-pointer transition-colors ${formData.linkedVehicleIds?.includes(vehicle.id) ? 'bg-blue-500/10' : ''}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.linkedVehicleIds?.includes(vehicle.id)}
                                                        onChange={() => toggleVehicleLink(vehicle.id)}
                                                        className="w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900 bg-black/40"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="text-white font-bold">{vehicle.vehicleType}</div>
                                                        <div className="text-xs text-slate-400 mt-1 flex gap-3">
                                                            <span>👥 {vehicle.capacity} seats</span>
                                                            {vehicle.pricePerKm && <span>• ₹{vehicle.pricePerKm}/km</span>}
                                                            {vehicle.pricePerDay && <span>• ₹{vehicle.pricePerDay}/day</span>}
                                                        </div>
                                                    </div>
                                                    {formData.linkedVehicleIds?.includes(vehicle.id) && (
                                                        <div className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full">Linked</div>
                                                    )}
                                                </label>
                                        ))}
                                    </div>
                                    <div className="p-3 bg-black/40 border-t border-white/10 text-xs text-slate-400 font-medium">
                                        Selected: {formData.linkedVehicleIds?.length || 0} vehicle(s) linked
                                    </div>
                                </div>
                            )}
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
