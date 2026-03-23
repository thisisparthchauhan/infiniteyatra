import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../../firebase';
import { Search, Plus, Edit2, Trash2, X, Loader2, CheckCircle2, Ban, Building2, Mail, Phone, Shield } from 'lucide-react';

const AdminVendorManager = () => {
    const [vendors, setVendors] = useState([]);
    const [hotels, setHotels] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        vendorName: '', email: '', phone: '', password: '', hotelIds: [], status: 'active'
    });

    useEffect(() => {
        const unsub1 = onSnapshot(collection(db, 'hotel_vendors'), (snap) => {
            setVendors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
        const unsub2 = onSnapshot(collection(db, 'hotels'), (snap) => {
            setHotels(snap.docs.map(d => ({ id: d.id, name: d.data().name })));
        });
        return () => { unsub1(); unsub2(); };
    }, []);

    const resetForm = () => {
        setFormData({ vendorName: '', email: '', phone: '', password: '', hotelIds: [], status: 'active' });
        setEditing(null);
        setShowForm(false);
    };

    const openEdit = (v) => {
        setFormData({ vendorName: v.vendorName, email: v.email, phone: v.phone || '', password: '', hotelIds: v.hotelIds || [], status: v.status || 'active' });
        setEditing(v);
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!formData.vendorName || !formData.email) return alert('Name and email required');
        setSaving(true);

        try {
            if (editing) {
                // Update existing vendor
                await updateDoc(doc(db, 'hotel_vendors', editing.id), {
                    vendorName: formData.vendorName,
                    phone: formData.phone,
                    hotelIds: formData.hotelIds,
                    status: formData.status,
                    updatedAt: serverTimestamp()
                });
            } else {
                // Create new vendor
                if (!formData.password || formData.password.length < 6) {
                    alert('Password must be at least 6 characters');
                    setSaving(false);
                    return;
                }

                // Create Firebase Auth user
                const cred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);

                // Create vendor document
                await setDoc(doc(db, 'hotel_vendors', cred.user.uid), {
                    uid: cred.user.uid,
                    email: formData.email,
                    vendorName: formData.vendorName,
                    phone: formData.phone,
                    hotelIds: formData.hotelIds,
                    status: formData.status,
                    createdAt: serverTimestamp()
                });
            }
            resetForm();
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                alert('This email is already registered.');
            } else {
                alert('Failed to save vendor: ' + err.message);
            }
        } finally {
            setSaving(false);
        }
    };

    const toggleHotel = (hotelId) => {
        setFormData(prev => ({
            ...prev,
            hotelIds: prev.hotelIds.includes(hotelId)
                ? prev.hotelIds.filter(id => id !== hotelId)
                : [...prev.hotelIds, hotelId]
        }));
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this vendor? Their Firebase Auth account will remain.')) return;
        await deleteDoc(doc(db, 'hotel_vendors', id));
    };

    const filtered = vendors.filter(v =>
        v.vendorName?.toLowerCase().includes(search.toLowerCase()) ||
        v.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Shield className="text-teal-400" /> Vendor Management
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Manage hotel partner accounts</p>
                </div>
                <button onClick={() => { resetForm(); setShowForm(true); }} className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:from-teal-600 hover:to-emerald-700 shadow-lg shadow-teal-500/20">
                    <Plus size={16} /> Add Vendor
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50" placeholder="Search vendors..." />
            </div>

            {/* Vendor Cards */}
            {loading ? (
                <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-teal-400" /></div>
            ) : filtered.length === 0 ? (
                <div className="bg-[#111] border border-white/10 rounded-2xl p-12 text-center">
                    <Building2 size={48} className="text-zinc-700 mx-auto mb-4" />
                    <p className="text-zinc-500">No vendors found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map(v => (
                        <div key={v.id} className="bg-[#111] border border-white/10 rounded-2xl p-5 hover:border-teal-500/30 transition-colors">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-teal-500/20 rounded-full flex items-center justify-center text-teal-400 font-bold">{(v.vendorName || 'V')[0]}</div>
                                    <div>
                                        <p className="font-bold text-white">{v.vendorName}</p>
                                        <p className="text-xs text-zinc-500">{v.email}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${v.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {v.status}
                                </span>
                            </div>
                            <div className="text-xs text-zinc-500 mb-3">
                                {v.phone && <span className="flex items-center gap-1"><Phone size={12} /> {v.phone}</span>}
                                <span>{v.hotelIds?.length || 0} hotel(s) assigned</span>
                            </div>
                            <div className="flex gap-2 pt-3 border-t border-white/10">
                                <button onClick={() => openEdit(v)} className="flex-1 py-2 bg-white/5 text-white rounded-lg text-xs font-medium hover:bg-white/10 flex items-center justify-center gap-1">
                                    <Edit2 size={12} /> Edit
                                </button>
                                <button onClick={() => handleDelete(v.id)} className="py-2 px-3 bg-red-500/10 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/20">
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => resetForm()}>
                    <div className="bg-[#111] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white">{editing ? 'Edit Vendor' : 'Add New Vendor'}</h3>
                            <button onClick={resetForm} className="p-1 hover:bg-white/10 rounded"><X size={18} className="text-slate-400" /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-zinc-400 mb-1 block">Vendor Name *</label>
                                <input value={formData.vendorName} onChange={e => setFormData(p => ({ ...p, vendorName: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50" placeholder="Mr. Rahul Sharma" />
                            </div>
                            <div>
                                <label className="text-sm text-zinc-400 mb-1 block">Email * {editing && <span className="text-xs text-zinc-600">(cannot change)</span>}</label>
                                <input value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} disabled={!!editing} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 disabled:opacity-50" placeholder="vendor@email.com" />
                            </div>
                            <div>
                                <label className="text-sm text-zinc-400 mb-1 block">Phone</label>
                                <input value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50" placeholder="+91 98765 43210" />
                            </div>
                            {!editing && (
                                <div>
                                    <label className="text-sm text-zinc-400 mb-1 block">Password * <span className="text-xs text-zinc-600">(min 6 chars)</span></label>
                                    <input type="text" value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50" placeholder="Initial password" />
                                </div>
                            )}

                            {/* Status */}
                            <div>
                                <label className="text-sm text-zinc-400 mb-2 block">Status</label>
                                <div className="flex gap-3">
                                    {['active', 'suspended'].map(s => (
                                        <button key={s} type="button" onClick={() => setFormData(p => ({ ...p, status: s }))} className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize border transition-colors ${formData.status === s ? (s === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30') : 'bg-white/5 text-zinc-500 border-white/10'}`}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Assign Hotels */}
                            <div>
                                <label className="text-sm text-zinc-400 mb-2 block">Assign Hotels</label>
                                <div className="max-h-48 overflow-y-auto space-y-1 bg-black/20 rounded-xl p-3 border border-white/5">
                                    {hotels.map(h => (
                                        <label key={h.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer text-sm" onClick={() => toggleHotel(h.id)}>
                                            <input type="checkbox" checked={formData.hotelIds.includes(h.id)} readOnly className="w-4 h-4 rounded bg-black/40 border-white/20 text-teal-500" />
                                            <span className="text-white">{h.name}</span>
                                        </label>
                                    ))}
                                    {hotels.length === 0 && <p className="text-zinc-500 text-xs p-2">No hotels in the system</p>}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button onClick={resetForm} className="flex-1 py-2.5 bg-white/5 border border-white/10 text-zinc-400 rounded-xl font-medium text-sm">Cancel</button>
                            <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                                {saving ? <Loader2 size={16} className="animate-spin" /> : editing ? 'Update Vendor' : 'Create Vendor'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminVendorManager;
