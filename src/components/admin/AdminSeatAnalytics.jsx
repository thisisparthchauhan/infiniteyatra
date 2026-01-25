import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { PieChart, TrendingUp, AlertTriangle, Users, Calendar } from 'lucide-react';

const AdminSeatAnalytics = () => {
    const [analytics, setAnalytics] = useState({
        overallUtilization: 0,
        totalCapacity: 0,
        totalBooked: 0,
        highDemandTrips: [],
        lowUtilizationAlerts: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                // Fetch all active departures (future dates or recent past)
                // For simplicity, fetching all
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

                    tripsData.push({
                        id: doc.id,
                        title: data.packageTitle || 'Unknown Trip',
                        date: data.date,
                        capacity,
                        booked,
                        utilization
                    });
                });

                // Sort High Demand
                const highDemand = [...tripsData]
                    .sort((a, b) => b.utilization - a.utilization)
                    .slice(0, 3);

                // Find Low Utilization (e.g., < 40% and date is within 7 days)
                // Mocking date check for simplicity of this snippet (checking all future)
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
            <div className="flex justify-between items-center bg-white/5 p-6 rounded-2xl border border-white/10">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <PieChart className="text-purple-400" /> Seat Utilization
                    </h3>
                    <p className="text-slate-400 text-sm">Fleet-wide Occupancy Metrics</p>
                </div>
                <div className="text-right">
                    <p className="text-3xl font-bold text-white">{analytics.overallUtilization.toFixed(1)}%</p>
                    <p className="text-xs text-slate-400">Average Load Factor</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* High Demand Widget */}
                <div className="glass-card p-6 rounded-2xl border border-white/10">
                    <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="text-green-400" size={18} /> Top Performing Trips
                    </h4>
                    <div className="space-y-4">
                        {analytics.highDemandTrips.map(trip => (
                            <div key={trip.id} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-300 truncate w-32">{trip.title}</span>
                                    <span className="text-white font-mono">{trip.booked}/{trip.capacity}</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                                        style={{ width: `${trip.utilization}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Low Utilization Alerts */}
                <div className="glass-card p-6 rounded-2xl border border-white/10">
                    <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                        <AlertTriangle className="text-yellow-400" size={18} /> Low Occupancy Risks
                    </h4>
                    <div className="space-y-4">
                        {analytics.lowUtilizationAlerts.length > 0 ? (
                            analytics.lowUtilizationAlerts.map(trip => (
                                <div key={trip.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-slate-200 truncate">{trip.title}</p>
                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                            <Calendar size={10} /> {trip.date}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-yellow-400 font-bold text-sm">{trip.utilization.toFixed(0)}%</span>
                                        <p className="text-[10px] text-slate-500">{trip.booked} Seats</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-4 text-slate-500 text-sm">
                                No under-booked trips found. Great job!
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSeatAnalytics;
