import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, increment } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, Calendar, Clock, DollarSign, Users, Sparkles, Share2, ArrowLeft,
    Loader2, Bed, Car, Compass, CheckCircle2, ChevronDown, Check, Download
} from 'lucide-react';
import SEO from '../components/common/SEO';

const SharedPlan = () => {
    const { shareId } = useParams();
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeDay, setActiveDay] = useState(1);
    const [showBudget, setShowBudget] = useState(false);
    const [showPacking, setShowPacking] = useState(false);
    const [packedItems, setPackedItems] = useState(new Set());
    const [justCreated, setJustCreated] = useState(false);

    useEffect(() => {
        // If they just arrived from generating
        if (window.location.search.includes('new=true')) {
            setJustCreated(true);
            window.history.replaceState({}, '', `/plan/${shareId}`);
        }

        const fetchPlan = async () => {
            try {
                const q = query(collection(db, 'ai_trip_plans'), where('shareId', '==', shareId));
                const snapshot = await getDocs(q);

                if (snapshot.empty) {
                    setError("Trip plan not found or link is invalid.");
                    setLoading(false);
                    return;
                }

                const docSnap = snapshot.docs[0];
                const data = { id: docSnap.id, ...docSnap.data() };
                setPlan(data);

                // Increment view count
                if (!justCreated) {
                    await updateDoc(docSnap.ref, { viewCount: increment(1) });
                }

                // Load packed items from localStorage
                const saved = localStorage.getItem(`packed_${shareId}`);
                if (saved) setPackedItems(new Set(JSON.parse(saved)));

            } catch (err) {
                console.error("Fetch error:", err);
                setError("Failed to load the trip plan.");
            } finally {
                setLoading(false);
            }
        };

        fetchPlan();
    }, [shareId, justCreated]);

    const togglePackItem = (item) => {
        const next = new Set(packedItems);
        if (next.has(item)) next.delete(item);
        else next.add(item);
        setPackedItems(next);
        localStorage.setItem(`packed_${shareId}`, JSON.stringify(Array.from(next)));
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `${plan?.itinerary?.duration}-Day Trip to ${plan?.itinerary?.destination}`,
                text: `Check out my AI-generated trip plan to ${plan?.itinerary?.destination}!`,
                url: window.location.href,
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert("Link copied to clipboard!");
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
        </div>
    );

    if (error || !plan) return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-center px-4">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                <MapPin className="text-red-500 w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Plan Not Found</h2>
            <p className="text-zinc-400 mb-8 max-w-md">{error}</p>
            <Link to="/trip-planner" className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors">
                Create a New Trip
            </Link>
        </div>
    );

    const { itinerary, formData: req } = plan;
    const est = itinerary.totalBudgetEstimate;

    return (
        <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-20 font-sans text-zinc-300">
            <SEO title={`${itinerary.destination} Itinerary | Infinite Yatra AI`} />

            {/* Header / Hero */}
            <div className="container mx-auto px-4 lg:px-8 max-w-5xl">

                {justCreated && (
                    <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center text-green-400">
                                <Sparkles size={20} />
                            </div>
                            <div>
                                <h3 className="text-white font-bold">Your AI Plan is Ready!</h3>
                                <p className="text-sm text-green-200">Generated successfully by Gemini 1.5</p>
                            </div>
                        </div>
                        <button onClick={handleShare} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-black font-bold rounded-xl text-sm transition-colors shadow-lg shadow-green-500/20">
                            Share Plan
                        </button>
                    </div>
                )}

                {!justCreated && (
                    <Link to="/trip-planner" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white mb-8 transition-colors">
                        <ArrowLeft size={16} /> Plan your own trip
                    </Link>
                )}

                <div className="bg-[#111] border border-white/5 rounded-3xl p-6 md:p-10 mb-8 shadow-2xl shadow-black">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-purple-400 font-bold text-sm uppercase tracking-wider mb-3">
                                <Sparkles size={16} /> Created by {plan.userName}
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
                                {itinerary.tripTitle || `${itinerary.duration} Days in ${itinerary.destination}`}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-zinc-400">
                                <span className="flex items-center gap-1.5"><MapPin size={16} /> {itinerary.destination}</span>
                                <span className="flex items-center gap-1.5"><Calendar size={16} /> {itinerary.duration} Days</span>
                                <span className="flex items-center gap-1.5"><Users size={16} /> {req.adults + req.children} Travellers</span>
                                <span className="flex items-center gap-1.5 bg-zinc-800/50 px-2 py-1 rounded-md text-white"><Compass size={14} className="text-blue-400" /> {req.travelType}</span>
                            </div>
                        </div>

                        <div className="flex gap-3 shrink-0">
                            <button onClick={handleShare} className="px-5 py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl font-bold flex items-center gap-2 transition-colors border border-white/10">
                                <Share2 size={18} /> Share
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 p-4 bg-black/50 rounded-2xl border border-white/5">
                        <div className="text-center px-4 border-r border-white/5">
                            <div className="text-xs text-zinc-500 uppercase font-bold mb-1">Est. Budget</div>
                            <div className="text-lg font-bold text-green-400">₹{est?.min?.toLocaleString()} - ₹{est?.max?.toLocaleString()}</div>
                        </div>
                        <div className="text-center px-4 border-r border-white/5 md:border-r-0 lg:border-r">
                            <div className="text-xs text-zinc-500 uppercase font-bold mb-1">Pace</div>
                            <div className="text-lg font-bold text-white capitalize">{req.pace}</div>
                        </div>
                        <div className="text-center px-4 border-r border-white/5">
                            <div className="text-xs text-zinc-500 uppercase font-bold mb-1">Best Time</div>
                            <div className="text-sm font-bold text-white truncate px-2">{itinerary.bestTimeToVisit}</div>
                        </div>
                        <div className="text-center px-4">
                            <div className="text-xs text-zinc-500 uppercase font-bold mb-1">Created</div>
                            <div className="text-sm font-bold text-white">{plan.createdAt?.toDate().toLocaleDateString()}</div>
                        </div>
                    </div>
                </div>

                {/* Day Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-6 hide-scrollbar">
                    {itinerary.days?.map((day) => (
                        <button
                            key={day.day}
                            onClick={() => setActiveDay(day.day)}
                            className={`shrink-0 px-6 py-4 rounded-2xl font-bold transition-all border ${activeDay === day.day
                                ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                                : 'bg-[#111] border-white/5 text-zinc-500 hover:text-white hover:border-white/20'
                                }`}
                        >
                            <div className="text-xs uppercase tracking-wider mb-1 opacity-80">Day {day.day}</div>
                            <div className="text-sm truncate max-w-[150px]">{day.title}</div>
                        </button>
                    ))}
                </div>

                {/* Day Content */}
                <div className="space-y-6">
                    <AnimatePresence mode="wait">
                        {itinerary.days?.filter(d => d.day === activeDay).map(day => (
                            <motion.div
                                key={day.day}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="grid md:grid-cols-3 gap-6"
                            >
                                {/* Left Col: Activities */}
                                <div className="md:col-span-2 space-y-4">
                                    {day.activities?.map((act, i) => (
                                        <div key={i} className="bg-[#111] rounded-2xl p-6 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                                            <div className="flex gap-4">
                                                <div className="w-20 shrink-0 text-center">
                                                    <div className="text-purple-400 font-bold mb-1">{act.time}</div>
                                                    <div className="text-[10px] uppercase font-bold text-zinc-600 bg-white/5 rounded-full py-0.5">{act.period}</div>
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-white mb-2">{act.title}</h3>
                                                    <p className="text-zinc-400 text-sm leading-relaxed mb-3">{act.description}</p>
                                                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 bg-black/50 w-fit px-3 py-1.5 rounded-lg border border-white/5">
                                                        <Clock size={12} /> {act.duration}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {day.proTip && (
                                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5 flex gap-4">
                                            <div className="shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">💡</div>
                                            <div>
                                                <h4 className="font-bold text-blue-400 mb-1">Pro Tip</h4>
                                                <p className="text-sm text-blue-200/80">{day.proTip}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right Col: Stay, Transport, Meals */}
                                <div className="space-y-4">
                                    {/* Accommodation Request Context */}
                                    <div className="bg-[#111] rounded-2xl border border-white/5 overflow-hidden">
                                        <div className="bg-black/50 px-5 py-3 border-b border-white/5 flex items-center gap-2">
                                            <Bed size={16} className="text-pink-400" />
                                            <h3 className="font-bold text-white text-sm">Accommodation</h3>
                                        </div>
                                        <div className="p-5">
                                            {day.accommodation?.iy_partner && (
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/20 border border-purple-500/30 text-purple-400 text-[10px] font-bold uppercase tracking-wider rounded-md mb-3">
                                                    <Sparkles size={10} /> IY Partner
                                                </div>
                                            )}
                                            <h4 className="text-white font-bold mb-1">{day.accommodation?.name || 'TBD'}</h4>
                                            {day.accommodation?.pricePerNight > 0 && (
                                                <div className="text-sm text-green-400 font-bold mb-4">₹{day.accommodation.pricePerNight.toLocaleString()} / night</div>
                                            )}

                                            {day.accommodation?.iy_partner ? (
                                                <Link to={`/hotels/all`} className="block w-full py-2.5 bg-white/10 hover:bg-white/20 text-white text-center rounded-xl text-sm font-bold transition-colors">
                                                    Book on Infinite Yatra
                                                </Link>
                                            ) : (
                                                <div className="text-xs text-zinc-500 italic">Suggestion based on budget</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Transport Context */}
                                    <div className="bg-[#111] rounded-2xl border border-white/5 overflow-hidden">
                                        <div className="bg-black/50 px-5 py-3 border-b border-white/5 flex items-center gap-2">
                                            <Car size={16} className="text-blue-400" />
                                            <h3 className="font-bold text-white text-sm">Transport Setup</h3>
                                        </div>
                                        <div className="p-5">
                                            {day.transport?.iy_transport && (
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded-md mb-3">
                                                    <Sparkles size={10} /> IY Fleet
                                                </div>
                                            )}
                                            <p className="text-sm text-zinc-300 mb-2">{day.transport?.description || 'Local transport'}</p>
                                            {day.transport?.estimatedCost > 0 && (
                                                <div className="text-sm text-zinc-500 font-medium">Est: ₹{day.transport.estimatedCost.toLocaleString()}</div>
                                            )}
                                            {day.transport?.iy_transport && (
                                                <Link to="/transportation" className="mt-3 block w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-xl text-sm font-bold transition-colors">
                                                    Book IY Cab
                                                </Link>
                                            )}
                                        </div>
                                    </div>

                                    {/* Meals */}
                                    <div className="bg-[#111] rounded-2xl border border-white/5 overflow-hidden">
                                        <div className="bg-black/50 px-5 py-3 border-b border-white/5">
                                            <h3 className="font-bold text-white text-sm">Meals Plan</h3>
                                        </div>
                                        <div className="p-5 space-y-4">
                                            <div>
                                                <div className="text-xs uppercase font-bold text-zinc-500 mb-1">Breakfast</div>
                                                <div className="text-sm text-zinc-300">{day.meals?.breakfast || 'At hotel'}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs uppercase font-bold text-zinc-500 mb-1">Lunch</div>
                                                <div className="text-sm text-zinc-300">{day.meals?.lunch || 'Local cafe'}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs uppercase font-bold text-zinc-500 mb-1">Dinner</div>
                                                <div className="text-sm text-zinc-300">{day.meals?.dinner || 'Local cuisine'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Extras Tabs (Budget / Packing) */}
                <div className="mt-12 grid md:grid-cols-2 gap-6 pb-20">
                    {/* Budget Section */}
                    <div className="bg-[#111] rounded-3xl border border-white/5 p-6 md:p-8">
                        <button onClick={() => setShowBudget(!showBudget)} className="w-full flex items-center justify-between">
                            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                                <Wallet className="text-green-400" /> Budget Breakdown
                            </h3>
                            <ChevronDown className={`text-zinc-500 transition-transform ${showBudget ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {showBudget && est?.breakdown && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-8 space-y-6">
                                    {[
                                        { label: 'Accommodation', value: est.breakdown.accommodation, color: 'bg-pink-500' },
                                        { label: 'Transport', value: est.breakdown.transport, color: 'bg-blue-500' },
                                        { label: 'Food & Dining', value: est.breakdown.food, color: 'bg-orange-500' },
                                        { label: 'Activities', value: est.breakdown.activities, color: 'bg-purple-500' },
                                        { label: 'Miscellaneous', value: est.breakdown.miscellaneous, color: 'bg-zinc-500' }
                                    ].map(item => {
                                        const maxVal = est.max;
                                        const pct = Math.min(100, Math.round((item.value / maxVal) * 100)) + '%';
                                        return (
                                            <div key={item.label}>
                                                <div className="flex justify-between text-sm mb-2">
                                                    <span className="text-zinc-400">{item.label}</span>
                                                    <span className="text-white font-bold">~₹{item.value.toLocaleString()}</span>
                                                </div>
                                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                    <div className={`h-full ${item.color} rounded-full`} style={{ width: pct }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Packing List Section */}
                    <div className="bg-[#111] rounded-3xl border border-white/5 p-6 md:p-8">
                        <button onClick={() => setShowPacking(!showPacking)} className="w-full flex items-center justify-between">
                            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                                <CheckCircle2 className="text-blue-400" /> Packing List
                            </h3>
                            <ChevronDown className={`text-zinc-500 transition-transform ${showPacking ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {showPacking && itinerary.packingList && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-8 space-y-2">
                                    {itinerary.packingList.map((item, i) => {
                                        const isPacked = packedItems.has(item);
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => togglePackItem(item)}
                                                className={`w-full text-left p-4 rounded-xl border flex items-center gap-4 transition-all ${isPacked
                                                    ? 'bg-blue-500/10 border-blue-500/30'
                                                    : 'bg-white/5 border-transparent hover:border-white/10 hover:bg-white/10'
                                                    }`}
                                            >
                                                <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-colors ${isPacked ? 'bg-blue-500 border-blue-500' : 'border-zinc-500 bg-black'}`}>
                                                    {isPacked && <Check size={14} className="text-white" />}
                                                </div>
                                                <span className={`text-sm transition-all ${isPacked ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>
                                                    {item}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Final CTA Strip */}
                <div className="bg-gradient-to-r from-blue-900/50 via-purple-900/50 to-pink-900/50 border border-purple-500/30 rounded-3xl p-8 md:p-12 text-center mb-12 shadow-2xl">
                    <h3 className="text-3xl font-black text-white mb-4">Ready to start this adventure?</h3>
                    <p className="text-zinc-300 max-w-xl mx-auto mb-8">
                        Infinite Yatra handles all bookings end-to-end. From luxury stays to complete transport solutions.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Link to="/hotels" className="px-8 py-4 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200 transition-colors">
                            Explore IY Hotels
                        </Link>
                        <Link to="/transportation" className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-2xl transition-colors">
                            Book Transport
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SharedPlan;
