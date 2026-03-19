import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Car, Search, Plus, Edit3, Trash2, Copy, Eye, EyeOff,
    X, Save, Loader2, Users, MapPin, Tag, ChevronDown, AlertTriangle
} from 'lucide-react';
import { getCars, addCar, updateCar, deleteCar, toggleCarStatus, duplicateCar } from '../../../services/carService';
import ImageUploadField from './ImageUploadField';

const CAR_TYPES = ['sedan', 'suv', 'muv', 'tempo', 'luxury'];
const PRICING_TYPES = [
    { value: 'perKm', label: 'Per Km' },
    { value: 'perDay', label: 'Per Day' },
    { value: 'perTrip', label: 'Per Trip' },
    { value: 'all', label: 'All 3' }
];
const FEATURE_SUGGESTIONS = ['AC', 'GPS', 'Music System', 'Water Bottle', 'First Aid Kit', 'Phone Charger', 'Child Seat Available', 'WiFi', 'Reclining Seats'];

const EMPTY_FORM = {
    name: '',
    type: 'sedan',
    seatingCapacity: 4,
    city: '',
    description: '',
    features: [],
    photos: [],
    pricing: { perKm: null, perDay: null, perTrip: null, pricingType: 'perKm' },
    isActive: true
};

const AdminCars = () => {
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterCity, setFilterCity] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    // Drawer state
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingCar, setEditingCar] = useState(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [saving, setSaving] = useState(false);
    const [featureInput, setFeatureInput] = useState('');
    const [showFeatureSuggestions, setShowFeatureSuggestions] = useState(false);

    // Delete confirmation
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // ── Load Cars ──
    const loadCars = async () => {
        setLoading(true);
        try {
            const data = await getCars();
            setCars(data);
        } catch (err) {
            console.error('Failed to load cars:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadCars(); }, []);

    // ── Derived data ──
    const cities = useMemo(() => {
        const set = new Set(cars.map(c => c.city).filter(Boolean));
        return [...set].sort();
    }, [cars]);

    const filteredCars = useMemo(() => {
        return cars.filter(c => {
            const term = searchTerm.toLowerCase();
            const matchesSearch = !term || c.name?.toLowerCase().includes(term);
            const matchesType = filterType === 'all' || c.type === filterType;
            const matchesCity = filterCity === 'all' || c.city === filterCity;
            const matchesStatus = filterStatus === 'all' ||
                (filterStatus === 'active' && c.isActive) ||
                (filterStatus === 'hidden' && !c.isActive);
            return matchesSearch && matchesType && matchesCity && matchesStatus;
        });
    }, [cars, searchTerm, filterType, filterCity, filterStatus]);

    // ── Form helpers ──
    const openAddDrawer = () => {
        setEditingCar(null);
        setForm({ ...EMPTY_FORM, features: [], photos: [] });
        setIsDrawerOpen(true);
    };

    const openEditDrawer = (car) => {
        setEditingCar(car);
        setForm({
            name: car.name || '',
            type: car.type || 'sedan',
            seatingCapacity: car.seatingCapacity || 4,
            city: car.city || '',
            description: car.description || '',
            features: [...(car.features || [])],
            photos: [...(car.photos || [])],
            pricing: { ...EMPTY_FORM.pricing, ...(car.pricing || {}) },
            isActive: car.isActive !== false
        });
        setIsDrawerOpen(true);
    };

    const closeDrawer = () => {
        setIsDrawerOpen(false);
        setEditingCar(null);
    };

    const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
    const updatePricing = (field, value) => setForm(prev => ({
        ...prev,
        pricing: { ...prev.pricing, [field]: value }
    }));

    // ── Feature tag input ──
    const addFeature = (feature) => {
        const trimmed = feature.trim();
        if (trimmed && !form.features.includes(trimmed)) {
            updateForm('features', [...form.features, trimmed]);
        }
        setFeatureInput('');
        setShowFeatureSuggestions(false);
    };

    const removeFeature = (feature) => {
        updateForm('features', form.features.filter(f => f !== feature));
    };

    const handleFeatureKeyDown = (e) => {
        if (e.key === 'Enter' && featureInput.trim()) {
            e.preventDefault();
            addFeature(featureInput);
        }
    };

    // ── Photos ──
    const addPhoto = (url) => {
        if (url && form.photos.length < 6) {
            updateForm('photos', [...form.photos, url]);
        }
    };

    const removePhoto = (index) => {
        const updated = [...form.photos];
        updated.splice(index, 1);
        updateForm('photos', updated);
    };

    // ── Save ──
    const handleSave = async () => {
        if (!form.name || !form.seatingCapacity) return;
        setSaving(true);
        try {
            const data = {
                name: form.name,
                type: form.type,
                seatingCapacity: Number(form.seatingCapacity),
                city: form.city,
                description: form.description,
                features: form.features,
                photos: form.photos,
                pricing: {
                    pricingType: form.pricing.pricingType,
                    perKm: form.pricing.pricingType === 'perKm' || form.pricing.pricingType === 'all' ? Number(form.pricing.perKm) || null : null,
                    perDay: form.pricing.pricingType === 'perDay' || form.pricing.pricingType === 'all' ? Number(form.pricing.perDay) || null : null,
                    perTrip: form.pricing.pricingType === 'perTrip' || form.pricing.pricingType === 'all' ? Number(form.pricing.perTrip) || null : null,
                },
                isActive: form.isActive
            };

            if (editingCar) {
                await updateCar(editingCar.id, data);
            } else {
                await addCar(data);
            }
            closeDrawer();
            loadCars();
        } catch (err) {
            console.error('Save failed:', err);
            alert('Failed to save car');
        } finally {
            setSaving(false);
        }
    };

    // ── Toggle Status ──
    const handleToggleStatus = async (car) => {
        try {
            await toggleCarStatus(car.id, !car.isActive);
            setCars(prev => prev.map(c => c.id === car.id ? { ...c, isActive: !c.isActive } : c));
        } catch (err) {
            console.error('Toggle failed:', err);
        }
    };

    // ── Delete ──
    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await deleteCar(deleteTarget.id);
            setDeleteTarget(null);
            loadCars();
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Failed to delete car');
        } finally {
            setDeleting(false);
        }
    };

    // ── Duplicate ──
    const handleDuplicate = async (car) => {
        try {
            await duplicateCar(car.id);
            loadCars();
        } catch (err) {
            console.error('Duplicate failed:', err);
        }
    };

    // ── Pricing display ──
    const getPricingDisplay = (car) => {
        const p = car.pricing;
        if (!p) return '—';
        const parts = [];
        if (p.perKm) parts.push(`₹${p.perKm}/km`);
        if (p.perDay) parts.push(`₹${p.perDay}/day`);
        if (p.perTrip) parts.push(`₹${p.perTrip}/trip`);
        return parts.join(' · ') || '—';
    };

    if (loading) return (
        <div className="flex justify-center items-center h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
    );

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Car className="text-blue-500" /> Manage Cars
                    </h2>
                    <p className="text-slate-400 text-sm">Add, edit and manage cars for "With Driver" bookings.</p>
                </div>
                <button
                    onClick={openAddDrawer}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-blue-500/20"
                >
                    <Plus size={18} /> Add Car
                </button>
            </div>

            {/* Filters */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Search</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search by name..."
                            className="w-full bg-[#111] border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="w-full md:w-36">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
                    <select className="w-full bg-[#111] border border-slate-800 rounded-lg px-3 py-2.5 text-white text-sm capitalize" value={filterType} onChange={e => setFilterType(e.target.value)}>
                        <option value="all">All Types</option>
                        {CAR_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                    </select>
                </div>
                <div className="w-full md:w-36">
                    <label className="block text-xs font-medium text-slate-500 mb-1">City</label>
                    <select className="w-full bg-[#111] border border-slate-800 rounded-lg px-3 py-2.5 text-white text-sm" value={filterCity} onChange={e => setFilterCity(e.target.value)}>
                        <option value="all">All Cities</option>
                        {cities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="w-full md:w-36">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                    <select className="w-full bg-[#111] border border-slate-800 rounded-lg px-3 py-2.5 text-white text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="all">All</option>
                        <option value="active">Active</option>
                        <option value="hidden">Hidden</option>
                    </select>
                </div>
            </div>

            {/* Cars Table / Empty */}
            <div className="bg-[#111] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                {filteredCars.length === 0 ? (
                    <div className="py-24 text-center">
                        <Car size={48} className="mx-auto mb-4 text-slate-700" />
                        <h3 className="text-lg font-bold text-slate-300">{cars.length === 0 ? 'No cars added yet' : 'No cars match your filters'}</h3>
                        <p className="text-slate-500 text-sm mt-1">{cars.length === 0 ? 'Click "Add Car" to get started.' : 'Try adjusting your filters.'}</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden lg:block overflow-x-auto overflow-y-auto max-h-[60vh] custom-scrollbar">
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead className="bg-[#1a1a1a] border-b border-slate-800 text-slate-400 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-wider text-xs">Photo</th>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-wider text-xs">Name</th>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-wider text-xs">Type</th>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-wider text-xs">Capacity</th>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-wider text-xs">City</th>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-wider text-xs">Pricing</th>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-wider text-xs">Status</th>
                                        <th className="px-5 py-4 font-semibold uppercase tracking-wider text-xs text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {filteredCars.map(car => (
                                        <tr key={car.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-5 py-3">
                                                <div className="w-14 h-10 rounded-lg overflow-hidden bg-slate-900 border border-slate-800">
                                                    {car.photos?.[0] ? (
                                                        <img src={car.photos[0]} alt={car.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center"><Car size={16} className="text-slate-700" /></div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3"><p className="font-bold text-white truncate max-w-[180px]">{car.name}</p></td>
                                            <td className="px-5 py-3">
                                                <span className="uppercase text-[10px] font-bold bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/20">{car.type}</span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="flex items-center gap-1 text-slate-300"><Users size={14} className="text-slate-500" /> {car.seatingCapacity}</span>
                                            </td>
                                            <td className="px-5 py-3"><span className="text-slate-300">{car.city || '—'}</span></td>
                                            <td className="px-5 py-3"><span className="text-sm text-slate-300">{getPricingDisplay(car)}</span></td>
                                            <td className="px-5 py-3">
                                                <button
                                                    onClick={() => handleToggleStatus(car)}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${car.isActive ? 'bg-green-600' : 'bg-slate-700'}`}
                                                >
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${car.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                                                </button>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => openEditDrawer(car)} className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white" title="Edit">
                                                        <Edit3 size={14} />
                                                    </button>
                                                    <button onClick={() => handleDuplicate(car)} className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white" title="Duplicate">
                                                        <Copy size={14} />
                                                    </button>
                                                    <button onClick={() => setDeleteTarget(car)} className="p-2 hover:bg-red-500/10 rounded-lg transition text-slate-400 hover:text-red-400" title="Delete">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="lg:hidden divide-y divide-slate-800/50 max-h-[70vh] overflow-y-auto">
                            {filteredCars.map(car => (
                                <div key={car.id} className="p-4 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-16 h-12 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
                                            {car.photos?.[0] ? <img src={car.photos[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Car size={16} className="text-slate-700" /></div>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-white truncate">{car.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="uppercase text-[10px] font-bold bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">{car.type}</span>
                                                <span className="text-xs text-slate-400">{car.seatingCapacity} seats</span>
                                            </div>
                                        </div>
                                        <button onClick={() => handleToggleStatus(car)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ${car.isActive ? 'bg-green-600' : 'bg-slate-700'}`}>
                                            <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform shadow ${car.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => openEditDrawer(car)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1 transition border border-slate-700"><Edit3 size={14} /> Edit</button>
                                        <button onClick={() => handleDuplicate(car)} className="bg-slate-800 hover:bg-slate-700 text-white py-2 px-3 rounded-lg transition border border-slate-700"><Copy size={14} /></button>
                                        <button onClick={() => setDeleteTarget(car)} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 px-3 rounded-lg transition border border-red-500/20"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* ══ ADD / EDIT DRAWER ══ */}
            <AnimatePresence>
                {isDrawerOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[50] flex justify-end" onClick={closeDrawer}>
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="bg-[#0a0a0a] border-l border-slate-800 w-full md:w-[560px] h-full shadow-2xl flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Drawer Header */}
                            <div className="py-5 px-6 border-b border-slate-800 bg-[#111] flex justify-between items-center shrink-0">
                                <h3 className="text-xl font-bold text-white">{editingCar ? 'Edit Car' : 'Add New Car'}</h3>
                                <button onClick={closeDrawer} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition"><X size={20} /></button>
                            </div>

                            {/* Drawer Body */}
                            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Car Name *</label>
                                    <input type="text" value={form.name} onChange={e => updateForm('name', e.target.value)} placeholder="e.g. Toyota Innova Crysta" className="w-full bg-black/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 transition text-sm" />
                                </div>

                                {/* Type + Capacity */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Type *</label>
                                        <select value={form.type} onChange={e => updateForm('type', e.target.value)} className="w-full bg-black/50 border border-slate-700 rounded-xl px-4 py-3 text-white capitalize text-sm">
                                            {CAR_TYPES.map(t => <option key={t} value={t} className="capitalize">{t === 'muv' ? 'MUV/Innova' : t === 'tempo' ? 'Tempo Traveller' : t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Seats *</label>
                                        <input type="number" min={1} max={50} value={form.seatingCapacity} onChange={e => updateForm('seatingCapacity', e.target.value)} className="w-full bg-black/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm" />
                                    </div>
                                </div>

                                {/* City */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">City</label>
                                    <input type="text" value={form.city} onChange={e => updateForm('city', e.target.value)} placeholder="e.g. Ahmedabad" className="w-full bg-black/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm" />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Description</label>
                                    <textarea rows={3} value={form.description} onChange={e => updateForm('description', e.target.value)} placeholder="Brief description of the car..." className="w-full bg-black/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm resize-none" />
                                </div>

                                {/* Features (Tag Input) */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Features</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {form.features.map((f, i) => (
                                            <span key={i} className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/20">
                                                {f}
                                                <button onClick={() => removeFeature(f)} className="hover:text-red-400 transition"><X size={12} /></button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={featureInput}
                                            onChange={e => { setFeatureInput(e.target.value); setShowFeatureSuggestions(true); }}
                                            onKeyDown={handleFeatureKeyDown}
                                            onFocus={() => setShowFeatureSuggestions(true)}
                                            onBlur={() => setTimeout(() => setShowFeatureSuggestions(false), 200)}
                                            placeholder="Type and press Enter..."
                                            className="w-full bg-black/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 transition"
                                        />
                                        {showFeatureSuggestions && (
                                            <div className="absolute top-full left-0 w-full mt-1 bg-[#1a1a1a] border border-slate-700 rounded-xl shadow-2xl z-20 max-h-40 overflow-y-auto">
                                                {FEATURE_SUGGESTIONS.filter(s => !form.features.includes(s) && s.toLowerCase().includes(featureInput.toLowerCase())).map(s => (
                                                    <button key={s} onMouseDown={() => addFeature(s)} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition">{s}</button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Photos */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Photos ({form.photos.length}/6)</label>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {form.photos.map((url, i) => (
                                            <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 group">
                                                <img src={url} alt="" className="w-full h-full object-cover" />
                                                <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><X size={10} className="text-white" /></button>
                                            </div>
                                        ))}
                                    </div>
                                    {form.photos.length < 6 && (
                                        <ImageUploadField
                                            value=""
                                            onChange={(url) => addPhoto(url)}
                                            storagePath={`iy_cars/${editingCar?.id || 'new'}`}
                                            label=""
                                        />
                                    )}
                                </div>

                                {/* Pricing */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Pricing</label>
                                    <div className="grid grid-cols-4 gap-2 mb-3">
                                        {PRICING_TYPES.map(pt => (
                                            <button
                                                key={pt.value}
                                                onClick={() => updatePricing('pricingType', pt.value)}
                                                className={`py-2 rounded-lg text-xs font-bold border transition-all ${form.pricing.pricingType === pt.value ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600'}`}
                                            >
                                                {pt.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        {(form.pricing.pricingType === 'perKm' || form.pricing.pricingType === 'all') && (
                                            <div className="flex items-center gap-3">
                                                <span className="text-slate-500 text-sm w-16 shrink-0">Per Km</span>
                                                <div className="flex-1 relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₹</span>
                                                    <input type="number" value={form.pricing.perKm || ''} onChange={e => updatePricing('perKm', e.target.value)} placeholder="0" className="w-full bg-black/50 border border-slate-700 rounded-xl pl-7 pr-4 py-2.5 text-white text-sm" />
                                                </div>
                                            </div>
                                        )}
                                        {(form.pricing.pricingType === 'perDay' || form.pricing.pricingType === 'all') && (
                                            <div className="flex items-center gap-3">
                                                <span className="text-slate-500 text-sm w-16 shrink-0">Per Day</span>
                                                <div className="flex-1 relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₹</span>
                                                    <input type="number" value={form.pricing.perDay || ''} onChange={e => updatePricing('perDay', e.target.value)} placeholder="0" className="w-full bg-black/50 border border-slate-700 rounded-xl pl-7 pr-4 py-2.5 text-white text-sm" />
                                                </div>
                                            </div>
                                        )}
                                        {(form.pricing.pricingType === 'perTrip' || form.pricing.pricingType === 'all') && (
                                            <div className="flex items-center gap-3">
                                                <span className="text-slate-500 text-sm w-16 shrink-0">Per Trip</span>
                                                <div className="flex-1 relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₹</span>
                                                    <input type="number" value={form.pricing.perTrip || ''} onChange={e => updatePricing('perTrip', e.target.value)} placeholder="0" className="w-full bg-black/50 border border-slate-700 rounded-xl pl-7 pr-4 py-2.5 text-white text-sm" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Status Toggle */}
                                <div className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
                                    <div>
                                        <p className="text-white font-medium text-sm">Status</p>
                                        <p className="text-slate-500 text-xs">{form.isActive ? 'Visible to customers' : 'Hidden from customers'}</p>
                                    </div>
                                    <button
                                        onClick={() => updateForm('isActive', !form.isActive)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${form.isActive ? 'bg-green-600' : 'bg-slate-700'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform shadow ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </div>

                            {/* Drawer Footer */}
                            <div className="py-4 px-6 border-t border-slate-800 bg-[#111] shrink-0 flex gap-3">
                                <button onClick={closeDrawer} className="flex-1 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 font-bold transition text-sm border border-slate-700">Cancel</button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving || !form.name}
                                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold transition text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    {editingCar ? 'Update' : 'Add Car'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ══ DELETE CONFIRMATION ══ */}
            <AnimatePresence>
                {deleteTarget && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center" onClick={() => setDeleteTarget(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-[#1a1a1a] border border-slate-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                                    <AlertTriangle className="text-red-500" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Delete Car</h3>
                                    <p className="text-slate-400 text-sm">This action cannot be undone.</p>
                                </div>
                            </div>
                            <p className="text-slate-300 mb-6 text-sm">
                                Are you sure you want to delete <strong className="text-white">{deleteTarget.name}</strong>? All associated photos will also be removed.
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 font-bold transition text-sm border border-slate-700">Cancel</button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminCars;
