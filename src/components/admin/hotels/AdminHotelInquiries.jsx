import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Search, MessageCircle, Check, X, Eye, Download, Filter, Clock, CheckCircle2, XCircle, DollarSign, Users } from 'lucide-react';
import { addCredits } from '../../../services/passportService';

const STATUS_COLORS = {
    pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/20',
    confirmed: 'bg-green-500/20 text-green-300 border-green-500/20',
    cancelled: 'bg-red-500/20 text-red-300 border-red-500/20',
    completed: 'bg-blue-500/20 text-blue-300 border-blue-500/20'
};

// Credits per night based on hotel category
const CREDIT_MAP = {
    'Budget': 50, '3 Star': 50, '4 Star': 100, '5 Star': 150, 'Luxury': 150
};

const AdminHotelInquiries = () => {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedInquiry, setSelectedInquiry] = useState(null);

    useEffect(() => {
        const q = query(collection(db, 'hotel_inquiries'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setInquiries(data);
            setLoading(false);
        }, (err) => {
            console.error('Error fetching inquiries:', err);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const updateStatus = async (id, status) => {
        try {
            await updateDoc(doc(db, 'hotel_inquiries', id), {
                status,
                updatedAt: serverTimestamp()
            });

            // Award passport credits on confirmation
            if (status === 'confirmed') {
                const inq = inquiries.find(i => i.id === id);
                if (inq) {
                    try {
                        // Try to find the user who made the booking by looking up hotel data for category
                        let category = '3 Star'; // default
                        if (inq.hotelId) {
                            const hotelSnap = await getDoc(doc(db, 'hotels', inq.hotelId));
                            if (hotelSnap.exists()) {
                                category = hotelSnap.data().category || '3 Star';
                            }
                        }
                        const creditsPerNight = CREDIT_MAP[category] || 50;
                        const totalCredits = creditsPerNight * (inq.nights || 1);

                        // We can't easily match to userId, so we'll log the credit for later manual assignment
                        // If userId is available in the inquiry, award directly
                        if (inq.userId) {
                            await addCredits(inq.userId, 'hotel_booking', `Hotel booking confirmed: ${inq.hotelName} (${inq.nights} nights)`, totalCredits, id);
                        }
                    } catch (creditErr) {
                        console.warn('Could not award passport credits:', creditErr);
                    }
                }
            }
        } catch (err) {
            console.error('Error updating inquiry:', err);
            alert('Failed to update status');
        }
    };

    const openWhatsApp = (inquiry) => {
        const msg = `Hi ${inquiry.clientName}, this is Infinite Yatra. Regarding your booking inquiry for ${inquiry.hotelName} (${inquiry.checkIn} to ${inquiry.checkOut}). `;
        window.open(`https://wa.me/${inquiry.clientPhone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const exportCSV = () => {
        const headers = ['Name', 'Phone', 'Email', 'Hotel', 'Room', 'Check-in', 'Check-out', 'Nights', 'Amount', 'Status', 'Date'];
        const rows = filtered.map(i => [
            i.clientName, i.clientPhone, i.clientEmail, i.hotelName, i.roomType,
            i.checkIn, i.checkOut, i.nights, i.totalAmount, i.status,
            i.createdAt?.toDate?.()?.toLocaleDateString() || ''
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c || ''}"`).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hotel_inquiries_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const filtered = inquiries.filter(i => {
        const matchSearch = !search ||
            i.clientName?.toLowerCase().includes(search.toLowerCase()) ||
            i.hotelName?.toLowerCase().includes(search.toLowerCase()) ||
            i.clientPhone?.includes(search);
        const matchStatus = statusFilter === 'all' || i.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const stats = {
        total: inquiries.length,
        pending: inquiries.filter(i => i.status === 'pending').length,
        confirmed: inquiries.filter(i => i.status === 'confirmed').length,
        revenue: inquiries.filter(i => i.status === 'confirmed').reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0)
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '—';
        const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Inquiries', value: stats.total, icon: Users, color: 'text-blue-400' },
                    { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-yellow-400' },
                    { label: 'Confirmed', value: stats.confirmed, icon: CheckCircle2, color: 'text-green-400' },
                    { label: 'Revenue (Confirmed)', value: `₹${stats.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400' }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                        <div className={`p-2.5 rounded-lg bg-black/40 ${stat.color}`}><stat.icon size={20} /></div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">{stat.label}</p>
                            <p className="text-xl font-bold text-white">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by guest name, hotel, or phone..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'pending', 'confirmed', 'cancelled'].map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
                <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-400 hover:bg-white/10 hover:text-white transition-all">
                    <Download size={14} /> Export CSV
                </button>
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
                <div className="text-center py-20 text-slate-500">
                    <Clock size={48} className="mx-auto mb-4 text-slate-700" />
                    <p className="text-lg font-bold text-white mb-1">No inquiries found</p>
                    <p className="text-sm">Inquiries will appear here when guests request bookings.</p>
                </div>
            ) : (
                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10 text-left text-xs uppercase text-slate-500 tracking-wider">
                                    <th className="p-4">Guest</th>
                                    <th className="p-4">Hotel</th>
                                    <th className="p-4">Dates</th>
                                    <th className="p-4">Amount</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Created</th>
                                    <th className="p-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((inq) => (
                                    <tr key={inq.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <p className="font-medium text-white">{inq.clientName}</p>
                                            <p className="text-xs text-slate-500">{inq.clientPhone}</p>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-white">{inq.hotelName}</p>
                                            <p className="text-xs text-slate-500">{inq.roomType}</p>
                                        </td>
                                        <td className="p-4 text-slate-300 whitespace-nowrap">
                                            {inq.checkIn} → {inq.checkOut}
                                            <p className="text-xs text-slate-500">{inq.nights} night{inq.nights > 1 ? 's' : ''}, {inq.guests} guest{inq.guests > 1 ? 's' : ''}</p>
                                        </td>
                                        <td className="p-4 font-bold text-white">₹{(inq.totalAmount || 0).toLocaleString()}</td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${STATUS_COLORS[inq.status] || STATUS_COLORS.pending}`}>
                                                {inq.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-400 text-xs whitespace-nowrap">{formatDate(inq.createdAt)}</td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                {inq.status === 'pending' && (
                                                    <>
                                                        <button onClick={() => updateStatus(inq.id, 'confirmed')} className="p-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors" title="Confirm">
                                                            <Check size={14} />
                                                        </button>
                                                        <button onClick={() => updateStatus(inq.id, 'cancelled')} className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors" title="Cancel">
                                                            <X size={14} />
                                                        </button>
                                                    </>
                                                )}
                                                <button onClick={() => openWhatsApp(inq)} className="p-1.5 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors" title="WhatsApp">
                                                    <MessageCircle size={14} />
                                                </button>
                                                <button onClick={() => setSelectedInquiry(inq)} className="p-1.5 bg-white/5 text-slate-400 rounded-lg hover:bg-white/10 transition-colors" title="View Details">
                                                    <Eye size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {selectedInquiry && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedInquiry(null)}>
                    <div className="bg-[#111] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start">
                            <h3 className="text-lg font-bold text-white">Inquiry Details</h3>
                            <button onClick={() => setSelectedInquiry(null)} className="p-1 hover:bg-white/10 rounded"><X size={18} className="text-slate-400" /></button>
                        </div>
                        <div className="space-y-3 text-sm">
                            {[
                                ['Guest', selectedInquiry.clientName],
                                ['Phone', selectedInquiry.clientPhone],
                                ['Email', selectedInquiry.clientEmail],
                                ['Hotel', selectedInquiry.hotelName],
                                ['Room', selectedInquiry.roomType],
                                ['Check-in', selectedInquiry.checkIn],
                                ['Check-out', selectedInquiry.checkOut],
                                ['Nights', selectedInquiry.nights],
                                ['Guests', selectedInquiry.guests],
                                ['Total Amount', `₹${(selectedInquiry.totalAmount || 0).toLocaleString()}`],
                                ['Special Requests', selectedInquiry.specialRequests],
                                ['Status', selectedInquiry.status],
                                ['Created', formatDate(selectedInquiry.createdAt)]
                            ].filter(([, v]) => v).map(([label, value]) => (
                                <div key={label} className="flex justify-between">
                                    <span className="text-slate-500">{label}</span>
                                    <span className="text-white font-medium text-right max-w-[200px]">{value}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2 pt-3 border-t border-white/10">
                            {selectedInquiry.status === 'pending' && (
                                <>
                                    <button onClick={() => { updateStatus(selectedInquiry.id, 'confirmed'); setSelectedInquiry(null); }} className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium text-sm">Confirm</button>
                                    <button onClick={() => { updateStatus(selectedInquiry.id, 'cancelled'); setSelectedInquiry(null); }} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-medium text-sm">Cancel</button>
                                </>
                            )}
                            <button onClick={() => openWhatsApp(selectedInquiry)} className="flex-1 py-2 bg-green-500/20 text-green-400 rounded-lg font-medium text-sm flex items-center justify-center gap-2">
                                <MessageCircle size={14} /> WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminHotelInquiries;
