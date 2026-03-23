import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { Sparkles, Calendar, MapPin, Users, TrendingUp, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminAIPlanner = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        saved: 0,
        topDests: [],
        totalViews: 0
    });

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const q = query(collection(db, 'ai_trip_plans'), orderBy('createdAt', 'desc'), limit(50));
                const snapshot = await getDocs(q);

                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setPlans(data);

                // Calculate stats
                let saved = 0;
                let views = 0;
                const dests = {};

                data.forEach(p => {
                    if (p.saved) saved++;
                    views += (p.viewCount || 0);

                    const dest = p.itinerary?.destination || p.formData?.destination;
                    if (dest) {
                        dests[dest] = (dests[dest] || 0) + 1;
                    }
                });

                const topDests = Object.entries(dests)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([name, count]) => ({ name, count }));

                setStats({
                    total: data.length,
                    saved,
                    topDests,
                    totalViews: views
                });
            } catch (error) {
                console.error("Error fetching AI plans:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPlans();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <Sparkles className="text-purple-500" /> AI Planner Analytics
            </h1>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4">
                        <Sparkles size={24} />
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-1">{stats.total}</div>
                    <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Plans Generated</div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-4">
                        <TrendingUp size={24} />
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-1">{stats.saved}</div>
                    <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Saved Plans</div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                        <Users size={24} />
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-1">{stats.totalViews}</div>
                    <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Shared Views</div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Popular Destinations */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 lg:col-span-1">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <MapPin className="text-red-500" size={20} /> Top Destinations
                    </h2>
                    <div className="space-y-4">
                        {stats.topDests.map((dest, i) => {
                            const max = stats.topDests[0].count;
                            const pct = (dest.count / max) * 100;
                            return (
                                <div key={i}>
                                    <div className="flex justify-between text-sm font-medium text-slate-700 mb-1">
                                        <span>{dest.name}</span>
                                        <span>{dest.count}</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Recent Plans Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 lg:col-span-2 overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Calendar className="text-blue-500" size={20} /> Recent Plans (Top 50)
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 font-medium">User</th>
                                    <th className="px-6 py-4 font-medium">Destination</th>
                                    <th className="px-6 py-4 font-medium">Duration</th>
                                    <th className="px-6 py-4 font-medium">Est. Budget</th>
                                    <th className="px-6 py-4 font-medium">Generated On</th>
                                    <th className="px-6 py-4 font-medium">Link</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {plans.map((plan) => (
                                    <tr key={plan.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{plan.userName}</div>
                                            {plan.saved && <span className="inline-flex mt-1 items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800">Saved</span>}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {plan.itinerary?.destination || plan.formData?.destination}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {plan.itinerary?.duration || plan.formData?.duration} Days
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            ₹{plan.itinerary?.totalBudgetEstimate?.min?.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {plan.createdAt?.toDate().toLocaleDateString() || 'Just now'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link to={`/plan/${plan.shareId}`} target="_blank" className="text-purple-600 hover:text-purple-800 font-medium hover:underline">
                                                View Plan
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAIPlanner;
