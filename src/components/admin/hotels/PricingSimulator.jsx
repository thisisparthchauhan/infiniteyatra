import React, { useState } from 'react';
import { Calculator, Calendar, ArrowRight, AlertTriangle } from 'lucide-react';
import { calculateDynamicPrice } from '../../../utils/pricingEngine';

const PricingSimulator = ({ basePrice, costPrice, inventory, hotelId, roomId }) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSimulate = async () => {
        setLoading(true);
        try {
            const res = await calculateDynamicPrice({
                basePrice: Number(basePrice),
                costPrice: Number(costPrice),
                totalInventory: Number(inventory),
                checkInDate: date,
                hotelId,
                roomId
            });
            setResult(res);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-4 p-4 bg-black/20 rounded-lg border border-white/5">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                    <Calculator size={14} /> Dynamic Pricing Simulator
                </h4>
            </div>

            <div className="flex items-end gap-3 mb-4">
                <div className="flex-1">
                    <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Check-in Date</label>
                    <div className="relative">
                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="w-full bg-[#111] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                        />
                    </div>
                </div>
                <button
                    onClick={handleSimulate}
                    disabled={loading || !basePrice}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors"
                >
                    {loading ? '...' : 'Calculate'}
                </button>
            </div>

            {result && (
                <div className="bg-white/5 rounded-lg p-3 animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/5">
                        <span className="text-xs text-slate-400">Base Price</span>
                        <span className="text-sm font-mono text-slate-400">₹{basePrice}</span>
                    </div>

                    <div className="space-y-1 mb-2">
                        {result.breakdown.isWeekend && (
                            <div className="flex justify-between text-xs text-green-400">
                                <span>Weekend (+15%)</span>
                                <span>x{result.breakdown.dayMultiplier}</span>
                            </div>
                        )}
                        {result.breakdown.daysLeft < 7 && (
                            <div className="flex justify-between text-xs text-yellow-400">
                                <span>Last Minute ({result.breakdown.daysLeft}d left)</span>
                                <span>x{result.breakdown.dateMultiplier}</span>
                            </div>
                        )}
                        {result.breakdown.seasonMultiplier > 1 && (
                            <div className="flex justify-between text-xs text-purple-400">
                                <span>Peak Season</span>
                                <span>x{result.breakdown.seasonMultiplier}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-xs text-blue-400">
                            <span>Occupancy ({result.breakdown.occupancyPercent}%)</span>
                            <span>x{result.breakdown.occupancyMultiplier}</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-white/10">
                        <span className="text-sm font-bold text-white">Final Price</span>
                        <span className="text-lg font-bold text-green-400">₹{result.finalPrice}</span>
                    </div>

                    {result.breakdown.isCapped && (
                        <div className="mt-2 text-[10px] text-orange-400 flex items-center gap-1">
                            <AlertTriangle size={10} /> {result.breakdown.note}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PricingSimulator;
