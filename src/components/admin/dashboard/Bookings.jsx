import React, { useEffect, useState, useRef } from 'react';
import { Search, Filter, Eye, Trash2, MoreHorizontal, Calendar, Download, RefreshCw, X, CheckCircle, AlertCircle, FileText, MessageCircle, Mail, ChevronDown } from 'lucide-react';
import { collection, query, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { generateInvoicePDF } from '../../../services/InvoiceGenerator';

const Bookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'bookings'));
            const querySnapshot = await getDocs(q);
            const bookingsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            bookingsData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setBookings(bookingsData);
        } catch (err) {
            console.error("Error fetching bookings:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleStatusUpdate = async (id, newStatus) => {
        if (!window.confirm(`Mark booking as ${newStatus}?`)) return;
        try {
            await updateDoc(doc(db, 'bookings', id), {
                status: newStatus,
                bookingStatus: newStatus // Sync with new schema
            });
            setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus, bookingStatus: newStatus } : b));
            if (selectedBooking) setSelectedBooking(prev => ({ ...prev, status: newStatus, bookingStatus: newStatus }));
        } catch (error) {
            console.error(error);
            alert("Update failed");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this booking? Irreversible.")) return;
        try {
            await deleteDoc(doc(db, 'bookings', id));
            setBookings(bookings.filter(b => b.id !== id));
            setSelectedBooking(null);
        } catch (error) {
            console.error(error);
        }
    };

    const filtered = bookings.filter(b => {
        const matchesSearch = b.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || b.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    // Export functionality
    const [showExportMenu, setShowExportMenu] = useState(false);
    const exportRef = useRef(null);

    // Invoice Generation
    const handleDownloadInvoice = () => {
        if (!selectedBooking) return;

        const booking = {
            id: selectedBooking.id,
            packageTitle: selectedBooking.packageTitle,
            travelDate: selectedBooking.travelDate || selectedBooking.bookingDate,
            category: selectedBooking.category || 'Trek/Tour',
            totalPrice: selectedBooking.totalPrice,
            travelers: selectedBooking.travelers || 1,
            tripName: selectedBooking.packageTitle,
            pickup: selectedBooking.pickupLocation,
            drop: selectedBooking.dropLocation,
            status: selectedBooking.status
        };

        const payment = {
            amount: selectedBooking.amountPaid || 1000,
            method: 'Online',
            id: selectedBooking.razorpayOrderId || 'N/A',
            status: selectedBooking.paymentStatus || 'success'
        };

        const customer = {
            name: selectedBooking.contactName,
            email: selectedBooking.contactEmail,
            phone: selectedBooking.phone,
            age: selectedBooking.age,
            gender: selectedBooking.gender,
            address: selectedBooking.address,
            emergencyContact: selectedBooking.emergencyContact
        };

        const doc = generateInvoicePDF(booking, payment, customer);
        doc.save(`IY_Invoice_${selectedBooking.id}.pdf`);
    };

    // Close export menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (exportRef.current && !exportRef.current.contains(event.target)) {
                setShowExportMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Prepare data for export
    const getExportData = () => {
        return filtered.map(b => ({
            'Booking ID': b.id,
            'Customer Name': b.contactName || 'N/A',
            'Email': b.contactEmail || 'N/A',
            'Phone': b.phone || 'N/A',
            'Package': b.packageTitle || 'N/A',
            'Travel Date': b.travelDate || 'N/A',
            'Travelers': b.travelers || 1,
            'Total Amount': b.totalAmount ? `₹${b.totalAmount}` : 'N/A',
            'Amount Paid': b.amountPaid ? `₹${b.amountPaid}` : 'N/A',
            'Status': b.status || 'pending',
            'Booked On': b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'
        }));
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        const data = getExportData();

        doc.setFontSize(18);
        doc.text('Booking Management Report', 14, 22);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
        doc.text(`Total Records: ${data.length}`, 14, 36);

        autoTable(doc, {
            head: [Object.keys(data[0] || {})],
            body: data.map(row => Object.values(row)),
            startY: 42,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [59, 130, 246] }
        });

        doc.save('bookings_export.pdf');
        setShowExportMenu(false);
    };

    const exportToExcel = () => {
        const data = getExportData();
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Bookings');
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, 'bookings_export.xlsx');
        setShowExportMenu(false);
    };

    const exportToCSV = () => {
        const data = getExportData();
        const worksheet = XLSX.utils.json_to_sheet(data);
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        saveAs(blob, 'bookings_export.csv');
        setShowExportMenu(false);
    };

    const exportToText = () => {
        const data = getExportData();
        let text = 'BOOKING MANAGEMENT REPORT\n';
        text += `Generated: ${new Date().toLocaleString()}\n`;
        text += `Total Records: ${data.length}\n\n`;
        text += '='.repeat(80) + '\n\n';

        data.forEach((row, idx) => {
            text += `--- Booking #${idx + 1} ---\n`;
            Object.entries(row).forEach(([key, value]) => {
                text += `${key}: ${value}\n`;
            });
            text += '\n';
        });

        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, 'bookings_export.txt');
        setShowExportMenu(false);
    };

    if (loading) return <div className="p-12 text-center text-slate-500 animate-pulse">Loading Bookings...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* TOOLBAR */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10 gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, ID or email..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <select
                        className="bg-black/40 border border-white/10 text-slate-300 rounded-xl px-4 py-2.5 focus:outline-none"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="pending">Pending</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <button onClick={fetchBookings} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors">
                        <RefreshCw size={18} />
                    </button>
                    <div className="relative" ref={exportRef}>
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors shadow-lg shadow-blue-500/20"
                        >
                            <Download size={18} /> Export <ChevronDown size={16} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                            {showExportMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                                >
                                    <button onClick={exportToPDF} className="w-full px-4 py-3 text-left text-white hover:bg-white/10 flex items-center gap-3 transition-colors">
                                        <FileText size={18} className="text-red-400" /> PDF Document
                                    </button>
                                    <button onClick={exportToExcel} className="w-full px-4 py-3 text-left text-white hover:bg-white/10 flex items-center gap-3 transition-colors">
                                        <FileText size={18} className="text-green-400" /> Excel Spreadsheet
                                    </button>
                                    <button onClick={exportToCSV} className="w-full px-4 py-3 text-left text-white hover:bg-white/10 flex items-center gap-3 transition-colors">
                                        <FileText size={18} className="text-yellow-400" /> CSV File
                                    </button>
                                    <button onClick={exportToText} className="w-full px-4 py-3 text-left text-white hover:bg-white/10 flex items-center gap-3 transition-colors">
                                        <FileText size={18} className="text-blue-400" /> Text File
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* TABLE */}
            <div className="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-xl">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white/5 border-b border-white/10">
                        <tr>
                            <th className="p-5 text-slate-400 text-xs uppercase font-bold tracking-wider">Booking ID</th>
                            <th className="p-5 text-slate-400 text-xs uppercase font-bold tracking-wider">Customer Details</th>
                            <th className="p-5 text-slate-400 text-xs uppercase font-bold tracking-wider">Trip Info</th>
                            <th className="p-5 text-slate-400 text-xs uppercase font-bold tracking-wider text-right">Payment</th>
                            <th className="p-5 text-slate-400 text-xs uppercase font-bold tracking-wider text-center">Status</th>
                            <th className="p-5 text-slate-400 text-xs uppercase font-bold tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filtered.map((booking) => (
                            <tr key={booking.id} className="hover:bg-white/5 transition-colors group">
                                <td className="p-5 font-mono text-slate-500 text-xs">#{booking.id.slice(0, 6)}</td>
                                <td className="p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                            {booking.contactName?.[0]}
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">{booking.contactName}</p>
                                            <p className="text-xs text-slate-400">{booking.contactEmail}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-5">
                                    <p className="text-slate-200 font-medium">{booking.packageTitle}</p>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                                        <Calendar size={12} /> {booking.bookingDate}
                                    </div>
                                </td>
                                <td className="p-5 text-right">
                                    <p className="text-white font-bold">₹{booking.totalPrice?.toLocaleString()}</p>
                                    {booking.amountPaid < booking.totalPrice && (
                                        <p className="text-[10px] text-orange-400 mt-0.5">Partially Paid</p>
                                    )}
                                </td>
                                <td className="p-5 text-center">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold capitalize border ${booking.status === 'confirmed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                        booking.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                            'bg-red-500/10 text-red-400 border-red-500/20'
                                        }`}>
                                        {booking.status === 'confirmed' && <CheckCircle size={10} />}
                                        {booking.status === 'pending' && <Clock size={10} />}
                                        {booking.status}
                                    </span>
                                </td>
                                <td className="p-5 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setSelectedBooking(booking)} className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors">
                                            <Eye size={16} />
                                        </button>
                                        {booking.invoice_url && (
                                            <a
                                                href={booking.invoice_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors"
                                                title="Download Invoice"
                                            >
                                                <FileText size={16} />
                                            </a>
                                        )}
                                        <button onClick={() => handleDelete(booking.id)} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* DETAILS DRAWER */}
            <AnimatePresence>
                {selectedBooking && (
                    <div className="fixed inset-0 z-50 flex justify-end">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedBooking(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="relative w-full max-w-md h-full bg-[#0a0a0a] border-l border-white/10 shadow-2xl p-6 overflow-y-auto"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-xl font-bold text-white">Booking Details</h2>
                                <button onClick={() => setSelectedBooking(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                    <X size={20} className="text-slate-400" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* LIFECYCLE TIMELINE CARD */}
                                <div className="p-5 rounded-2xl bg-gradient-to-b from-white/10 to-transparent border border-white/10 relative overflow-hidden">
                                    <div className="flex justify-between items-start relative z-10">
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Current Status</p>
                                            <p className={`text-2xl font-bold capitalize ${selectedBooking.status === 'confirmed' ? 'text-green-400' :
                                                selectedBooking.status === 'cancelled' ? 'text-red-400' : 'text-yellow-400'
                                                }`}>{selectedBooking.status || 'Pending'}</p>
                                        </div>
                                        {selectedBooking.razorpayOrderId && (
                                            <div className="text-right">
                                                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Razorpay Ref</p>
                                                <p className="font-mono text-xs text-blue-300 bg-blue-900/30 px-2 py-1 rounded border border-blue-500/20">
                                                    {selectedBooking.razorpayOrderId}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* VISUAL TIMELINE */}
                                    <div className="mt-6 flex items-center justify-between relative">
                                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -z-0"></div>

                                        {['created', 'paid', 'confirmed', 'completed'].map((step, index) => {
                                            // Mapping status to progress
                                            let currentStepIndex = 0;
                                            if (selectedBooking.status === 'confirmed') currentStepIndex = 2;
                                            if (selectedBooking.status === 'completed') currentStepIndex = 3;

                                            // Special case for Razorpay paid but pending confirmation
                                            if (selectedBooking.paymentStatus === 'paid' && selectedBooking.status === 'pending') currentStepIndex = 1;

                                            const isCompleted = index <= currentStepIndex;

                                            if (selectedBooking.status === 'cancelled') {
                                                if (step === 'created') return (
                                                    <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full bg-slate-500 ring-4 ring-[#0a0a0a]"></div>
                                                        <span className="text-[10px] text-slate-500 uppercase font-bold">Created</span>
                                                    </div>
                                                );
                                                if (step === 'paid') return (
                                                    <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full bg-red-500 ring-4 ring-[#0a0a0a]"></div>
                                                        <span className="text-[10px] text-red-500 uppercase font-bold">Cancelled</span>
                                                    </div>
                                                );
                                                return null;
                                            }

                                            return (
                                                <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                                                    <div className={`w-3 h-3 rounded-full ring-4 ring-[#0a0a0a] transition-all duration-500 ${isCompleted ? 'bg-blue-500 scale-125' : 'bg-slate-700'
                                                        }`}>
                                                        {isCompleted && <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-50"></div>}
                                                    </div>
                                                    <span className={`text-[10px] uppercase font-bold ${isCompleted ? 'text-blue-400' : 'text-slate-600'}`}>
                                                        {step}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                                        <label className="text-xs text-slate-500 uppercase block">Customer</label>
                                        <p className="text-white font-medium truncat">{selectedBooking.contactName}</p>
                                        <div className="flex items-center gap-2 text-xs text-blue-400 mt-1 cursor-pointer hover:underline">
                                            <Mail size={12} /> {selectedBooking.contactEmail}
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                                        <label className="text-xs text-slate-500 uppercase block">Trip Info</label>
                                        <p className="text-white font-medium truncate">{selectedBooking.packageTitle}</p>
                                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                                            <Calendar size={12} /> {selectedBooking.bookingDate}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="text-xs text-slate-500 uppercase block">Payment & Invoice</label>
                                        <span className={`text-xs px-2 py-1 rounded border ${selectedBooking.paymentStatus === 'paid' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                            'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                            }`}>
                                            {selectedBooking.paymentStatus?.toUpperCase() || 'PENDING'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-end mb-4">
                                        <span className="text-slate-400 text-sm">Total Amount</span>
                                        <span className="text-white font-bold text-2xl">₹{selectedBooking.totalPrice?.toLocaleString()}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={handleDownloadInvoice} className="flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors border border-white/10">
                                            <FileText size={14} className="text-slate-400" /> Generate Invoice
                                        </button>
                                        <button className="flex items-center justify-center gap-2 py-2.5 bg-green-600/10 hover:bg-green-600/20 text-green-400 rounded-lg text-sm font-medium transition-colors border border-green-600/20">
                                            <MessageCircle size={14} /> WhatsApp
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-white/10 space-y-3">
                                    {selectedBooking.status !== 'confirmed' && (
                                        <button
                                            onClick={() => handleStatusUpdate(selectedBooking.id, 'confirmed')}
                                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={18} /> Confirm Booking
                                        </button>
                                    )}

                                    {selectedBooking.status === 'confirmed' && (
                                        <button
                                            onClick={() => alert("Refund logic pending in implementation_plan Phase 6")}
                                            className="w-full py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-medium rounded-xl transition-colors border border-white/10"
                                        >
                                            Process Refund
                                        </button>
                                    )}

                                    {selectedBooking.status !== 'cancelled' && (
                                        <button
                                            onClick={() => handleStatusUpdate(selectedBooking.id, 'cancelled')}
                                            className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium rounded-xl transition-colors border border-red-500/20"
                                        >
                                            Cancel Booking
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Bookings;
