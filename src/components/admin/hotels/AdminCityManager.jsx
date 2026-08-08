import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, Plus, Edit2, Trash2, Save, X, Eye, EyeOff, Sparkles, Image as ImageIcon,
    ArrowUp, ArrowDown, Building2, Loader2, CheckCircle2, Globe
} from 'lucide-react';
import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../../firebase';

// ─── Pre-seeded Bloom city list ───────────────────────────────────────────────
const BLOOM_CITIES = [
    { name: 'Ahmedabad',  state: 'Gujarat',           image: 'https://images.unsplash.com/photo-1599030290007-a0b7de29e52e?w=600' },
    { name: 'Amritsar',   state: 'Punjab',             image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600' },
    { name: 'Bengaluru',  state: 'Karnataka',          image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=600' },
    { name: 'Chennai',    state: 'Tamil Nadu',         image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600' },
    { name: 'Delhi',      state: 'Delhi',              image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600' },
    { name: 'Goa',        state: 'Goa',                image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600' },
    { name: 'Gurugram',   state: 'Haryana',            image: 'https://images.unsplash.com/photo-1599030290007-a0b7de29e52e?w=600' },
    { name: 'Hyderabad',  state: 'Telangana',          image: 'https://images.unsplash.com/photo-1599030290007-a0b7de29e52e?w=600' },
    { name: 'Jaipur',     state: 'Rajasthan',          image: 'https://images.unsplash.com/photo-1599030290007-a0b7de29e52e?w=600' },
    { name: 'Jalandhar',  state: 'Punjab',             image: 'https://images.unsplash.com/photo-1599030290007-a0b7de29e52e?w=600' },
    { name: 'Jammu',      state: 'Jammu & Kashmir',    image: 'https://images.unsplash.com/photo-1599030290007-a0b7de29e52e?w=600' },
    { name: 'Kakinada',   state: 'Andhra Pradesh',     image: 'https://images.unsplash.com/photo-1599030290007-a0b7de29e52e?w=600' },
    { name: 'Katra',      state: 'Jammu & Kashmir',    image: 'https://images.unsplash.com/photo-1599030290007-a0b7de29e52e?w=600' },
    { name: 'Kochi',      state: 'Kerala',             image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600' },
    { name: 'Lonavala',   state: 'Maharashtra',        image: 'https://images.unsplash.com/photo-1599030290007-a0b7de29e52e?w=600' },
    { name: 'Mumbai',     state: 'Maharashtra',        image: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=600' },
    { name: 'Navi Mumbai',state: 'Maharashtra',        image: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=600' },
    { name: 'Noida',      state: 'Uttar Pradesh',      image: 'https://images.unsplash.com/photo-1599030290007-a0b7de29e52e?w=600' },
    { name: 'Pune',       state: 'Maharashtra',        image: 'https://images.unsplash.com/photo-1599030290007-a0b7de29e52e?w=600' },
    { name: 'Ranchi',     state: 'Jharkhand',          image: 'https://images.unsplash.com/photo-1599030290007-a0b7de29e52e?w=600' },
    { name: 'Rishikesh',  state: 'Uttarakhand',        image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600' },
    { name: 'Srinagar',   state: 'Jammu & Kashmir',    image: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=600' },
    { name: 'Udaipur',    state: 'Rajasthan',          image: 'https://images.unsplash.com/photo-1599030290007-a0b7de29e52e?w=600' },
];

const toSlug = (name) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

const EMPTY_CITY = {
    name: '',
    state: '',
    image: '',
    description: '',
    isActive: true,
    displayOrder: 99,
    partner: 'bloom',
};

// ─── City Form Modal ──────────────────────────────────────────────────────────
const CityFormModal = ({ city, onSave, onClose }) => {
    const [form, setForm] = useState(city || EMPTY_CITY);
    const [saving, setSaving] = useState(false);

    const handle = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        setSaving(true);
        const slug = city?.id || toSlug(form.name);
        await onSave(slug, { ...form, id: slug });
        setSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
                <div className="flex items-center justify-between p-5 border-b border-white/10">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <MapPin size={18} className="text-amber-400" />
                        {city ? 'Edit City' : 'Add New City'}
                    </h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={submit} className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block font-medium">City Name *</label>
                            <input
                                name="name"
                                value={form.name}
                                onChange={handle}
                                required
                                placeholder="e.g. Mumbai"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500/50"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block font-medium">State *</label>
                            <input
                                name="state"
                                value={form.state}
                                onChange={handle}
                                required
                                placeholder="e.g. Maharashtra"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500/50"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-slate-400 mb-1 block font-medium">City Image URL</label>
                        <input
                            name="image"
                            value={form.image}
                            onChange={handle}
                            placeholder="https://..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500/50"
                        />
                        {form.image && (
                            <img src={form.image} alt="preview" className="mt-2 h-24 w-full object-cover rounded-xl border border-white/10" />
                        )}
                    </div>

                    <div>
                        <label className="text-xs text-slate-400 mb-1 block font-medium">Short Description</label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handle}
                            rows={2}
                            placeholder="Brief description shown on city card..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500/50 resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block font-medium">Partner</label>
                            <select
                                name="partner"
                                value={form.partner}
                                onChange={handle}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500/50"
                            >
                                <option value="bloom">Bloom Hotels</option>
                                <option value="iy">IY Direct</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block font-medium">Display Order</label>
                            <input
                                name="displayOrder"
                                type="number"
                                value={form.displayOrder}
                                onChange={handle}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500/50"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={form.isActive}
                                onChange={handle}
                                className="w-4 h-4 accent-amber-500"
                            />
                            <span className="text-sm text-slate-300">Active (visible on website)</span>
                        </label>
                    </div>

                    <div className="flex gap-3 pt-2 border-t border-white/10">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-sm font-medium border border-white/10 transition-colors">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {saving ? 'Saving…' : 'Save City'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminCityManager = () => {
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalCity, setModalCity] = useState(undefined); // undefined = closed, null = new, obj = edit
    const [seeding, setSeeding] = useState(false);
    const [seedDone, setSeedDone] = useState(false);

    const fetchCities = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, 'hotel_cities'));
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            data.sort((a, b) => (a.displayOrder ?? 99) - (b.displayOrder ?? 99) || a.name.localeCompare(b.name));
            setCities(data);
        } catch (err) {
            console.error('Error fetching cities:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCities(); }, []);

    const handleSave = async (slug, data) => {
        await setDoc(doc(db, 'hotel_cities', slug), data, { merge: true });
        await fetchCities();
    };

    const handleDelete = async (id) => {
        if (!window.confirm(`Delete city "${id}"? This won't delete hotels in this city.`)) return;
        await deleteDoc(doc(db, 'hotel_cities', id));
        await fetchCities();
    };

    const toggleActive = async (city) => {
        await setDoc(doc(db, 'hotel_cities', city.id), { isActive: !city.isActive }, { merge: true });
        await fetchCities();
    };

    const seedBloomCities = async () => {
        if (!window.confirm(`This will add all ${BLOOM_CITIES.length} Bloom partner cities to your database. Continue?`)) return;
        setSeeding(true);
        try {
            const batch = writeBatch(db);
            BLOOM_CITIES.forEach((city, i) => {
                const slug = toSlug(city.name);
                const ref = doc(db, 'hotel_cities', slug);
                batch.set(ref, {
                    id: slug,
                    name: city.name,
                    state: city.state,
                    image: city.image,
                    description: '',
                    isActive: true,
                    displayOrder: i + 1,
                    partner: 'bloom',
                }, { merge: true });
            });
            await batch.commit();
            await fetchCities();
            setSeedDone(true);
            setTimeout(() => setSeedDone(false), 3000);
        } catch (err) {
            console.error('Seed error:', err);
            alert('Error seeding cities: ' + err.message);
        } finally {
            setSeeding(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 p-5 rounded-2xl border border-white/10">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Globe className="text-amber-400" size={20} /> City Management
                    </h3>
                    <p className="text-slate-400 text-sm mt-0.5">
                        {cities.length} cities • {cities.filter(c => c.isActive).length} active
                    </p>
                </div>
                <div className="flex gap-3 flex-wrap">
                    <button
                        onClick={seedBloomCities}
                        disabled={seeding}
                        className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-60"
                    >
                        {seeding ? <Loader2 size={15} className="animate-spin" /> : seedDone ? <CheckCircle2 size={15} className="text-green-400" /> : <Sparkles size={15} />}
                        {seedDone ? 'Done!' : seeding ? 'Adding…' : 'Add All 23 Bloom Cities'}
                    </button>
                    <button
                        onClick={() => setModalCity(null)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
                    >
                        <Plus size={15} /> Add City
                    </button>
                </div>
            </div>

            {/* City Grid */}
            {loading ? (
                <div className="text-center py-16 text-slate-500">Loading cities…</div>
            ) : cities.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10 border-dashed">
                    <MapPin className="mx-auto text-slate-600 mb-4" size={48} />
                    <p className="text-slate-400 text-lg font-medium">No cities yet</p>
                    <p className="text-slate-600 text-sm mb-6">Click "Add All 23 Bloom Cities" to get started instantly.</p>
                    <button
                        onClick={seedBloomCities}
                        disabled={seeding}
                        className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-sm font-bold transition-colors flex items-center gap-2 mx-auto"
                    >
                        <Sparkles size={16} /> Add All Bloom Cities
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {cities.map((city, i) => (
                            <motion.div
                                key={city.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden group hover:border-white/20 transition-all"
                            >
                                {/* City image */}
                                <div className="relative h-36 overflow-hidden">
                                    {city.image ? (
                                        <img src={city.image} alt={city.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                                            <ImageIcon size={32} className="text-zinc-700" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                    <div className="absolute top-3 right-3 flex gap-2">
                                        {city.partner === 'bloom' && (
                                            <span className="px-2 py-0.5 bg-amber-500/90 text-black text-[10px] font-bold rounded-full">BLOOM</span>
                                        )}
                                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${city.isActive ? 'bg-green-500/80 text-white' : 'bg-zinc-600/80 text-zinc-300'}`}>
                                            {city.isActive ? 'ACTIVE' : 'HIDDEN'}
                                        </span>
                                    </div>
                                    <div className="absolute bottom-3 left-3">
                                        <p className="text-white font-bold text-base">{city.name}</p>
                                        <p className="text-zinc-300 text-xs">{city.state}</p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="p-3 flex items-center gap-2 bg-white/5">
                                    <span className="text-xs text-slate-500 flex items-center gap-1 flex-1">
                                        <Building2 size={12} /> ID: {city.id}
                                    </span>
                                    <button
                                        onClick={() => toggleActive(city)}
                                        title={city.isActive ? 'Hide city' : 'Show city'}
                                        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                    >
                                        {city.isActive ? <Eye size={15} /> : <EyeOff size={15} />}
                                    </button>
                                    <button
                                        onClick={() => setModalCity(city)}
                                        className="p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-400 transition-colors"
                                    >
                                        <Edit2 size={15} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(city.id)}
                                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {modalCity !== undefined && (
                    <CityFormModal
                        city={modalCity}
                        onSave={handleSave}
                        onClose={() => setModalCity(undefined)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminCityManager;
