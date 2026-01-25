import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, Users, DollarSign, Save, X } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { createDepartureModel } from '../../../services/db_schema';

const AdminDepartureManager = ({ packageId, packageTitle, onClose }) => {
    const [departures, setDepartures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newDate, setNewDate] = useState('');
    const [seats, setSeats] = useState(20);
    const [price, setPrice] = useState(0);

    const fetchDepartures = async () => {
        if (!packageId) return;
        setLoading(true);
        try {
            const q = query(collection(db, 'departures'), where('packageId', '==', packageId));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Sort by date asc
            data.sort((a, b) => new Date(a.date) - new Date(b.date));
            setDepartures(data);
        } catch (error) {
            console.error("Error fetching departures:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartures();
    }, [packageId]);

    const handleAddDeparture = async (e) => {
        e.preventDefault();
        try {
            const newDeparture = createDepartureModel({
                packageId,
                date: newDate,
                totalSeats: parseInt(seats),
                price: parseFloat(price),
                status: 'open'
            });
            await addDoc(collection(db, 'departures'), newDeparture);
            setNewDate('');
            fetchDepartures(); // Refresh
        } catch (error) {
            console.error("Error adding departure:", error);
            alert("Failed to add departure");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this departure?")) return;
        try {
            await deleteDoc(doc(db, 'departures', id));
            setDepartures(departures.filter(d => d.id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#111] border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-white">Manage Departures</h3>
                        <p className="text-sm text-slate-400">For {packageTitle}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
                    {/* ADD FORM */}
                    <form onSubmit={handleAddDeparture} className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[150px]">
                            <label className="text-xs text-slate-500 uppercase block mb-1">Date</label>
                            <input
                                type="date"
                                required
                                value={newDate}
                                onChange={(e) => setNewDate(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="w-24">
                            <label className="text-xs text-slate-500 uppercase block mb-1">Seats</label>
                            <input
                                type="number"
                                value={seats}
                                onChange={(e) => setSeats(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white outline-none"
                            />
                        </div>
                        <div className="w-32">
                            <label className="text-xs text-slate-500 uppercase block mb-1">Price (Override)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="Default"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg pl-6 pr-3 py-2 text-white outline-none"
                                />
                            </div>
                        </div>
                        <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center gap-2 transition-colors">
                            <Plus size={18} /> Add
                        </button>
                    </form>

                    {/* LIST */}
                    {loading ? (
                        <div className="text-center py-8 text-slate-500">Loading availability...</div>
                    ) : listDepartures(departures, handleDelete)}
                </div>
            </div>
        </div>
    );
};

const listDepartures = (departures, onDelete) => {
    if (departures.length === 0) return <div className="text-center py-8 text-slate-500">No departures scheduled.</div>;

    return (
        <div className="space-y-2">
            {departures.map(dept => (
                <div key={dept.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <Calendar size={18} />
                        </div>
                        <div>
                            <p className="font-bold text-white">{new Date(dept.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                            <p className="text-xs text-slate-400 capitalize">{dept.status} • {dept.bookedSeats}/{dept.totalSeats} Booked</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {dept.price > 0 && (
                            <div className="text-right">
                                <p className="text-xs text-slate-500 uppercase">Price</p>
                                <p className="font-mono text-green-400">₹{dept.price}</p>
                            </div>
                        )}
                        <button onClick={() => onDelete(dept.id)} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AdminDepartureManager;
