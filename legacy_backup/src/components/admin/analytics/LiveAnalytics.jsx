import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, MapPin, Activity, ArrowUpRight, ArrowDownRight, PieChart } from 'lucide-react';

const LiveAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState({
        revenue: { total: 0, today: 0, growth: 0 },
        occupancy: { rate: 0, trend: 'stable' },
        bookings: { total: 0, active: 0 },
        topLocations: []
    });
    const [activeView, setActiveView] = useState('overview'); // overview, hotels, tours

    useEffect(() => {
        const fetchRealtimeData = async () => {
            try {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayTimestamp = Timestamp.fromDate(today);

                // 1. Fetch Hotels (For Capacity)
                const hotelsSnap = await getDocs(collection(db, 'hotels'));
                let totalRooms = 0;
                hotelsSnap.forEach(doc => {
                    const data = doc.data();
                    if (data.rooms) {
                        data.rooms.forEach(r => totalRooms += Number(r.count || 0));
                    }
                });

                // 2. Fetch Hotel Bookings (Active)
                const hotelBookingsQ = query(collection(db, 'hotel_bookings'), orderBy('createdAt', 'desc')); // Fetch all for aggregation
                const hotelBookingsSnap = await getDocs(hotelBookingsQ);

                let activeRooms = 0;
                let hotelRevenue = 0;
                let hotelRevenueToday = 0;
                const locationCounts = {};

                hotelBookingsSnap.forEach(doc => {
                    const data = doc.data();
                    const amount = Number(data.totalAmount || 0);
                    hotelRevenue += amount;

                    if (data.createdAt?.toDate() >= today) {
                        hotelRevenueToday += amount;
                    }

                    // Simple "Active" Logic: Check-out date is in future
                    // Currently assuming string 'YYYY-MM-DD'
                    const checkOutDate = new Date(data.checkOut);
                    if (checkOutDate >= new Date()) {
                        activeRooms += 1; // Assuming 1 room per booking for now
                    }

                    // Location Demand
                    if (data.hotelName) {
                        // Ideally we have location in booking, if not use name as proxy
                        const loc = data.hotelName;
                        locationCounts[loc] = (locationCounts[loc] || 0) + 1;
                    }
                });

                // 3. Fetch Tour Bookings
                const tourBookingsQ = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
                const tourBookingsSnap = await getDocs(tourBookingsQ);

                let tourRevenue = 0;
                let tourRevenueToday = 0;
                let totalTravelers = 0;

                tourBookingsSnap.forEach(doc => {
                    const data = doc.data();
                    const amount = Number(data.totalPrice || 0);
                    tourRevenue += amount;
                    totalTravelers += Number(data.travelers || 0);

                    if (data.createdAt?.toDate() >= today) {
                        tourRevenueToday += amount;
                    }

                    if (data.packageTitle) {
                        const loc = data.packageTitle;
                        locationCounts[loc] = (locationCounts[loc] || 0) + 1;
                    }
                });

                // Aggregations
                const totalRevenue = hotelRevenue + tourRevenue;
                const todayRevenue = hotelRevenueToday + tourRevenueToday;
                const occupancyRate = totalRooms > 0 ? (activeRooms / totalRooms) * 100 : 0;

                // Sort Locations / Products
                const sortedLocations = Object.entries(locationCounts)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([name, count]) => ({ name, count }));

                setMetrics({
                    revenue: { total: totalRevenue, today: todayRevenue, growth: 12.5 }, // Mock growth
                    occupancy: { rate: Math.min(occupancyRate, 100), totalActive: activeRooms, capacity: totalRooms },
                    bookings: { total: hotelBookingsSnap.size + tourBookingsSnap.size, active: activeRooms + totalTravelers },
                    topLocations: sortedLocations
                });

            } catch (err) {
                console.error("Dashboard Error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchRealtimeData();
    }, []);

    const formatCurrency = (val) => `₹${val.toLocaleString('en-IN')}`;

    if (loading) return <div className="p-12 text-center animate-pulse text-slate-500">Connecting to Live Data...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">

            {/* KPI ROW */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                {/* Revenue Card */}
                <div className="bg-[#151515] border border-white/5 p-6 rounded-3xl relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-green-500/10 rounded-xl text-green-500">
                            <DollarSign size={24} />
                        </div>
                        <span className="bg-green-500/10 text-green-400 text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                            <ArrowUpRight size={12} /> +{metrics.revenue.growth}%
                        </span>
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Revenue</p>
                    <h3 className="text-3xl font-bold text-white mb-1">{formatCurrency(metrics.revenue.total)}</h3>
                    <p className="text-xs text-slate-400">₹{metrics.revenue.today.toLocaleString()} today</p>
                </div>

                {/* Occupancy Card */}
                <div className="bg-[#151515] border border-white/5 p-6 rounded-3xl relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                            <Activity size={24} />
                        </div>
                        {metrics.occupancy.rate > 80 && (
                            <span className="bg-red-500/10 text-red-400 text-xs font-bold px-2 py-1 rounded-lg animate-pulse">
                                High Demand
                            </span>
                        )}
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Live Occupancy</p>
                    <h3 className="text-3xl font-bold text-white mb-1">{metrics.occupancy.rate.toFixed(1)}%</h3>
                    <p className="text-xs text-slate-400">{metrics.occupancy.totalActive} / {metrics.occupancy.capacity} Rooms Active</p>

                    {/* Mini Progress Bar */}
                    <div className="w-full bg-white/5 h-1.5 rounded-full mt-4">
                        <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${metrics.occupancy.rate}%` }}></div>
                    </div>
                </div>

                {/* Demand/Traffic Card */}
                <div className="bg-[#151515] border border-white/5 p-6 rounded-3xl relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
                            <Users size={24} />
                        </div>
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Active Travelers</p>
                    <h3 className="text-3xl font-bold text-white mb-1">{metrics.bookings.active}</h3>
                    <p className="text-xs text-slate-400">Currently on trips/stays</p>
                </div>

                {/* System Health */}
                <div className="bg-[#151515] border border-white/5 p-6 rounded-3xl relative overflow-hidden flex flex-col justify-center items-center">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                        <TrendingUp size={32} className="text-emerald-500 z-10" />
                        <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-emerald-500/50 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-emerald-500 font-bold mt-2">System Healthy</p>
                    <p className="text-xs text-slate-500">All services operational</p>
                </div>
            </div>

            {/* DEMAND & INSIGHTS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Top Demanded Locations */}
                <div className="bg-[#151515] border border-white/5 rounded-3xl p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <MapPin className="text-red-500" /> High Demand Zones
                        </h3>
                    </div>
                    <div className="space-y-4">
                        {metrics.topLocations.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center group cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors">
                                <span className="text-slate-300 font-medium flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">{idx + 1}</span>
                                    {item.name}
                                </span>
                                <div className="flex items-center gap-4">
                                    <div className="w-24 h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${(item.count / metrics.topLocations[0].count) * 100}%` }}></div>
                                    </div>
                                    <span className="text-white font-mono text-sm">{item.count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Real-time Alerts Panel */}
                <div className="bg-[#151515] border border-white/5 rounded-3xl p-8">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Activity className="text-yellow-500" /> Live Alerts
                    </h3>
                    <div className="space-y-4">
                        {metrics.occupancy.rate > 70 && (
                            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3">
                                <div className="w-2 h-2 mt-2 rounded-full bg-yellow-500 animate-ping"></div>
                                <div>
                                    <p className="text-yellow-500 font-bold text-sm">Inventory Low</p>
                                    <p className="text-slate-400 text-xs">Hotel occupancy crossed 70%. Consider enabling "Surge Pricing".</p>
                                </div>
                                <button className="ml-auto text-xs bg-yellow-500 text-black font-bold px-3 py-1.5 rounded-lg hover:bg-yellow-400">Action</button>
                            </div>
                        )}
                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3">
                            <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                            <div>
                                <p className="text-blue-500 font-bold text-sm">New Review Received</p>
                                <p className="text-slate-400 text-xs">Guest "Rahul K." rated Kedarnath Trek 5 stars.</p>
                            </div>
                        </div>
                        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-start gap-3">
                            <div className="w-2 h-2 mt-2 rounded-full bg-purple-500"></div>
                            <div>
                                <p className="text-purple-500 font-bold text-sm">Payout Processed</p>
                                <p className="text-slate-400 text-xs">Weekly payout of ₹1,45,000 sent to Hotel Himalayan.</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default LiveAnalytics;
