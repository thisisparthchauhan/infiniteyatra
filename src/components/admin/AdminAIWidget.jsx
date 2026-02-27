import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { predictPrice, getDemandForecast } from '../../utils/aiPrediction';

const AdminAIWidget = () => {
    // Example Scenario: Dayara Bugyal Trek next week
    // Price: 6000, Total: 20, Booked: 17 (High Demand), Days: 5
    const prediction = predictPrice(6000, 20, 17, 5);
    const forecast = getDemandForecast();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-white/10 p-6 rounded-2xl relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles size={64} className="text-purple-400" />
            </div>

            <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <Sparkles size={16} className="text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-white text-lg">AI Price Intelligence</h3>
                    <p className="text-xs text-purple-300">Live Demand Analysis</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Recommendation Card */}
                <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Recommendation</p>
                            <h4 className="text-white font-medium mt-1">Dayara Bugyal (Jan 31)</h4>
                        </div>
                        <span className={`px-2 py-1 rounded text-[10px] font-bold border ${prediction.action === 'INCREASE' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                prediction.action === 'DECREASE' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                    'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            }`}>
                            {prediction.confidence}% Confidence
                        </span>
                    </div>

                    <div className="flex items-end gap-3 mb-2">
                        <span className="text-3xl font-bold text-white">₹{prediction.newPrice}</span>
                        {prediction.action !== 'KEEP' && (
                            <span className="text-sm text-slate-400 line-through mb-1">₹6,000</span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                        {prediction.action === 'INCREASE' && <TrendingUp size={16} className="text-green-400" />}
                        {prediction.action === 'DECREASE' && <TrendingDown size={16} className="text-red-400" />}
                        {prediction.action === 'KEEP' && <Minus size={16} className="text-blue-400" />}

                        <span className={
                            prediction.action === 'INCREASE' ? "text-green-400" :
                                prediction.action === 'DECREASE' ? "text-red-400" :
                                    "text-blue-400"
                        }>
                            {prediction.reason}
                        </span>
                    </div>

                    <button className="w-full mt-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-colors">
                        Apply AI Pricing
                    </button>
                </div>

                {/* Demand Graph (Visual Mock) */}
                <div className="flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">7-Day Demand Forecast</p>
                        <BarChart3 size={16} className="text-slate-500" />
                    </div>

                    <div className="flex items-end justify-between h-32 gap-2">
                        {forecast.map((day, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-1 w-full group">
                                <div className="relative w-full bg-white/5 rounded-t-sm h-full flex items-end overflow-hidden">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${day.demand}%` }}
                                        transition={{ delay: idx * 0.1, duration: 1 }}
                                        className={`w-full ${day.demand > 80 ? 'bg-purple-500' : 'bg-indigo-500/50'} group-hover:bg-purple-400 transition-colors`}
                                    />
                                </div>
                                <span className="text-[10px] text-slate-500 font-medium">{day.day}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </motion.div>
    );
};

export default AdminAIWidget;
