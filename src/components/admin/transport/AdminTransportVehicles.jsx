import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Car, X, Image as ImageIcon, Eye, EyeOff, Search, MapPin, UploadCloud, Loader2 } from 'lucide-react';
import { getVehicles, addVehicle, updateVehicle, deleteVehicle, getCities } from '../../../services/transportService';
import { storage } from '../../../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const AVAILABLE_FEATURES = ['AC', 'GPS', 'Music System', 'Child Seat', 'First Aid Kit', 'Insurance Included'];

const AdminTransportVehicles = () => {
    const [vehicles, setVehicles] = useState([]);
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterCity, setFilterCity] = useState('all');

    const [formData, setFormData] = useState(getInitialFormData());

    function getInitialFormData() {
        return {
            id: null,
            name: '',
            type: 'car',
            city: '',
            state: '',
            country: 'India',
            pricePerDay: '',
            pricePerHour: '',
            seats: '',
            description: '',
            features: [],
            images: [],
            isActive: true,
            isVisible: true,
            driverIncluded: false,
            fuelIncluded: false,
        };
    }

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [vehiclesData, citiesData] = await Promise.all([
                getVehicles().catch(() => []),
                getCities().catch(() => [])
            ]);
            setVehicles(vehiclesData);
            setCities(citiesData);
        } catch (error) {
            console.error('Error fetching data:', error);
            setVehicles([]);
            setCities([]);
        } finally {
            setLoading(false);
        }
    }

    const handleOpenModal = (vehicle = null) => {
        if (vehicle) {
            setFormData(vehicle);
            setEditMode(true);
        } else {
            setFormData(getInitialFormData());
            setEditMode(false);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => setIsModalOpen(false);

    const handleFeatureToggle = (feature) => {
        const currentFeatures = [...formData.features];
        if (currentFeatures.includes(feature)) {
            setFormData({ ...formData, features: currentFeatures.filter(f => f !== feature) });
        } else {
            setFormData({ ...formData, features: [...currentFeatures, feature] });
        }
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        const uploadedUrls = [];

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const storageRef = ref(storage, `transport/images/${Date.now()}_${file.name}`);
                const uploadTask = uploadBytesResumable(storageRef, file);

                await new Promise((resolve, reject) => {
                    uploadTask.on(
                        'state_changed',
                        null,
                        (error) => reject(error),
                        async () => {
                            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                            uploadedUrls.push(downloadURL);
                            resolve();
                        }
                    );
                });
            }
            setFormData(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
        } catch (error) {
            console.error("Error uploading images:", error);
            alert("Failed to upload images");
        } finally {
            setUploading(false);
            // reset file input
            e.target.value = null;
        }
    };

    const removeImage = (indexToRemove) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, idx) => idx !== indexToRemove)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const submitData = {
                ...formData,
                pricePerDay: Number(formData.pricePerDay),
                pricePerHour: Number(formData.pricePerHour || 0),
                seats: Number(formData.seats)
            };

            // Remove GPS/First Aid Kit text duplication logic if fuel included toggle changes
            // (Driver/Fuel are already explicit booleans on the document + specific icons in UI, 
            // but we can also push them to features array for redundancy if user wants)
            const activeFeatures = new Set(submitData.features);
            if (submitData.driverIncluded) activeFeatures.add("Driver Included");
            if (submitData.fuelIncluded) activeFeatures.add("Fuel Included");
            submitData.features = Array.from(activeFeatures);

            if (editMode) {
                await updateVehicle(submitData.id, submitData);
            } else {
                await addVehicle(submitData);
            }
            handleCloseModal();
            fetchData();
        } catch (error) {
            console.error('Error saving vehicle:', error);
            alert('Failed to save vehicle');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this vehicle?')) {
            try {
                await deleteVehicle(id);
                fetchData();
            } catch (error) {
                console.error('Error deleting vehicle:', error);
                alert('Failed to delete vehicle');
            }
        }
    };

    const toggleVehicleStatus = async (id, currentStatus, field) => {
        try {
            await updateVehicle(id, { [field]: !currentStatus });
            // Optimistic UI update
            setVehicles(prev => prev.map(v => v.id === id ? { ...v, [field]: !currentStatus } : v));
        } catch (error) {
            console.error(`Error toggling ${field}:`, error);
            alert(`Failed to update ${field}`);
        }
    };

    // Derived filtering
    const filteredVehicles = vehicles.filter(v => {
        const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || v.type === filterType;
        const matchesCity = filterCity === 'all' || v.city === filterCity;
        return matchesSearch && matchesType && matchesCity;
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Show empty state when collection is genuinely empty (not just filtered out)
    const isCollectionEmpty = vehicles.length === 0;

    return (
        <div className="p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Car className="text-blue-500" />
                        Manage Vehicles
                    </h2>
                    <p className="text-slate-400">Add or edit vehicles available for rent/booking.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    {/* Search */}
                    <div className="relative flex-1 lg:w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text" placeholder="Search vehicles..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {/* Type Filter */}
                    <select
                        className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                        value={filterType} onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="all">All Types</option>
                        <option value="cycle">Cycle</option>
                        <option value="ebicycle">E-Bicycle</option>
                        <option value="bike">Bike</option>
                        <option value="car">Car</option>
                        <option value="traveller">Traveller</option>
                    </select>
                    {/* City Filter */}
                    <select
                        className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                        value={filterCity} onChange={(e) => setFilterCity(e.target.value)}
                    >
                        <option value="all">All Cities</option>
                        {cities.filter(c => c.isActive).map(c => (
                            <option key={c.id} value={c.cityName}>{c.cityName}</option>
                        ))}
                    </select>

                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-all shadow-lg"
                    >
                        <Plus size={18} /> Add New Vehicle
                    </button>
                </div>
            </div>

            {/* Empty collection state */}
            {isCollectionEmpty && (
                <div className="bg-[#111] border border-white/10 rounded-2xl p-16 text-center">
                    <Car size={56} className="mx-auto mb-4 text-slate-700" />
                    <h3 className="text-xl font-bold text-slate-300 mb-2">No vehicles added yet</h3>
                    <p className="text-slate-500 mb-6">Start building your fleet by adding your first vehicle listing.</p>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg mx-auto"
                    >
                        <Plus size={18} /> Add New Vehicle
                    </button>
                </div>
            )}

            <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-[#1a1a1a] border-b border-white/10 text-slate-400">
                            <tr>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Image</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Name</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Type</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">City</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Price/Day</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs whitespace-nowrap">Status (Active/Hidden)</th>
                                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Bookings</th>
                                <th className="px-6 py-4 text-right font-semibold uppercase tracking-wider text-xs">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredVehicles.map(vehicle => (
                                <tr key={vehicle.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        {vehicle.images?.[0] ? (
                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 border border-white/10">
                                                <img src={vehicle.images[0]} alt={vehicle.name} className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
                                                <ImageIcon size={20} />
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-white">
                                        {vehicle.name}
                                        <div className="text-xs font-normal text-slate-500 mt-0.5">{vehicle.seats} Seats</div>
                                    </td>
                                    <td className="px-6 py-4 capitalize font-medium">{vehicle.type}</td>
                                    <td className="px-6 py-4 font-medium text-slate-400">
                                        <div className="flex items-center gap-1">
                                            <MapPin size={14} className="text-blue-400" />
                                            {vehicle.city}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-white">
                                        ₹{vehicle.pricePerDay}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {/* Active Toggle Switch */}
                                            <button
                                                onClick={() => toggleVehicleStatus(vehicle.id, vehicle.isActive, 'isActive')}
                                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${vehicle.isActive ? 'bg-green-500' : 'bg-slate-600'}`}
                                                title={vehicle.isActive ? "Active" : "Inactive"}
                                            >
                                                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${vehicle.isActive ? 'translate-x-5' : 'translate-x-1'}`} />
                                            </button>

                                            {/* Visible Toggle Icon */}
                                            <button
                                                onClick={() => toggleVehicleStatus(vehicle.id, vehicle.isVisible, 'isVisible')}
                                                className={`p-1.5 rounded-md transition-colors ${vehicle.isVisible ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 bg-slate-800'}`}
                                                title={vehicle.isVisible ? "Visible to users" : "Hidden from users"}
                                            >
                                                {vehicle.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-400">
                                        {vehicle.totalBookings || 0}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => handleOpenModal(vehicle)} className="text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-500/30 p-2 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDelete(vehicle.id)} className="text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/30 p-2 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredVehicles.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-slate-500 text-base">No vehicles match your search.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden divide-y divide-white/10">
                    {filteredVehicles.map(vehicle => (
                        <div key={vehicle.id} className="p-4 space-y-4 hover:bg-white/5 transition-colors">
                            <div className="flex gap-4">
                                <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-white/5 border border-white/10">
                                    {vehicle.images?.[0] ? (
                                        <img src={vehicle.images[0]} alt={vehicle.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-500"><ImageIcon size={20} /></div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-white text-base truncate pr-2">{vehicle.name}</h4>
                                            <div className="text-xs text-slate-400 capitalize mt-0.5">{vehicle.type} • {vehicle.seats} Seats</div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="font-bold text-white">₹{vehicle.pricePerDay}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                                        <MapPin size={12} className="text-blue-400" /> {vehicle.city}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-500 uppercase mb-1">Status</span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => toggleVehicleStatus(vehicle.id, vehicle.isActive, 'isActive')}
                                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${vehicle.isActive ? 'bg-green-500' : 'bg-slate-600'}`}
                                            >
                                                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${vehicle.isActive ? 'translate-x-5' : 'translate-x-1'}`} />
                                            </button>
                                            <button
                                                onClick={() => toggleVehicleStatus(vehicle.id, vehicle.isVisible, 'isVisible')}
                                                className={`p-1 rounded-md transition-colors ${vehicle.isVisible ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 bg-slate-800'}`}
                                            >
                                                {vehicle.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-500 uppercase mb-1">Bookings</span>
                                        <span className="text-sm font-bold text-white">{vehicle.totalBookings || 0}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleOpenModal(vehicle)} className="text-blue-400 hover:text-white bg-blue-500/10 p-2.5 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(vehicle.id)} className="text-red-400 hover:text-white bg-red-500/10 p-2.5 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredVehicles.length === 0 && (
                        <div className="p-8 text-center text-slate-500 text-sm">No vehicles match your search.</div>
                    )}
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center md:p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[#0a0a0a] md:border border-slate-800 w-full h-full md:h-auto md:max-h-[90vh] md:max-w-4xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col"
                        >
                            <div className="flex justify-between items-center px-8 py-5 border-b border-slate-800 bg-[#111] shrink-0">
                                <h3 className="text-2xl font-bold text-white">{editMode ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
                                <button onClick={handleCloseModal} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"><X size={24} /></button>
                            </div>

                            <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                                <form id="vehicleForm" onSubmit={handleSubmit} className="space-y-8 flex flex-col gap-2">

                                    {/* SECTION 1: Bascis */}
                                    <div>
                                        <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4">Basic Information</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                            <div className="lg:col-span-2">
                                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Vehicle Name</label>
                                                <input type="text" required placeholder="e.g. Royal Enfield Classic 350"
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:border-blue-500 transition-colors min-h-[44px]"
                                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Vehicle Type</label>
                                                <select required
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:border-blue-500 transition-colors min-h-[44px]"
                                                    value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}
                                                >
                                                    <option value="cycle">Cycle / E-Bicycle</option>
                                                    <option value="bike">Bike / Scooter</option>
                                                    <option value="car">Car</option>
                                                    <option value="traveller">Traveller / Van</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* SECTION 2: Location */}
                                    <div>
                                        <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4">Location Details</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-1.5">City</label>
                                                <select required
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:border-blue-500 transition-colors min-h-[44px]"
                                                    value={formData.city}
                                                    onChange={e => {
                                                        const selectedCity = cities.find(c => c.cityName === e.target.value);
                                                        setFormData({
                                                            ...formData,
                                                            city: e.target.value,
                                                            state: selectedCity ? selectedCity.stateName : formData.state,
                                                            country: selectedCity ? selectedCity.countryName : formData.country
                                                        });
                                                    }}
                                                >
                                                    <option value="">Select City</option>
                                                    {cities.filter(c => c.isActive).map(c => (
                                                        <option key={c.id} value={c.cityName}>{c.cityName}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-1.5">State</label>
                                                <input type="text" required readOnly
                                                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-400 cursor-not-allowed text-base min-h-[44px]"
                                                    value={formData.state}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Country</label>
                                                <input type="text" required readOnly
                                                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-400 cursor-not-allowed text-base min-h-[44px]"
                                                    value={formData.country}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* SECTION 3: Specs & Pricing */}
                                    <div>
                                        <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4">Specs & Pricing</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Seats / Capacity</label>
                                                <input type="number" required min="1"
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:border-blue-500 transition-colors min-h-[44px]"
                                                    value={formData.seats} onChange={e => setFormData({ ...formData, seats: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Price Per Day (₹)</label>
                                                <input type="number" required min="1"
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:border-blue-500 transition-colors min-h-[44px]"
                                                    value={formData.pricePerDay} onChange={e => setFormData({ ...formData, pricePerDay: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Price Per Hour (₹, Optional)</label>
                                                <input type="number" min="0" placeholder="0"
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:border-blue-500 transition-colors min-h-[44px]"
                                                    value={formData.pricePerHour} onChange={e => setFormData({ ...formData, pricePerHour: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* SECTION 4: Description */}
                                    <div>
                                        <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4">Description</h4>
                                        <textarea rows="4" required placeholder="Describe the vehicle..."
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:border-blue-500 transition-colors resize-none min-h-[44px]"
                                            value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        ></textarea>
                                    </div>

                                    {/* SECTION 5: Form Features Checkboxes */}
                                    <div>
                                        <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4">Features</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 border border-slate-800 bg-slate-900/50 rounded-2xl">
                                            {/* Primary booleans */}
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.driverIncluded ? 'bg-purple-500 border-purple-500' : 'bg-transparent border-slate-500 group-hover:border-purple-400'}`}>
                                                    {formData.driverIncluded && <CheckCircle size={14} className="text-white" />}
                                                </div>
                                                <input type="checkbox" checked={formData.driverIncluded} onChange={e => setFormData({ ...formData, driverIncluded: e.target.checked })} className="hidden" />
                                                <span className="text-sm text-slate-300 font-medium">Driver Included</span>
                                            </label>

                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.fuelIncluded ? 'bg-purple-500 border-purple-500' : 'bg-transparent border-slate-500 group-hover:border-purple-400'}`}>
                                                    {formData.fuelIncluded && <CheckCircle size={14} className="text-white" />}
                                                </div>
                                                <input type="checkbox" checked={formData.fuelIncluded} onChange={e => setFormData({ ...formData, fuelIncluded: e.target.checked })} className="hidden" />
                                                <span className="text-sm text-slate-300 font-medium">Fuel Included</span>
                                            </label>

                                            {AVAILABLE_FEATURES.map(feature => (
                                                <label key={feature} className="flex items-center gap-3 cursor-pointer group">
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.features.includes(feature) ? 'bg-blue-500 border-blue-500' : 'bg-transparent border-slate-500 group-hover:border-blue-400'}`}>
                                                        {formData.features.includes(feature) && <CheckCircle size={14} className="text-white" />}
                                                    </div>
                                                    <input type="checkbox" checked={formData.features.includes(feature)} onChange={() => handleFeatureToggle(feature)} className="hidden" />
                                                    <span className="text-sm text-slate-300 font-medium">{feature}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* SECTION 6: Images (Firebase Storage) */}
                                    <div>
                                        <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                                            <span>Images</span>
                                            <span className="text-xs font-normal text-slate-500 bg-slate-800 px-2 py-1 rounded">Upload multiple</span>
                                        </h4>
                                        <div className="bg-slate-900 border border-slate-700 border-dashed rounded-2xl p-6 text-center">
                                            <input
                                                type="file" multiple accept="image/*"
                                                onChange={handleImageUpload} className="hidden" id="imageUpload"
                                            />
                                            <label htmlFor="imageUpload" className="cursor-pointer flex flex-col items-center justify-center h-32 relative">
                                                {uploading ? (
                                                    <div className="flex flex-col items-center">
                                                        <Loader2 size={32} className="text-blue-500 animate-spin mb-3" />
                                                        <span className="text-slate-400 text-sm font-medium pt-2">Uploading to Firebase Storage...</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="w-14 h-14 bg-blue-500/10 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-500/20 transition-colors">
                                                            <UploadCloud size={28} className="text-blue-400" />
                                                        </div>
                                                        <span className="text-white font-bold mb-1">Click to upload images</span>
                                                        <span className="text-slate-500 text-xs">PNG, JPG, WEBP up to 5MB</span>
                                                    </>
                                                )}
                                            </label>

                                            {/* Preview Grid */}
                                            {formData.images.length > 0 && (
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800">
                                                    {formData.images.map((img, idx) => (
                                                        <div key={idx} className="relative aspect-video rounded-xl border border-slate-700 overflow-hidden group">
                                                            <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                                                            <button
                                                                type="button"
                                                                onClick={(e) => { e.preventDefault(); removeImage(idx); }}
                                                                className="absolute top-2 right-2 bg-black/70 hover:bg-red-600 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* SECTION 7: Status Toggles */}
                                    <div>
                                        <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4">Visibility Toggles</h4>
                                        <div className="flex gap-8 p-5 border border-slate-800 bg-slate-900/50 rounded-2xl">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <button type="button" onClick={() => setFormData({ ...formData, isActive: !formData.isActive })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.isActive ? 'bg-green-500' : 'bg-slate-700'}`}>
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                                                </button>
                                                <span className="text-sm text-white font-medium">Is Active (System)</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <button type="button" onClick={() => setFormData({ ...formData, isVisible: !formData.isVisible })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.isVisible ? 'bg-blue-500' : 'bg-slate-700'}`}>
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isVisible ? 'translate-x-6' : 'translate-x-1'}`} />
                                                </button>
                                                <span className="text-sm text-white font-medium">Visible to Users</span>
                                            </label>
                                        </div>
                                    </div>

                                </form>
                            </div>

                            {/* Footer */}
                            <div className="px-8 py-5 border-t border-slate-800 bg-[#111] flex justify-end gap-4 shrink-0 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)] z-10">
                                <button type="button" onClick={handleCloseModal} className="px-6 py-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white font-bold transition-colors">Cancel</button>
                                <button type="submit" form="vehicleForm" className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-500/30">
                                    {editMode ? 'Save Changes' : 'Create Vehicle Listing'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminTransportVehicles;
