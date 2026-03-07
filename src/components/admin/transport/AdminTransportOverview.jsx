import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Car, MapPin, Calendar, IndianRupee, AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { getVehicles, getCities, getBookings } from '../../../services/transportService';

const AdminTransportOverview = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalVehicles: 0,
        activeCities: 0,
        todayBookings: 0,
        totalRevenue: 0,
        pendingConfirmations: 0
    });
    const [recentBookings, setRecentBookings] = useState([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [vehiclesData, citiesData, bookingsData] = await Promise.all([
                    getVehicles(),
                    getCities(),
                    getBookings()
                ]);

                const activeVehicles = vehiclesData.filter(v => v.isActive);
                const activeCitiesList = citiesData.filter(c => c.isActive);

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                let todayCount = 0;
                let revenue = 0;
                let pendingCount = 0;

                bookingsData.forEach(booking => {
                    const bookingDate = booking.createdAt?.toDate ? booking.createdAt.toDate() : new Date(booking.createdAt);

                    if (bookingDate >= today) {
                        todayCount++;
                    }

                    if (booking.status === 'confirmed' || booking.status === 'completed') {
                        revenue += Number(booking.totalAmount || 0);
                    }

                    if (booking.status === 'pending') {
                        pendingCount++;
                    }
                });

                setStats({
                    totalVehicles: activeVehicles.length,
                    activeCities: activeCitiesList.length,
                    todayBookings: todayCount,
                    totalRevenue: revenue,
                    pendingConfirmations: pendingCount
                });

                setRecentBookings(bookingsData.slice(0, 5));
            } catch (error) {
                console.error("Error fetching transport overview data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateInput) => {
        if (!dateInput) return 'N/A';
        const date = dateInput.toDate ? dateInput.toDate() : new Date(dateInput);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const StatusBadge = ({ status }) => {
        switch (status) {
            case 'confirmed':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20"><CheckCircle size={12} /> Confirmed</span>;
            case 'pending':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"><Clock size={12} /> Pending</span>;
            case 'completed':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20"><CheckCircle size={12} /> Completed</span>;
            case 'cancelled':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20"><XCircle size={12} /> Cancelled</span>;
            default:
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">{status}</span>;
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Transport Overview</h1>
                    <p className="text-slate-400">Snapshot of your fleet, cities, and booking performance.</p>
                </div>
            </div>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                            <Car className="text-blue-400" size={24} />
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm font-medium mb-1">Active Vehicles</p>
                        <h3 className="text-3xl font-bold text-white tracking-tight">{stats.totalVehicles}</h3>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center border border-purple-500/30">
                            <MapPin className="text-purple-400" size={24} />
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm font-medium mb-1">Live Cities</p>
                        <h3 className="text-3xl font-bold text-white tracking-tight">{stats.activeCities}</h3>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center border border-green-500/30">
                            <Calendar className="text-green-400" size={24} />
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm font-medium mb-1">Today's Bookings</p>
                        <h3 className="text-3xl font-bold text-white tracking-tight">{stats.todayBookings}</h3>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
                            <IndianRupee className="text-emerald-400" size={24} />
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm font-medium mb-1">Total Revenue</p>
                        <h3 className="text-3xl font-bold text-white tracking-tight truncate">{formatCurrency(stats.totalRevenue)}</h3>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-yellow-900/20 border border-yellow-700/50 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center border border-yellow-500/50">
                            <AlertCircle className="text-yellow-400" size={24} />
                        </div>
                    </div>
                    <div>
                        <p className="text-yellow-200/70 text-sm font-medium mb-1">Pending Confirmation</p>
                        <h3 className="text-3xl font-bold text-yellow-400 tracking-tight">{stats.pendingConfirmations}</h3>
                    </div>
                </motion.div>
            </div>

            {/* Recent Bookings Table */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden mt-8 shadow-sm">
                <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <h2 className="text-lg font-bold text-white">Recent Bookings</h2>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">Customer</th>
                                <th className="px-6 py-4 font-semibold">Vehicle</th>
                                <th className="px-6 py-4 font-semibold">City</th>
                                <th className="px-6 py-4 font-semibold">Date</th>
                                <th className="px-6 py-4 font-semibold">Amount</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {recentBookings.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500 font-medium">
                                        No recent bookings found.
                                    </td>
                                </tr>
                            ) : (
                                recentBookings.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-slate-800/20 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-white">{booking.passengerName}</div>
                                            <div className="text-xs text-slate-500">{booking.passengerPhone}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-300">{booking.vehicleName}</div>
                                            <div className="text-xs text-slate-500 capitalize">{booking.vehicleType}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 text-sm">
                                            {booking.pickupCity}
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 text-sm">
                                            {formatDate(booking.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-white">
                                            {formatCurrency(booking.totalAmount)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={booking.status} />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-slate-800">
                    {recentBookings.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 font-medium">
                            No recent bookings found.
                        </div>
                    ) : (
                        recentBookings.map((booking) => (
                            <div key={booking.id} className="p-4 hover:bg-slate-800/20 transition-colors space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-medium text-white">{booking.passengerName}</div>
                                        <div className="text-xs text-slate-500">{booking.passengerPhone}</div>
                                    </div>
                                    <StatusBadge status={booking.status} />
                                </div>
                                <div className="flex justify-between items-end mt-2">
                                    <div>
                                        <div className="font-medium text-slate-300">{booking.vehicleName}</div>
                                        <div className="text-xs text-slate-500 capitalize">{booking.vehicleType} &bull; {booking.pickupCity}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium text-white">{formatCurrency(booking.totalAmount)}</div>
                                        <div className="text-[10px] text-slate-500">{formatDate(booking.createdAt)}</div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default AdminTransportOverview;
