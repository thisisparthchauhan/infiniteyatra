import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Car, X, Image as ImageIcon, Search, CheckCircle, Upload, Star } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { listenToVehicles, listenToVehicleCities, addVehicle, updateVehicle, deleteVehicle, addVehicleCity } from '../../../services/vehicleService';

const AdminTransportVehicles = () => {
    const [vehicles, setVehicles] = useState([]);
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCityModalOpen, setIsCityModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    
    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterCity, setFilterCity] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    const [formData, setFormData] = useState(getInitialFormData());
    const [newCityName, setNewCityName] = useState('');
    const [uploading, setUploading] = useState(false);

    const CLOUD_NAME = "infiniteyatra";
    const UPLOAD_PRESET = "infinite_unsigned";

    function getInitialFormData() {
        return {
            id: null,
            name: '',
            slug: '',
            type: 'cycle',
            subtype: '',
            tagline: '',
            description: '',
            mainImage: '',
            galleryImages: [],
            videoUrls: [],
            cities: [],
            isAvailable: true,
            isFeatured: false,
            featuredOrder: 0,
            specs: {
                seatingCapacity: '',
                engineCC: '',
                batteryRange: '',
                maxLoad: '',
                ageRestriction: '',
                features: [],
                isElectric: false,
            },
            pricing: {
                per15min: '',
                per30min: '',
                perHour: '',
                per4hour: '',
                perDay: '',
                perWeek: '',
                perMonth: '',
                basePrice: '',
                priceUnit: 'per vehicle',
                currency: 'INR',
                gstIncluded: true,
                gstPercent: '',
                notes: '',
            },
            operatingHours: '',
            location: '',
            vendorNotes: ''
        };
    }

    useEffect(() => {
        let mounted = true;
        setLoading(true);

        const unsubscribeVehicles = listenToVehicles({}, (data) => {
            if(mounted) setVehicles(data);
            setLoading(false);
        });

        const unsubscribeCities = listenToVehicleCities((data) => {
            if(mounted) setCities(data);
        });

        return () => {
            mounted = false;
            unsubscribeVehicles();
            unsubscribeCities();
        };
    }, []);

    const handleOpenModal = (vehicle = null) => {
        if (vehicle) {
            setFormData({
                ...getInitialFormData(),
                ...vehicle,
                specs: { ...getInitialFormData().specs, ...(vehicle.specs || {}) },
                pricing: { ...getInitialFormData().pricing, ...(vehicle.pricing || {}) }
            });
            setEditMode(true);
        } else {
            setFormData(getInitialFormData());
            setEditMode(false);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => setIsModalOpen(false);

    const handleFeatureToggle = (feature) => {
        const specs = { ...formData.specs };
        const currentFeatures = [...(specs.features || [])];
        if (currentFeatures.includes(feature)) {
            specs.features = currentFeatures.filter(f => f !== feature);
        } else {
            specs.features = [...currentFeatures, feature];
        }
        setFormData({ ...formData, specs });
    };

    const handleFeatureInputKeyDown = (e) => {
        if (e.key === 'Enter' && e.target.value.trim()) {
            e.preventDefault();
            handleFeatureToggle(e.target.value.trim());
            e.target.value = '';
        }
    };

    const handleGalleryInputKeyDown = (e) => {
        if (e.key === 'Enter' && e.target.value.trim()) {
            e.preventDefault();
            setFormData({ ...formData, galleryImages: [...formData.galleryImages, e.target.value.trim()] });
            e.target.value = '';
        }
    };

    const handleVideoInputKeyDown = (e) => {
        if (e.key === 'Enter' && e.target.value.trim()) {
            e.preventDefault();
            setFormData({ ...formData, videoUrls: [...formData.videoUrls, e.target.value.trim()] });
            e.target.value = '';
        }
    };

    const handleCityToggle = (cityName) => {
        const currentCities = [...(formData.cities || [])];
        if (currentCities.includes(cityName)) {
            setFormData({ ...formData, cities: currentCities.filter(c => c !== cityName) });
        } else {
            setFormData({ ...formData, cities: [...currentCities, cityName] });
        }
    };

    const uploadImage = async (file) => {
        if (file.size > 5 * 1024 * 1024) throw new Error("File size max 5MB");
        const uploadData = new FormData();
        uploadData.append("file", file);
        uploadData.append("upload_preset", UPLOAD_PRESET);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: uploadData });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        return data.secure_url;
    };

    const handleMainImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const url = await uploadImage(file);
            setFormData(prev => ({ ...prev, mainImage: url }));
            toast.success("Image uploaded!");
        } catch (error) {
            toast.error(error.message);
        } finally {
            setUploading(false);
            e.target.value = null;
        }
    };

    const parseNumber = (val) => {
        if (val === '' || val === null || val === undefined) return null;
        const num = Number(val);
        return isNaN(num) ? null : num;
    };

    const handleSubmit = async (e, forceDraft = false) => {
        if (e) e.preventDefault();
        
        // Manual Validation since HTML5 validation bubbles often hide in modals
        if (!formData.name?.trim()) {
            toast.error("Vehicle Name is required");
            return;
        }
        if (!formData.type) {
            toast.error("Vehicle Type is required");
            return;
        }
        if (!formData.subtype) {
            toast.error("Sub-type is required");
            return;
        }

        try {
            const submitData = {
                ...formData,
                slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
                featuredOrder: Number(formData.featuredOrder) || 0,
                isAvailable: forceDraft ? false : formData.isAvailable,
                specs: {
                    ...formData.specs,
                    seatingCapacity: parseNumber(formData.specs.seatingCapacity),
                    engineCC: parseNumber(formData.specs.engineCC),
                },
                pricing: {
                    ...formData.pricing,
                    per15min: parseNumber(formData.pricing.per15min),
                    per30min: parseNumber(formData.pricing.per30min),
                    perHour: parseNumber(formData.pricing.perHour),
                    per4hour: parseNumber(formData.pricing.per4hour),
                    perDay: parseNumber(formData.pricing.perDay),
                    perWeek: parseNumber(formData.pricing.perWeek),
                    perMonth: parseNumber(formData.pricing.perMonth),
                    basePrice: parseNumber(formData.pricing.basePrice),
                    gstPercent: parseNumber(formData.pricing.gstPercent),
                }
            };

            console.log("Submitting Vehicle Data:", submitData);

            if (editMode) {
                if (!submitData.id) {
                    throw new Error("Missing Document ID! The form lost the reference to the vehicle.");
                }
                
                // Firestore SDK crashes with 'indexOf' if any field value or ID is strictly null/undefined in a bad way
                // Clean the payload
                const cleanData = JSON.parse(JSON.stringify(submitData));
                delete cleanData.id; // never store the doc ID explicitly inside itself

                await updateVehicle(submitData.id, cleanData);
            } else {
                const cleanData = JSON.parse(JSON.stringify(submitData));
                delete cleanData.id;
                await addVehicle(cleanData);
            }
            handleCloseModal();
            toast.success(editMode ? 'Vehicle updated successfully!' : 'Vehicle added successfully!');
        } catch (error) {
            console.error('Error saving vehicle:', error);
            alert(`Javascript Validation Error: ${error.message || 'Unknown error'}`);
            toast.error('Failed to save vehicle');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this vehicle?')) {
            try {
                await deleteVehicle(id);
                toast.success('Vehicle deleted');
            } catch (error) {
                alert('Failed to delete vehicle');
            }
        }
    };

    const toggleAvailability = async (id, currentStatus) => {
        try {
            await updateVehicle(id, { isAvailable: !currentStatus });
        } catch (error) {
            alert(`Failed to update availability`);
        }
    };

    const toggleFeatured = async (id, currentStatus, currentOrder) => {
        try {
            if (!currentStatus) {
                const order = prompt("Enter featured order (1, 2, 3...):", currentOrder || 1);
                if (order === null) return;
                await updateVehicle(id, { isFeatured: true, featuredOrder: Number(order) });
            } else {
                await updateVehicle(id, { isFeatured: false });
            }
        } catch (error) {
            alert(`Failed to update featured status`);
        }
    };

    const addNewCity = async () => {
        if (!newCityName.trim()) return;
        try {
            await addVehicleCity({
                name: newCityName.trim(),
                id: newCityName.trim().toLowerCase().replace(/\s+/g, '-'),
                isActive: true
            });
            setNewCityName('');
            setIsCityModalOpen(false);
            toast.success('City added!');
        } catch (e) {
            toast.error('Failed to add city');
        }
    };

    // Derived filtering
    const filteredVehicles = vehicles.filter(v => {
        const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || v.type === filterType;
        const matchesCity = filterCity === 'all' || (v.cities && v.cities.includes(filterCity));
        const matchesStatus = filterStatus === 'all' || (filterStatus === 'live' ? v.isAvailable : !v.isAvailable);
        return matchesSearch && matchesType && matchesCity && matchesStatus;
    });

    if (loading) {
        return <div className="flex justify-center items-center h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div></div>;
    }

    return (
        <div className="p-6 pb-24">
            {/* Header row */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Car className="text-green-500" />
                        Transportation → Vehicles
                    </h2>
                    <p className="text-slate-400 mt-1">Manage all infinite yatra vehicle types</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-green-600 hover:bg-green-500 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-colors shadow-lg shadow-green-500/20"
                >
                    <Plus size={18} /> Add New Vehicle
                </button>
            </div>

            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-3 mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <select className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:border-green-500 outline-none" value={filterType} onChange={e => setFilterType(e.target.value)}>
                    <option value="all">All Types</option>
                    <option value="cycle">Cycle</option>
                    <option value="bike">Bike</option>
                    <option value="car">Car</option>
                    <option value="tempo_traveller">Tempo Traveller</option>
                    <option value="bus">Bus</option>
                    <option value="other">Other</option>
                </select>
                
                <select className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:border-green-500 outline-none" value={filterCity} onChange={e => setFilterCity(e.target.value)}>
                    <option value="all">All Cities</option>
                    {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>

                <select className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:border-green-500 outline-none" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="all">Status: All</option>
                    <option value="live">Live</option>
                    <option value="hidden">Hidden</option>
                </select>

                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input type="text" placeholder="Search by name..." className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-white text-sm focus:border-green-500 outline-none" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#111] border border-slate-800 rounded-2xl overflow-x-auto shadow-xl">
                <table className="w-full text-left text-sm text-slate-300 min-w-[800px]">
                    <thead className="bg-[#1a1a1a] border-b border-slate-800 text-slate-400">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Image</th>
                            <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Name</th>
                            <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Type</th>
                            <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">City</th>
                            <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Pricing</th>
                            <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Featured</th>
                            <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {filteredVehicles.map(vehicle => {
                            let lowestPrice = 'N/A';
                            if (vehicle.pricing?.per15min) lowestPrice = `₹${vehicle.pricing.per15min} / 15min`;
                            else if (vehicle.pricing?.basePrice) lowestPrice = `₹${vehicle.pricing.basePrice} base`;
                            else if (vehicle.pricing?.perHour) lowestPrice = `₹${vehicle.pricing.perHour} / hr`;

                            return (
                                <tr key={vehicle.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        {vehicle.mainImage ? (
                                            <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800 border-2 border-slate-700">
                                                <img src={vehicle.mainImage} alt={vehicle.name} className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-500">
                                                <ImageIcon size={20} />
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-white text-base">{vehicle.name}</div>
                                        {vehicle.subtype && <span className="inline-block mt-1 px-2 py-0.5 bg-slate-800 text-[10px] text-slate-400 rounded-md uppercase tracking-wider border border-slate-700">{vehicle.subtype}</span>}
                                    </td>
                                    <td className="px-6 py-4 capitalize">
                                        <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-semibold border border-blue-500/20">{vehicle.type.replace('_',' ')}</span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-400 max-w-[150px] truncate">
                                        {(vehicle.cities || []).join(', ') || 'None'}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-white">{lowestPrice}</td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => toggleFeatured(vehicle.id, vehicle.isFeatured, vehicle.featuredOrder)} className={`p-1.5 rounded-full transition-colors ${vehicle.isFeatured ? 'text-yellow-400 bg-yellow-400/10' : 'text-slate-600 hover:text-yellow-400 hover:bg-slate-800'}`}>
                                            <Star size={18} fill={vehicle.isFeatured ? "currentColor" : "none"} />
                                        </button>
                                        {vehicle.isFeatured && <span className="text-xs text-slate-500 ml-2">#{vehicle.featuredOrder}</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => toggleAvailability(vehicle.id, vehicle.isAvailable)} className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${vehicle.isAvailable ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                            {vehicle.isAvailable ? 'Live' : 'Hidden'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => handleOpenModal(vehicle)} className="text-blue-400 hover:text-blue-300 bg-blue-500/10 p-2 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDelete(vehicle.id)} className="text-red-400 hover:text-red-300 bg-red-500/10 p-2 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                        {filteredVehicles.length === 0 && (
                            <tr><td colSpan="8" className="px-6 py-12 text-center text-slate-500">No vehicles found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Form Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-[#0a0a0a] border border-slate-800 w-full max-w-5xl h-[90vh] rounded-2xl flex flex-col shadow-2xl">
                            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-[#111] shrink-0 rounded-t-2xl">
                                <h3 className="text-xl font-bold text-white">{editMode ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
                                <button onClick={handleCloseModal} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"><X size={24} /></button>
                            </div>

                            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-[#0a0f0a]">
                                <form id="vehicleForm" onSubmit={e => handleSubmit(e, false)} className="space-y-10 max-w-4xl mx-auto">

                                    {/* Section A: Basic Info */}
                                    <section className="bg-[#111] p-6 rounded-2xl border border-slate-800">
                                        <h4 className="text-sm font-bold text-green-400 uppercase tracking-wider mb-6 pb-2 border-b border-slate-800">Section A — Basic Info</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-400 mb-1.5">Vehicle Name *</label>
                                                <input type="text" required className="w-full bg-[#1a1a1a] border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-green-500" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-400 mb-1.5">Slug (auto-generated if empty)</label>
                                                <input type="text" className="w-full bg-[#1a1a1a] border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-green-500" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-400 mb-1.5">Vehicle Type *</label>
                                                <select required className="w-full bg-[#1a1a1a] border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-green-500" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value, subtype: '' })}>
                                                    <option value="cycle">Cycle</option>
                                                    <option value="bike">Bike</option>
                                                    <option value="car">Car</option>
                                                    <option value="tempo_traveller">Tempo Traveller</option>
                                                    <option value="bus">Bus</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-400 mb-1.5">Sub-type *</label>
                                                <select required className="w-full bg-[#1a1a1a] border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-green-500" value={formData.subtype} onChange={e => setFormData({ ...formData, subtype: e.target.value })}>
                                                    <option value="">Select subtype</option>
                                                    {formData.type === 'cycle' && <><option value="paddle">Paddle</option><option value="ev">Electric (EV)</option></>}
                                                    {formData.type === 'bike' && <><option value="petrol">Petrol</option><option value="ev">Electric</option></>}
                                                    {formData.type === 'car' && <><option value="hatchback">Hatchback</option><option value="sedan">Sedan</option><option value="suv">SUV</option><option value="luxury">Luxury</option><option value="van">Van</option></>}
                                                    {formData.type === 'tempo_traveller' && <><option value="mini">Mini Tempo</option><option value="full">Full Tempo</option></>}
                                                    {formData.type === 'bus' && <><option value="mini">Mini Bus</option><option value="full">Full Bus</option></>}
                                                    {formData.type === 'other' && <option value="other">Other</option>}
                                                </select>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-slate-400 mb-1.5">Tagline (max 60 chars)</label>
                                                <input type="text" maxLength={60} className="w-full bg-[#1a1a1a] border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-green-500" value={formData.tagline} onChange={e => setFormData({ ...formData, tagline: e.target.value })} />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-slate-400 mb-1.5">Description</label>
                                                <textarea rows="3" className="w-full bg-[#1a1a1a] border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-green-500 resize-none" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Section B: Availability */}
                                    <section className="bg-[#111] p-6 rounded-2xl border border-slate-800">
                                        <h4 className="text-sm font-bold text-green-400 uppercase tracking-wider mb-6 pb-2 border-b border-slate-800">Section B — Availability & Cities</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="md:col-span-2 bg-[#1a1a1a] p-4 rounded-xl border border-slate-700">
                                                <div className="flex justify-between items-center mb-3">
                                                    <label className="block text-sm font-medium text-slate-400">Available In Cities *</label>
                                                    <button type="button" onClick={() => setIsCityModalOpen(true)} className="text-xs text-green-400 hover:text-green-300 bg-green-500/10 px-2 py-1 rounded">
                                                        + Add New City
                                                    </button>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {cities.map(c => (
                                                        <button type="button" key={c.id} onClick={() => handleCityToggle(c.name)} className={`px-3 py-1.5 rounded-lg text-sm transition-colors border ${formData.cities.includes(c.name) ? 'bg-green-600 border-green-500 text-white' : 'bg-[#222] border-slate-700 text-slate-400 hover:bg-[#333]'}`}>
                                                            {c.name}
                                                        </button>
                                                    ))}
                                                    {cities.length === 0 && <span className="text-sm text-slate-500">No cities configured.</span>}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-400 mb-1.5">Operating Hours</label>
                                                <input type="text" placeholder="e.g. 6 AM – 11 PM" className="w-full bg-[#1a1a1a] border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-green-500" value={formData.operatingHours} onChange={e => setFormData({ ...formData, operatingHours: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-400 mb-1.5">Location/Station</label>
                                                <input type="text" placeholder="e.g. Sardar Bridge" className="w-full bg-[#1a1a1a] border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-green-500" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                                            </div>
                                            
                                            <div className="md:col-span-2 flex flex-wrap gap-8 p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                                                <label className="flex items-center gap-3 cursor-pointer">
                                                    <input type="checkbox" className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-green-500 focus:ring-green-500" checked={formData.isAvailable} onChange={e => setFormData({ ...formData, isAvailable: e.target.checked })} />
                                                    <span className="text-sm text-white font-medium">Is Available</span>
                                                </label>
                                                <label className="flex items-center gap-3 cursor-pointer">
                                                    <input type="checkbox" className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-yellow-500 focus:ring-yellow-500" checked={formData.isFeatured} onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })} />
                                                    <span className="text-sm text-white font-medium">Is Featured</span>
                                                </label>
                                                {formData.isFeatured && (
                                                    <label className="flex items-center gap-3">
                                                        <span className="text-sm text-slate-400 font-medium">Order:</span>
                                                        <input type="number" className="w-16 bg-[#1a1a1a] border border-slate-700 rounded px-2 py-1 text-white text-sm outline-none focus:border-yellow-500" value={formData.featuredOrder} onChange={e => setFormData({ ...formData, featuredOrder: e.target.value })} />
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    </section>

                                    {/* Section C: Pricing */}
                                    <section className="bg-[#111] p-6 rounded-2xl border border-slate-800">
                                        <h4 className="text-sm font-bold text-green-400 uppercase tracking-wider mb-6 pb-2 border-b border-slate-800">Section C — Pricing</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-400 mb-1.5">Pricing Unit *</label>
                                                <select className="w-full bg-[#1a1a1a] border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-green-500" value={formData.pricing.priceUnit} onChange={e => setFormData({ ...formData, pricing: { ...formData.pricing, priceUnit: e.target.value } })}>
                                                    <option value="per person">Per Person</option>
                                                    <option value="per vehicle">Per Vehicle</option>
                                                    <option value="per km">Per Km</option>
                                                    <option value="per trip">Per Trip</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-400 mb-1.5">Currency</label>
                                                <input type="text" readOnly value="INR" className="w-full bg-[#1a1a1a] border border-slate-700 rounded-xl px-4 py-2.5 text-slate-500 focus:outline-none cursor-not-allowed" />
                                            </div>
                                            <div className="md:col-span-3"><div className="h-px bg-slate-800 w-full my-2"></div></div>
                                            
                                            {/* Time based */}
                                            {['per15min', 'per30min', 'perHour', 'per4hour', 'perDay', 'perWeek', 'perMonth'].map((field) => (
                                                <div key={field}>
                                                    <label className="block text-sm font-medium text-slate-400 mb-1.5 capitalize">{field.replace('per', 'Per ')}</label>
                                                    <input type="number" placeholder="₹" className="w-full bg-[#1a1a1a] border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-green-500" value={formData.pricing[field]} onChange={e => setFormData({ ...formData, pricing: { ...formData.pricing, [field]: e.target.value } })} />
                                                </div>
                                            ))}
                                            
                                            <div className="md:col-span-3"><div className="h-px bg-slate-800 w-full my-2"></div></div>
                                            <div className="md:col-span-1">
                                                <label className="block text-sm font-medium text-slate-400 mb-1.5">Base Price (Fixed)</label>
                                                <input type="number" placeholder="₹" className="w-full bg-[#1a1a1a] border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-green-500" value={formData.pricing.basePrice} onChange={e => setFormData({ ...formData, pricing: { ...formData.pricing, basePrice: e.target.value } })} />
                                            </div>

                                            <div className="md:col-span-2 flex items-center gap-6 p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                                                <label className="flex items-center gap-3 cursor-pointer">
                                                    <input type="checkbox" className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-green-500 focus:ring-green-500" checked={formData.pricing.gstIncluded} onChange={e => setFormData({ ...formData, pricing: { ...formData.pricing, gstIncluded: e.target.checked } })} />
                                                    <span className="text-sm text-white font-medium">GST Included?</span>
                                                </label>
                                                {!formData.pricing.gstIncluded && (
                                                    <label className="flex items-center gap-3">
                                                        <span className="text-sm text-slate-400 font-medium">GST % :</span>
                                                        <input type="number" className="w-20 bg-[#1a1a1a] border border-slate-700 rounded px-3 py-1.5 text-white text-sm outline-none focus:border-green-500" value={formData.pricing.gstPercent} onChange={e => setFormData({ ...formData, pricing: { ...formData.pricing, gstPercent: e.target.value } })} />
                                                    </label>
                                                )}
                                            </div>

                                            <div className="md:col-span-3">
                                                <label className="block text-sm font-medium text-slate-400 mb-1.5">Pricing Notes</label>
                                                <textarea rows="2" placeholder="e.g. First 15 min ₹50, then ₹50 per 30min" className="w-full bg-[#1a1a1a] border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-green-500 resize-none" value={formData.pricing.notes} onChange={e => setFormData({ ...formData, pricing: { ...formData.pricing, notes: e.target.value } })}></textarea>
                                            </div>

                                            {/* Preview Box */}
                                            <div className="md:col-span-3 mt-2 bg-[#0a0f0a] border border-green-500/20 p-4 rounded-xl text-green-400 text-sm font-mono whitespace-pre-line leading-relaxed">
                                                PRICING PREVIEW<br/>
                                                {formData.pricing.per15min && <>₹{formData.pricing.per15min} / 15 min<br/></>}
                                                {formData.pricing.per30min && <>₹{formData.pricing.per30min} / 30 min<br/></>}
                                                {formData.pricing.basePrice && <>Base: ₹{formData.pricing.basePrice}<br/></>}
                                                {formData.pricing.gstIncluded ? 'Incl. GST' : `+ ${formData.pricing.gstPercent || 0}% GST`}<br/>
                                                {formData.pricing.notes && <span className="text-slate-400">{formData.pricing.notes}</span>}
                                            </div>
                                        </div>
                                    </section>

                                    {/* Section D: Specs */}
                                    <section className="bg-[#111] p-6 rounded-2xl border border-slate-800">
                                        <h4 className="text-sm font-bold text-green-400 uppercase tracking-wider mb-6 pb-2 border-b border-slate-800">Section D — Specs & Limits</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="md:col-span-2">
                                                <label className="flex items-center gap-3 cursor-pointer">
                                                    <input type="checkbox" className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500" checked={formData.specs.isElectric} onChange={e => setFormData({ ...formData, specs: { ...formData.specs, isElectric: e.target.checked } })} />
                                                    <span className="text-sm text-white font-medium">Is Electric (EV)</span>
                                                </label>
                                            </div>
                                            {formData.specs.isElectric && (
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Battery Range</label>
                                                    <input type="text" placeholder="e.g. 40km" className="w-full bg-[#1a1a1a] border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-green-500" value={formData.specs.batteryRange} onChange={e => setFormData({ ...formData, specs: { ...formData.specs, batteryRange: e.target.value } })} />
                                                </div>
                                            )}
                                            
                                            {(['car', 'bus', 'tempo_traveller'].includes(formData.type) || formData.type === 'other') && (
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Seating Capacity</label>
                                                    <input type="number" className="w-full bg-[#1a1a1a] border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-green-500" value={formData.specs.seatingCapacity} onChange={e => setFormData({ ...formData, specs: { ...formData.specs, seatingCapacity: e.target.value } })} />
                                                </div>
                                            )}

                                            {formData.type === 'bike' && (
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Engine CC</label>
                                                    <input type="number" className="w-full bg-[#1a1a1a] border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-green-500" value={formData.specs.engineCC} onChange={e => setFormData({ ...formData, specs: { ...formData.specs, engineCC: e.target.value } })} />
                                                </div>
                                            )}

                                            {formData.type === 'cycle' && (
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Max Load</label>
                                                    <input type="text" placeholder="e.g. 100kg" className="w-full bg-[#1a1a1a] border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-green-500" value={formData.specs.maxLoad} onChange={e => setFormData({ ...formData, specs: { ...formData.specs, maxLoad: e.target.value } })} />
                                                </div>
                                            )}

                                            <div>
                                                <label className="block text-sm font-medium text-slate-400 mb-1.5">Age Restriction</label>
                                                <input type="text" placeholder="e.g. 18+ only" className="w-full bg-[#1a1a1a] border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-green-500" value={formData.specs.ageRestriction} onChange={e => setFormData({ ...formData, specs: { ...formData.specs, ageRestriction: e.target.value } })} />
                                            </div>

                                            <div className="md:col-span-2 mt-4 bg-[#1a1a1a] p-4 rounded-xl border border-slate-700">
                                                <label className="block text-sm font-medium text-slate-400 mb-3">Features (Tags)</label>
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {(formData.specs.features || []).map(f => (
                                                        <span key={f} className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-sm border border-slate-700 flex items-center gap-2">
                                                            {f} <button type="button" onClick={() => handleFeatureToggle(f)} className="hover:text-red-400"><X size={14}/></button>
                                                        </span>
                                                    ))}
                                                </div>
                                                <input type="text" placeholder="Type a feature and press Enter (e.g. Helmet included)" onKeyDown={handleFeatureInputKeyDown} className="w-full bg-[#111] border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-green-500 text-sm" />
                                            </div>
                                        </div>
                                    </section>

                                    {/* Section E: Media */}
                                    <section className="bg-[#111] p-6 rounded-2xl border border-slate-800">
                                        <h4 className="text-sm font-bold text-green-400 uppercase tracking-wider mb-6 pb-2 border-b border-slate-800">Section E — Media</h4>
                                        <div className="space-y-6">
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-slate-400 mb-3">Main Image (Required) *</label>
                                                <div className="flex flex-col md:flex-row gap-4 items-start">
                                                    {formData.mainImage && (
                                                        <div className="w-48 aspect-video rounded-xl border-2 border-green-500/50 overflow-hidden shrink-0">
                                                            <img src={formData.mainImage} alt="Main" className="w-full h-full object-cover" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 w-full">
                                                        <input type="file" id="main-image-upload" className="hidden" accept="image/*" onChange={handleMainImageUpload} disabled={uploading} />
                                                        <label htmlFor="main-image-upload" className="flex items-center justify-center w-full h-24 mb-3 transition bg-slate-900 border-2 border-slate-700 border-dashed rounded-xl cursor-pointer hover:border-green-500 hover:bg-slate-800">
                                                            <div className="flex flex-col items-center">
                                                                {uploading ? <div className="animate-spin w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full mb-2"></div> : <Upload className="w-6 h-6 text-slate-400 mb-2" />}
                                                                <span className="text-sm text-slate-400">{uploading ? 'Uploading...' : 'Upload Main Image (Max 5MB)'}</span>
                                                            </div>
                                                        </label>
                                                        <input type="url" placeholder="Or paste image URL" className="w-full bg-[#1a1a1a] border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-green-500 text-sm" value={formData.mainImage || ''} onChange={e => setFormData({ ...formData, mainImage: e.target.value })} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-slate-800">
                                                <label className="block text-sm font-medium text-slate-400 mb-3">Gallery Images (Optional)</label>
                                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-3">
                                                    {(formData.galleryImages || []).map((img, idx) => (
                                                        <div key={idx} className="relative aspect-square rounded-lg border border-slate-700 overflow-hidden group">
                                                            <img src={img} alt="Gallery" className="w-full h-full object-cover" />
                                                            <button type="button" onClick={() => setFormData({...formData, galleryImages: formData.galleryImages.filter((_, i) => i !== idx)})} className="absolute top-1 right-1 bg-black/70 hover:bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100"><X size={12}/></button>
                                                        </div>
                                                    ))}
                                                </div>
                                                <input type="url" placeholder="Paste image URL and press Enter" onKeyDown={handleGalleryInputKeyDown} className="w-full bg-[#1a1a1a] border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-green-500 text-sm" />
                                            </div>

                                            <div className="pt-4 border-t border-slate-800">
                                                <label className="block text-sm font-medium text-slate-400 mb-3">Video URLs (Optional - YouTube)</label>
                                                <div className="space-y-2 mb-3">
                                                    {(formData.videoUrls || []).map((vid, idx) => (
                                                        <div key={idx} className="flex items-center gap-2 bg-[#1a1a1a] border border-slate-700 p-2 rounded-lg text-sm text-slate-300">
                                                            <span className="truncate flex-1">{vid}</span>
                                                            <button type="button" onClick={() => setFormData({...formData, videoUrls: formData.videoUrls.filter((_, i) => i !== idx)})} className="text-red-400 hover:text-red-300 p-1"><X size={14}/></button>
                                                        </div>
                                                    ))}
                                                </div>
                                                <input type="url" placeholder="Paste YouTube URL and press Enter" onKeyDown={handleVideoInputKeyDown} className="w-full bg-[#1a1a1a] border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-green-500 text-sm" />
                                            </div>

                                        </div>
                                    </section>

                                    {/* Section F: Internal */}
                                    <section className="bg-[#111] p-6 rounded-2xl border border-slate-800">
                                        <h4 className="text-sm font-bold text-green-400 uppercase tracking-wider mb-6 pb-2 border-b border-slate-800">Section F — Internal Notes</h4>
                                        <textarea rows="3" placeholder="Vendor details, internal references (never shown to users)" className="w-full bg-[#1a1a1a] border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-green-500 resize-none" value={formData.vendorNotes} onChange={e => setFormData({ ...formData, vendorNotes: e.target.value })}></textarea>
                                    </section>

                                </form>
                            </div>

                            {/* Footer Buttons */}
                            <div className="px-6 py-5 border-t border-slate-800 bg-[#111] flex justify-end gap-4 shrink-0 rounded-b-2xl">
                                <button type="button" onClick={handleCloseModal} className="px-6 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white font-medium transition-colors">Cancel</button>
                                <button type="button" onClick={e => handleSubmit(e, true)} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors border border-slate-700">Save as Draft</button>
                                <button type="button" onClick={e => handleSubmit(e, false)} className="px-8 py-2.5 bg-green-600 hover:bg-green-500 text-black rounded-xl font-bold transition-all shadow-lg hover:shadow-green-500/20">Save & Publish →</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Quick Add City Modal */}
            <AnimatePresence>
                {isCityModalOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#111] border border-slate-800 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-white mb-4">Add New City</h3>
                                <input type="text" placeholder="e.g. Ahmedabad" className="w-full bg-[#1a1a1a] border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-green-500 mb-6" value={newCityName} onChange={e => setNewCityName(e.target.value)} autoFocus />
                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={() => setIsCityModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white transition-colors">Cancel</button>
                                    <button type="button" onClick={addNewCity} className="px-5 py-2 bg-green-600 hover:bg-green-500 text-black font-bold rounded-lg transition-colors">Add</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default AdminTransportVehicles;
