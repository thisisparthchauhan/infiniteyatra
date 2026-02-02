import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Calendar, CreditCard, Download, FileText, ChevronDown } from 'lucide-react';

const StatCard = ({ title, value, change, icon: Icon, color }) => (
    <div className="bg-white/5 p-6 rounded-xl border border-white/10">
        <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${color} bg-opacity-20`}>
                <Icon size={24} className={color.replace('bg-', 'text-')} />
            </div>
            <span className={`text-sm font-medium ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {change >= 0 ? '+' : ''}{change}%
            </span>
        </div>
        <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
        <p className="text-sm text-slate-400">{title}</p>
    </div>
);

const AdminHotelFinance = () => {
    const [bookings, setBookings] = useState([]);
    const [hotelStats, setHotelStats] = useState([]);

    useEffect(() => {
        // Read from persistent storage (Mocking backend sync)
        const storedBookings = JSON.parse(localStorage.getItem('iy_hotel_bookings') || '[]');
        setBookings(storedBookings);

        // Process Hotel-wise Stats
        const statsMap = {};

        // Mock existing data if no bookings to show UI
        const allBookings = storedBookings.length > 0 ? storedBookings : [
            { id: 'MOCK1', hotelName: 'The Grand IY Resort', totalValue: 125000, status: 'Confirmed' },
            { id: 'MOCK2', hotelName: 'Himalayan Sanctuary', totalValue: 85000, status: 'Confirmed' },
            { id: 'MOCK3', hotelName: 'The Grand IY Resort', totalValue: 45000, status: 'Confirmed' }
        ];

        allBookings.forEach(booking => {
            if (!statsMap[booking.hotelName]) {
                statsMap[booking.hotelName] = {
                    name: booking.hotelName,
                    revenue: 0,
                    commission: 0,
                    payout: 0,
                    bookings: 0,
                    status: 'Pending' // Default mock status
                };
            }
            const amount = booking.totalValue || 0;
            statsMap[booking.hotelName].revenue += amount;
            statsMap[booking.hotelName].commission += amount * 0.15; // 15% Commission
            statsMap[booking.hotelName].payout += amount * 0.85; // 85% to Hotel
            statsMap[booking.hotelName].bookings += 1;
        });

        setHotelStats(Object.values(statsMap));
    }, []);

    // Aggregate Stats
    const totalRevenue = hotelStats.reduce((sum, h) => sum + h.revenue, 0);
    const totalCommission = hotelStats.reduce((sum, h) => sum + h.commission, 0);
    const totalPayouts = hotelStats.reduce((sum, h) => sum + h.payout, 0);
    const totalBookings = hotelStats.reduce((sum, h) => sum + h.bookings, 0);

    // Formatting helper
    const formatCurrency = (amount) => {
        const inLakhs = amount / 100000;
        if (inLakhs >= 1) return '₹' + inLakhs.toFixed(2) + 'L';
        return '₹' + amount.toLocaleString();
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Hotel Financial Intelligence</h2>
                    <p className="text-slate-400">Deep dive into revenue, commissions, and partner payouts.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors">
                        <Download size={16} /> Export CSV
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors text-white">
                        <FileText size={16} /> Generate Report
                    </button>
                </div>
            </div>

            {/* Top Level Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Revenue"
                    value={formatCurrency(totalRevenue)}
                    change={12.5}
                    icon={DollarSign}
                    color="bg-green-500"
                />
                <StatCard
                    title="Net Commission (15%)"
                    value={formatCurrency(totalCommission)}
                    change={18.2}
                    icon={TrendingUp}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Partner Payouts"
                    value={formatCurrency(totalPayouts)}
                    change={10.1}
                    icon={CreditCard}
                    color="bg-orange-500"
                />
                <StatCard
                    title="Total Bookings"
                    value={totalBookings}
                    change={15.3}
                    icon={Calendar}
                    color="bg-purple-500"
                />
            </div>

            {/* Hotel-wise Breakdown Table */}
            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-white">Partner Performance & Payouts</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <span>Sort by: Revenue</span> <ChevronDown size={14} />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-white/5 text-xs uppercase font-bold text-slate-300">
                            <tr>
                                <th className="px-6 py-4">Hotel Name</th>
                                <th className="px-6 py-4 text-right">Bookings</th>
                                <th className="px-6 py-4 text-right">Total Revenue</th>
                                <th className="px-6 py-4 text-right">IY Commission</th>
                                <th className="px-6 py-4 text-right">Payable to Hotel</th>
                                <th className="px-6 py-4 text-center">Payout Status</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {hotelStats.map((hotel, index) => (
                                <tr key={index} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-medium text-white">{hotel.name}</td>
                                    <td className="px-6 py-4 text-right">{hotel.bookings}</td>
                                    <td className="px-6 py-4 text-right font-mono text-white">{formatCurrency(hotel.revenue)}</td>
                                    <td className="px-6 py-4 text-right font-mono text-green-400">+ {formatCurrency(hotel.commission)}</td>
                                    <td className="px-6 py-4 text-right font-mono text-orange-400">{formatCurrency(hotel.payout)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${hotel.status === 'Paid' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                            {hotel.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button className="text-blue-400 hover:text-blue-300 underline font-medium">Details</button>
                                    </td>
                                </tr>
                            ))}
                            {hotelStats.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-slate-500">No data available.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Individual Transactions Mockup */}
            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                <div className="p-6 border-b border-white/10">
                    <h3 className="font-bold text-lg text-white">Recent Transaction Log</h3>
                </div>
                <div className="p-4">
                    {bookings && bookings.length > 0 ? (
                        <div className="space-y-2">
                            {bookings.slice(0, 5).map((b, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold text-xs">BK</div>
                                        <div>
                                            <p className="font-bold text-white">{b.hotelName}</p>
                                            <p className="text-xs text-slate-500">ID: {b.id} • {new Date(b.date || Date.now()).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-white">₹{b.totalValue?.toLocaleString()}</p>
                                        <p className="text-xs text-green-500">Completed</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-slate-500 py-4">No transactions recorded yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminHotelFinance;
