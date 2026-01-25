import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Calendar, DollarSign, ArrowUpRight, ArrowDownRight, Activity, PieChart, BarChart3, Target } from 'lucide-react';

const AdminStats = ({ stats }) => {
    // Calculate real metrics where possible
    const avgBookingValue = stats.total > 0 ? Math.round(stats.revenue / stats.total) : 0;

    // Mocked Investor Metrics (for demo/MVP until data is available)
    const cac = 450; // Customer Acquisition Cost
    const ltv = 12500; // Lifetime Value
    const utilization = "85%";

    const cards = [
        {
            title: "Total Revenue",
            value: `₹${stats.revenue.toLocaleString()}`,
            change: "+12.5% MoM",
            isPositive: true,
            icon: DollarSign,
            color: "from-green-500 to-emerald-500",
            bg: "bg-green-500/10",
            text: "text-green-400"
        },
        {
            title: "Net Profit (Est.)",
            value: `₹${stats.profit.toLocaleString()}`,
            change: "+15.3% MoM",
            isPositive: true,
            icon: TrendingUp,
            color: "from-purple-500 to-pink-500",
            bg: "bg-purple-500/10",
            text: "text-purple-400"
        },
        {
            title: "Total Bookings",
            value: stats.total,
            change: "+8.2% MoM",
            isPositive: true,
            icon: Calendar,
            color: "from-blue-500 to-indigo-500",
            bg: "bg-blue-500/10",
            text: "text-blue-400"
        },
        {
            title: "Avg. Booking Value",
            value: `₹${avgBookingValue.toLocaleString()}`,
            change: "+5.1%",
            isPositive: true,
            icon: BarChart3,
            color: "from-yellow-500 to-orange-500",
            bg: "bg-yellow-500/10",
            text: "text-yellow-400"
        }
    ];

    const investorMetrics = [
        { label: "CAC (Cost Per Acq.)", value: `₹${cac}`, icon: Target, color: "text-red-400" },
        { label: "LTV (Lifetime Value)", value: `₹${ltv}`, icon: Users, color: "text-blue-400" },
        { label: "Seat Utilization", value: utilization, icon: PieChart, color: "text-green-400" },
        { label: "Repeat Cust. %", value: "24%", icon: Activity, color: "text-purple-400" }
    ];

    return (
        <div className="space-y-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="glass-card p-6 rounded-2xl border border-white/10 relative overflow-hidden group hover:border-white/20 transition-all duration-300 shadow-xl"
                        >
                            <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity bg-gradient-to-br ${card.color} rounded-bl-3xl`}>
                                <Icon size={48} />
                            </div>

                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-xl ${card.bg} ${card.text}`}>
                                    <Icon size={24} />
                                </div>
                                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full border ${card.isPositive ? 'bg-green-500/20 text-green-400 border-green-500/20' : 'bg-red-500/20 text-red-500 border-red-500/20'}`}>
                                    {card.isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                    {card.change}
                                </div>
                            </div>

                            <div>
                                <p className="text-slate-400 text-sm font-medium mb-1">{card.title}</p>
                                <h3 className="text-2xl font-bold text-white tracking-tight">{card.value}</h3>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Investor Metrics Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {investorMetrics.map((metric, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 + (index * 0.1) }}
                        className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:bg-white/10 transition-colors"
                    >
                        <div className={`p-2 rounded-lg bg-black/20 ${metric.color}`}>
                            <metric.icon size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">{metric.label}</p>
                            <p className="text-lg font-bold text-white">{metric.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default AdminStats;
