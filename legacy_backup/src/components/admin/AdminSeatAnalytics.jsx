import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { PieChart, TrendingUp, AlertTriangle, Calendar } from 'lucide-react';

const AdminSeatAnalytics = ({ topPackages }) => {
    const [analytics, setAnalytics] = useState({
        overallUtilization: 0,
        totalCapacity: 0,
        totalBooked: 0,
        highDemandTrips: [], // This will be overridden by topPackages for display if provided
        lowUtilizationAlerts: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                // Fetch all active departures (future dates or recent past)
                const querySnapshot = await getDocs(collection(db, 'departures'));
                let totalSeats = 0;
                let bookedSeats = 0;
                let tripsData = [];

                querySnapshot.forEach(doc => {
                    const data = doc.data();
                    const capacity = parseInt(data.maxSeats) || 12; // Default 12
                    const booked = parseInt(data.bookedSeats) || 0;

                    totalSeats += capacity;
                    bookedSeats += booked;

                    const utilization = (booked / capacity) * 100;

                    // Mock date parsing if string "2024-03-12" or similar
                    let dateStr = data.date || 'Upcoming';
                    if (data.date && data.date.seconds) {
                        dateStr = new Date(data.date.seconds * 1000).toLocaleDateString();
                    }

                    tripsData.push({
                        id: doc.id,
                        title: data.packageTitle || 'Unknown Trip',
                        date: dateStr,
                        capacity,
                        booked,
                        utilization: Math.min(utilization, 100)
                    });
                });

                // Sort High Demand
                const highDemand = [...tripsData]
                    .sort((a, b) => b.utilization - a.utilization)
                    .slice(0, 3);

                // Find Low Utilization (e.g., < 50% and booked > 0)
                const lowUtil = tripsData.filter(t => t.utilization < 50 && t.booked > 0).slice(0, 3);

                setAnalytics({
                    overallUtilization: totalSeats > 0 ? (bookedSeats / totalSeats) * 100 : 0,
                    totalCapacity: totalSeats,
                    totalBooked: bookedSeats,
                    highDemandTrips: highDemand,
                    lowUtilizationAlerts: lowUtil
                });

            } catch (err) {
                console.error("Error calculating seat analytics:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading Analytics...</div>;

    return (
        <div className="space-y-6">
            {/* Seat Utilization Header Card */}
            <div className="flex justify-between items-center bg-[#151515] p-6 rounded-3xl border border-white/5 shadow-lg">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                            <PieChart size={18} className="text-purple-400" />
                        </div>
                        Seat Utilization
                    </h3>
                    <p className="text-slate-400 text-sm mt-1 ml-11">Fleet-wide Occupancy Metrics</p>
                </div>
                <div className="text-right">
                    <p className="text-4xl font-bold text-white tracking-tight">{analytics.overallUtilization.toFixed(1)}%</p>
                    <p className="text-xs text-slate-500 font-medium mt-1">Average Load Factor</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* High Demand Widget */}
                <div className="bg-[#151515] p-6 rounded-3xl border border-white/5 relative overflow-hidden">
                    {/* Safe to auto-run logic for visual flair can go here if needed, keeping it simple */}
                    <h4 className="font-bold text-white mb-6 flex items-center gap-2">
                        <TrendingUp className="text-green-500" size={18} /> Top Performing Trips
                    </h4>
                    <div className="space-y-6">
                        {topPackages && topPackages.length > 0 ? (
                            topPackages.map((trip, index) => (
                                <div key={index} className="space-y-2">
                                    <div className="flex justify-between items-end text-sm">
                                        <div className="flex flex-col">
                                            <span className="text-slate-200 font-medium">{trip.title}</span>
                                        </div>
                                        <span className="text-white font-mono text-xs bg-white/5 px-2 py-1 rounded">{trip.count} Bookings</span>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden w-full">
                                        <div
                                            className="h-full bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.4)]"
                                            style={{ width: `${(trip.count / (topPackages[0].count || 1)) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))
                        ) : analytics.highDemandTrips.length > 0 ? (
                            analytics.highDemandTrips.map(trip => (
                                <div key={trip.id} className="space-y-2">
                                    <div className="flex justify-between items-end text-sm">
                                        <div className="flex flex-col">
                                            <span className="text-slate-200 font-medium">{trip.title}</span>
                                        </div>
                                        <span className="text-white font-mono text-xs bg-white/5 px-2 py-1 rounded">{trip.booked}/{trip.capacity}</span>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden w-full">
                                        <div
                                            className="h-full bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.4)]"
                                            style={{ width: `${trip.utilization}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-500 text-sm">No data available</p>
                        )}
                    </div>
                </div>

                {/* Low Utilization Alerts */}
                <div className="bg-[#151515] p-6 rounded-3xl border border-white/5">
                    <h4 className="font-bold text-white mb-6 flex items-center gap-2">
                        <AlertTriangle className="text-yellow-500" size={18} /> Low Occupancy Risks
                    </h4>
                    <div className="space-y-4">
                        {analytics.lowUtilizationAlerts.length > 0 ? (
                            analytics.lowUtilizationAlerts.map(trip => (
                                <div key={trip.id} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-slate-200 truncate">{trip.title}</p>
                                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                            <Calendar size={10} /> {trip.date}
                                        </p>
                                    </div>
                                    <div className="text-right pl-4">
                                        <span className="text-yellow-500 font-bold text-lg">{trip.utilization.toFixed(0)}%</span>
                                        <p className="text-[10px] text-slate-600 uppercase tracking-wider">{trip.booked} Seats</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-slate-500 text-sm">No under-booked trips found.</p>
                                <p className="text-slate-600 text-xs mt-1">Great job on sales!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSeatAnalytics;
