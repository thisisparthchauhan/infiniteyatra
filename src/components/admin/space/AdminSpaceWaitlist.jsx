import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Users, Mail, Phone, Calendar, Globe, Trash2, Rocket, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const AdminSpaceWaitlist = () => {
    const [waitlist, setWaitlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const q = query(
            collection(db, 'space_waitlist'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setWaitlist(list);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching waitlist:", error);
            toast.error("Failed to load waitlist data");
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to remove this entry?")) return;
        
        try {
            await deleteDoc(doc(db, 'space_waitlist', id));
            toast.success("Entry removed");
        } catch (error) {
            console.error("Error deleting entry:", error);
            toast.error("Failed to remove entry");
        }
    };

    const filteredList = waitlist.filter(item => 
        (item.firstName + " " + item.lastName).toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.country.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00FFFF]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0a0a0a] p-6 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#7B2FFF]/10 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#00FFFF]/10 rounded-full blur-[80px] pointer-events-none" />
                
                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7B2FFF] to-[#00FFFF] flex items-center justify-center shadow-[0_0_15px_rgba(123,47,255,0.3)]">
                        <Rocket size={24} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-['Orbitron'] font-bold text-white tracking-widest uppercase">IY Space Mission</h2>
                        <p className="text-sm text-slate-400 font-['Exo_2']">Waitlist Participants • {waitlist.length} Total</p>
                    </div>
                </div>

                <div className="relative z-10 w-full md:w-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search names, emails..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-64 bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00FFFF] focus:ring-1 focus:ring-[#00FFFF] transition-all font-['Exo_2']"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-[#0a0a0a] rounded-2xl border border-white/5 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest font-['Orbitron']">Explorer</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest font-['Orbitron']">Contact</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest font-['Orbitron']">Origin</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest font-['Orbitron']">Status / Intent</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest font-['Orbitron'] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-['Exo_2']">
                            {filteredList.map((entry, index) => (
                                <motion.tr 
                                    key={entry.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="hover:bg-white/[0.02] transition-colors group"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border border-white/10">
                                                <Users size={14} className="text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-white">{entry.firstName} {entry.lastName}</p>
                                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                    <Calendar size={10} />
                                                    {entry.dob ? new Date(entry.dob).toLocaleDateString() : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <p className="text-sm text-slate-300 flex items-center gap-2">
                                                <Mail size={12} className="text-slate-500" />
                                                <a href={`mailto:${entry.email}`} className="hover:text-blue-400 transition-colors">{entry.email}</a>
                                            </p>
                                            <p className="text-xs text-slate-500 flex items-center gap-2">
                                                <Phone size={12} className="text-slate-500" />
                                                <a href={`tel:${entry.phone}`} className="hover:text-blue-400 transition-colors">+{entry.phone}</a>
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-300">
                                            <Globe size={14} className="text-[#00FFFF]" />
                                            {entry.country}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 items-start">
                                            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                                                entry.seriousness === 'Ready to deposit' 
                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                    : entry.seriousness === 'Definitely interested'
                                                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                        : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                            }`}>
                                                {entry.seriousness}
                                            </span>
                                            <span className="text-[10px] text-slate-500">
                                                {entry.createdAt ? new Date(entry.createdAt.toDate()).toLocaleDateString() : 'Just now'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => handleDelete(entry.id)}
                                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                            title="Remove Entry"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                            {filteredList.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                        No waitlist entries found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminSpaceWaitlist;
