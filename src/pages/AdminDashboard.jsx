import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, setDoc, orderBy, limit } from 'firebase/firestore';
// import { ref, uploadBytes, getDownloadURL, listAll } from 'firebase/storage'; // REMOVED
// import { storage } from '../firebase'; // REMOVED
import { Loader, CheckCircle, XCircle, Trash2, Search, Calendar, DollarSign, Users, Eye, X, Clock, TrendingUp, Package, Edit, Save, Plus, Database, CloudUpload } from 'lucide-react';
import { usePackages } from '../context/PackageContext';
import { packages as staticPackages } from '../data/packages';
import SEO from '../components/SEO';
import AdminBlogManagement from '../components/AdminBlogManagement';
import AdminImageUpload from '../components/AdminImageUpload';
import AdminPackageForm from '../components/AdminPackageForm';

const AdminDashboard = () => {
    const { allPackages, refreshPackages } = usePackages();
    // Use allPackages instead of public packages
    const packages = allPackages || [];

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'packages' | 'stories'
    const [currentPackage, setCurrentPackage] = useState(null); // For Edit Modal within Form
    const [showPackageForm, setShowPackageForm] = useState(false); // For Add/Edit Form visibility
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [selectedBooking, setSelectedBooking] = useState(null); // For Modal
    const [stats, setStats] = useState({
        total: 0,
        revenue: 0,
        profit: 0,
        pending: 0
    });

    const calculateProfit = (totalPrice, travelers) => {
        if (!travelers || travelers === 0) return 0;
        const pricePerPerson = totalPrice / travelers;
        let profitPerPerson = 0;

        if (pricePerPerson < 10000) {
            profitPerPerson = 2000;
        } else if (pricePerPerson <= 20000) {
            profitPerPerson = 5000;
        } else {
            profitPerPerson = 8000;
        }

        return profitPerPerson * travelers;
    };

    const fetchBookings = async () => {
        setLoading(true);
        setError('');
        try {
            const q = query(collection(db, 'bookings'));
            const querySnapshot = await getDocs(q);

            const bookingsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sort by createdAt desc
            bookingsData.sort((a, b) => {
                const dateA = a.createdAt?.seconds || 0;
                const dateB = b.createdAt?.seconds || 0;
                return dateB - dateA;
            });

            setBookings(bookingsData);

            const total = bookingsData.length;
            const revenue = bookingsData.reduce((acc, curr) => {
                const amountPaid = parseFloat(curr.amountPaid) || 0;
                // Fallback for old bookings that might only have totalPrice
                if (!curr.amountPaid && curr.status === 'confirmed') return acc + (parseFloat(curr.totalPrice) || 0);
                return acc + amountPaid;
            }, 0);

            const profit = bookingsData.reduce((acc, curr) => {
                const price = parseFloat(curr.totalPrice) || 0;
                const travelers = parseInt(curr.travelers) || 1;
                return acc + calculateProfit(price, travelers);
            }, 0);

            const pending = bookingsData.filter(b => b.status === 'pending').length;

            setStats({ total, revenue, profit, pending });

        } catch (err) {
            console.error("Error fetching bookings:", err);
            setError(`Failed to fetch bookings: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleStatusUpdate = async (id, newStatus) => {
        if (!window.confirm(`Are you sure you want to mark this booking as ${newStatus}?`)) return;

        try {
            await updateDoc(doc(db, 'bookings', id), {
                status: newStatus
            });
            setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus } : b));
            if (selectedBooking && selectedBooking.id === id) {
                setSelectedBooking(prev => ({ ...prev, status: newStatus }));
            }
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status.");
        }
    };

    // Package Management Functions
    const handleMigratePackages = async () => {
        if (!window.confirm("This will overwrite existing database packages with static data. Continue?")) return;
        setLoading(true);
        try {
            for (const pkg of staticPackages) {
                await setDoc(doc(db, 'packages', pkg.id), pkg);
            }
            await refreshPackages();
            alert("Packages migrated successfully!");
        } catch (err) {
            console.error(err);
            alert("Migration failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleSavePackage = async (packageData) => {
        setLoading(true);
        try {
            // If ID exists, update. If not, create new ID from title
            let pkgId = packageData.id;
            if (!pkgId) {
                pkgId = packageData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            }

            await setDoc(doc(db, 'packages', pkgId), { ...packageData, id: pkgId }, { merge: true });
            await refreshPackages();
            setShowPackageForm(false);
            setCurrentPackage(null);
            alert("Package saved successfully!");
        } catch (err) {
            console.error(err);
            alert("Failed to save package.");
        } finally {
            setLoading(false);
        }
    };

    const handleEditPackage = (pkg) => {
        setCurrentPackage(pkg);
        setShowPackageForm(true);
    };

    const handleAddNewPackage = () => {
        setCurrentPackage(null);
        setShowPackageForm(true);
    };

    const handleDateChange = (dateString, action) => {
        if (!currentPackage) return;
        let newDates = [...(currentPackage.availableDates || [])];

        if (action === 'add') {
            if (dateString && !newDates.includes(dateString)) {
                newDates.push(dateString);
                newDates.sort(); // Keep sorted
            }
        } else if (action === 'remove') {
            newDates = newDates.filter(d => d !== dateString);
        }

        setCurrentPackage({ ...currentPackage, availableDates: newDates });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to DELETE this booking? This cannot be undone.")) return;

        try {
            await deleteDoc(doc(db, 'bookings', id));
            setBookings(bookings.filter(b => b.id !== id));
            setStats(prev => ({ ...prev, total: prev.total - 1 }));
            if (selectedBooking && selectedBooking.id === id) {
                setSelectedBooking(null);
            }
        } catch (error) {
            console.error("Error deleting booking:", error);
            alert("Failed to delete booking.");
        }
    };

    const filteredBookings = bookings.filter(booking =>
        booking.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        // Handle Firestore Timestamp
        if (timestamp.seconds) {
            return new Date(timestamp.seconds * 1000).toLocaleString();
        }
        return new Date(timestamp).toLocaleString();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <Loader className="animate-spin text-blue-600" size={40} />
                <p className="text-slate-500">Loading Dashboard...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black py-24 px-6 relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] pointer-events-none"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] pointer-events-none"></div>

            <SEO title="Admin Dashboard" description="Manage bookings" url="/admin" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                    <div className="flex bg-white/10 p-1 rounded-xl border border-white/10 backdrop-blur-md">
                        <button
                            onClick={() => setActiveTab('bookings')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'bookings' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            Bookings
                        </button>
                        <button
                            onClick={() => setActiveTab('packages')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'packages' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            Packages
                        </button>
                        <button
                            onClick={() => setActiveTab('stories')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'stories' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            Stories
                        </button>
                        <button
                            onClick={() => setActiveTab('media')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'media' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            Media
                        </button>
                    </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                    <p className="text-slate-400">
                        {activeTab === 'bookings' ? 'Manage and track all customer bookings.' :
                            activeTab === 'packages' ? 'Manage tour packages, pricing, and availability.' :
                                activeTab === 'stories' ? 'Manage user travel stories and featured content.' :
                                    'Upload and manage images for your website.'}
                    </p>
                    <button onClick={fetchBookings} className="text-blue-400 hover:underline text-sm flex items-center gap-1">
                        <Clock size={14} /> Last refreshed: {new Date().toLocaleTimeString()}
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-200">
                        {error}
                    </div>
                )}

                {/* Stats Cards - Only for Bookings Tab */}
                {activeTab === 'bookings' && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="glass-card p-6 rounded-xl border border-white/10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/20 text-blue-400 rounded-lg">
                                    <Calendar size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400">Total Bookings</p>
                                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                                </div>
                            </div>
                        </div>
                        <div className="glass-card p-6 rounded-xl border border-white/10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-500/20 text-green-400 rounded-lg">
                                    <DollarSign size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400">Total Revenue (Est.)</p>
                                    <p className="text-2xl font-bold text-white">₹{stats.revenue.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                        <div className="glass-card p-6 rounded-xl border border-white/10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-500/20 text-purple-400 rounded-lg">
                                    <TrendingUp size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400">Total Profit (Est.)</p>
                                    <p className="text-2xl font-bold text-white">₹{stats.profit.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                        <div className="glass-card p-6 rounded-xl border border-white/10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-yellow-500/20 text-yellow-400 rounded-lg">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400">Pending Actions</p>
                                    <p className="text-2xl font-bold text-white">{stats.pending}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Search Bar - Only for Bookings */}
                {activeTab === 'bookings' && (
                    <div className="glass-card p-4 rounded-xl border border-white/10 mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by name, email, or booking ID..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {/* Bookings Table */}
                {activeTab === 'bookings' && (
                    <div className="glass-card rounded-xl border border-white/10 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-slate-300">
                                <thead>
                                    <tr className="bg-white/5 border-b border-white/10">
                                        <th className="p-4 font-semibold text-slate-200 text-sm">Booking ID</th>
                                        <th className="p-4 font-semibold text-slate-200 text-sm">Customer</th>
                                        <th className="p-4 font-semibold text-slate-200 text-sm">Booked On</th>
                                        <th className="p-4 font-semibold text-slate-200 text-sm">Package</th>
                                        <th className="p-4 font-semibold text-slate-200 text-sm">Amount</th>
                                        <th className="p-4 font-semibold text-slate-200 text-sm">Status</th>
                                        <th className="p-4 font-semibold text-slate-200 text-sm text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBookings.map((booking) => (
                                        <tr key={booking.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                                            <td className="p-4 text-sm text-slate-400 font-mono">#{booking.id.slice(0, 6)}</td>
                                            <td className="p-4">
                                                <p className="font-medium text-white">{booking.contactName || 'N/A'}</p>
                                                <p className="text-xs text-slate-400">{booking.contactEmail || 'N/A'}</p>
                                            </td>
                                            <td className="p-4 text-sm text-slate-400">
                                                {formatDate(booking.createdAt)}
                                            </td>
                                            <td className="p-4 text-sm text-slate-300">
                                                <p className="font-medium">{booking.packageTitle}</p>
                                                <p className="text-xs text-slate-500">Travel: {booking.bookingDate}</p>
                                            </td>
                                            <td className="p-4 text-sm font-medium text-white">
                                                ₹{booking.amountPaid ? booking.amountPaid.toLocaleString() : booking.totalPrice?.toLocaleString()}
                                                {booking.balanceDue > 0 && (
                                                    <div className="text-xs text-orange-400 font-normal">Pending: ₹{booking.balanceDue.toLocaleString()}</div>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase border ${booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400 border-green-500/20' :
                                                    booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20' :
                                                        'bg-red-500/20 text-red-400 border-red-500/20'
                                                    }`}>
                                                    {booking.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setSelectedBooking(booking)}
                                                        className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg"
                                                        title="View Details"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    {booking.status !== 'confirmed' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                                                            className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg"
                                                            title="Mark Confirmed"
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                    )}
                                                    {booking.status !== 'cancelled' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                                                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                                                            title="Mark Cancelled"
                                                        >
                                                            <XCircle size={18} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(booking.id)}
                                                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-lg"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {filteredBookings.length === 0 && (
                            <div className="p-8 text-center text-slate-500">
                                No bookings found matching your search.
                            </div>
                        )}
                    </div>
                )}

                {/* Packages View */}
                {activeTab === 'packages' && (
                    <div className="space-y-6">
                        {packages.length === 0 ? (
                            <div className="bg-white p-12 rounded-xl text-center border border-slate-200">
                                <Database size={48} className="mx-auto text-slate-300 mb-4" />
                                <h3 className="text-xl font-bold text-slate-900 mb-2">No Packages in Database</h3>
                                <p className="text-slate-500 mb-6">Migrate your static packages to Firestore to start editing them.</p>
                                <button
                                    onClick={handleMigratePackages}
                                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                                >
                                    <CloudUpload size={20} />
                                    Migrate Packages
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                <div className="flex justify-between items-center mb-4">
                                    <button
                                        onClick={handleAddNewPackage}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition"
                                    >
                                        <Plus size={20} /> Add New Package
                                    </button>
                                    <button onClick={handleMigratePackages} className="text-xs text-slate-400 hover:text-slate-600 underline">
                                        Re-run Migration (Reset Data)
                                    </button>
                                </div>
                                {packages.map(pkg => (
                                    <div key={pkg.id} className="glass-card p-6 rounded-xl border border-white/10 flex flex-col md:flex-row items-center gap-6 shadow-lg hover:border-white/20 transition-all">
                                        <img src={pkg.image} alt={pkg.title} className="w-24 h-24 object-cover rounded-lg bg-white/5" />
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-white mb-1">{pkg.title}</h3>
                                            <p className="text-slate-400 text-sm mb-2">{pkg.location}</p>
                                            <div className="flex items-center gap-4 text-sm">
                                                <span className="font-bold text-blue-400">₹{pkg.price.toLocaleString()}</span>
                                                {pkg.discount && (
                                                    <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs font-bold border border-red-500/20">{pkg.discount}</span>
                                                )}
                                                <span className="text-slate-500 flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    {pkg.availableDates?.length || 0} Dates
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {!pkg.isVisible && (
                                                <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 text-xs font-bold rounded-full border border-yellow-500/20 text-center">
                                                    Hidden
                                                </span>
                                            )}
                                            <button
                                                onClick={() => handleEditPackage(pkg)}
                                                className="px-6 py-2 border border-white/10 rounded-lg text-slate-300 font-medium hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors"
                                            >
                                                <Edit size={16} />
                                                Edit Package
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Stories Tab Content */}
                {activeTab === 'stories' && (
                    <AdminBlogManagement />
                )}

                {/* Media Tab Content */}
                {activeTab === 'media' && (
                    <AdminImageUpload />
                )}
            </div>

            {/* Booking Details Modal */}
            {selectedBooking && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="glass-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-black/50 backdrop-blur-md z-10">
                            <h2 className="text-2xl font-bold text-white">Booking Details</h2>
                            <button
                                onClick={() => setSelectedBooking(null)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X size={24} className="text-slate-400 hover:text-white" />
                            </button>
                        </div>

                        <div className="p-6 space-y-8">
                            <div className={`p-4 rounded-xl flex items-center gap-3 ${selectedBooking.status === 'confirmed' ? 'bg-green-50 text-green-700 border border-green-200' :
                                selectedBooking.status === 'pending' && selectedBooking.amountPaid > 0 ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                                    selectedBooking.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                                        'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                {selectedBooking.status === 'confirmed' ? <CheckCircle size={24} /> :
                                    selectedBooking.status === 'pending' ? <Clock size={24} /> : <XCircle size={24} />}
                                <div>
                                    <p className="font-bold uppercase tracking-wide text-sm">Booking Status: {selectedBooking.status}</p>
                                    <p className="text-sm opacity-90">
                                        {selectedBooking.status === 'confirmed' ? 'Payment Received & Trip Confirmed' :
                                            selectedBooking.status === 'pending' ? 'Waiting for Payment Verification' : 'Booking Cancelled'}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Customer Info */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Customer Information</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs text-slate-500">Full Name</p>
                                            <p className="font-medium text-slate-900 text-lg">{selectedBooking.contactName || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Email Address</p>
                                            <p className="font-medium text-slate-900">{selectedBooking.contactEmail || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Phone Number</p>
                                            <p className="font-medium text-slate-900">{selectedBooking.contactPhone || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-slate-500">Package</p>
                                        <p className="font-medium text-slate-900 text-lg">{selectedBooking.packageTitle}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Travel Date</p>
                                        <p className="font-medium text-slate-900">{selectedBooking.bookingDate}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Travelers</p>
                                        <p className="font-medium text-slate-900">{selectedBooking.travelers} Person(s)</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Traveler List */}
                        {selectedBooking.travelersList && selectedBooking.travelersList.length > 0 && (
                            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Traveler Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {selectedBooking.travelersList.map((traveler, index) => (
                                        <div key={index} className="bg-black/40 p-4 rounded-lg border border-white/10 shadow-sm relative">
                                            <div className="absolute top-2 right-2 bg-blue-500/20 text-blue-400 text-xs font-bold px-2 py-1 rounded-full border border-blue-500/20">
                                                #{index + 1}
                                            </div>
                                            <p className="font-semibold text-white">{traveler.name}</p>
                                            <div className="text-sm text-slate-400 mt-1 space-y-1">
                                                <p>Age: {traveler.age} • Gender: {traveler.gender}</p>
                                                <p>Mobile: {traveler.mobile}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Financials */}
                        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Payment Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-slate-400 text-sm">Total Package Cost</p>
                                    <p className="text-xl font-bold text-white">₹{selectedBooking.totalPrice?.toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-slate-400 text-sm">Amount Paid</p>
                                    <p className="text-xl font-bold text-green-400">
                                        ₹{selectedBooking.amountPaid ? selectedBooking.amountPaid.toLocaleString() : '0'}
                                    </p>
                                </div>
                                <div className="col-span-2 border-t border-white/10 pt-4 flex justify-between items-center">
                                    <div>
                                        <p className="text-slate-400 text-sm">Payment Type</p>
                                        <p className="font-semibold text-slate-200 capitalize">
                                            {selectedBooking.paymentType === 'token' ? 'Token Payment' : 'Full Payment'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-slate-400 text-sm">Balance Due</p>
                                        <p className={`text-xl font-bold ${selectedBooking.balanceDue > 0 ? 'text-orange-400' : 'text-white'}`}>
                                            ₹{selectedBooking.balanceDue ? selectedBooking.balanceDue.toLocaleString() : '0'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Profit Info (Admin Only) */}
                        <div className="bg-purple-500/10 p-6 rounded-xl border border-purple-500/20">
                            <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-4">Profit Analysis</h3>
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-purple-300 text-sm">Estimated Profit</p>
                                    <p className="text-3xl font-bold text-white">
                                        ₹{calculateProfit(selectedBooking.totalPrice, selectedBooking.travelers).toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-purple-300 text-sm">Margin</p>
                                    <p className="font-bold text-purple-200 text-xl">
                                        {Math.round((calculateProfit(selectedBooking.totalPrice, selectedBooking.travelers) / selectedBooking.totalPrice) * 100)}%
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Special Requests */}
                        {selectedBooking.specialRequests && (
                            <div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Special Requests</h3>
                                <div className="bg-blue-500/10 p-4 rounded-xl text-blue-300 text-sm border border-blue-500/20">
                                    "{selectedBooking.specialRequests}"
                                </div>
                            </div>
                        )}

                        {/* Meta Info */}
                        <div className="pt-6 border-t border-slate-100 flex justify-between text-xs text-slate-400">
                            <p>Booking ID: {selectedBooking.id}</p>
                            <p>Booked On: {formatDate(selectedBooking.createdAt)}</p>
                        </div>
                    </div>

                    <div className="p-6 border-t border-white/10 bg-white/5 rounded-b-2xl flex justify-end gap-3">
                        <button
                            onClick={() => setSelectedBooking(null)}
                            className="px-6 py-2 bg-transparent border border-white/10 text-slate-300 font-semibold rounded-lg hover:bg-white/5 hover:text-white transition-colors"
                        >
                            Close
                        </button>
                        {selectedBooking.status === 'pending' && (
                            <button
                                onClick={() => handleStatusUpdate(selectedBooking.id, 'confirmed')}
                                className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Confirm Booking
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Admin Package Form Modal */}
            {showPackageForm && (
                <AdminPackageForm
                    initialData={currentPackage}
                    onSave={handleSavePackage}
                    onCancel={() => {
                        setShowPackageForm(false);
                        setCurrentPackage(null);
                    }}
                />
            )}
        </div>
    );
};

export default AdminDashboard;
