import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import { generatePlanWithGemini } from '../services/geminiService';
import SEO from '../components/SEO';
import {
    MapPin, Calendar, Users, Sparkles, Compass, Leaf, Hotel, Heart, ChevronRight,
    ArrowLeft, Check, Plane, TrendingUp, DollarSign, Wallet, ShieldCheck, Camera,
    Music, ShoppingBag, Waves, Dumbbell, Coffee, Loader2
} from 'lucide-react';

const TYPEWRITER_WORDS = ['Adventure', 'Escape', 'Honeymoon', 'Pilgrimage', 'Trek', 'Getaway'];

const BUDGET_OPTIONS = [
    { id: 'budget', label: 'Budget', desc: 'Under ₹15,000/person', icon: Wallet },
    { id: 'comfort', label: 'Comfort', desc: '₹15,000 – ₹40,000/person', icon: TrendingUp },
    { id: 'premium', label: 'Premium', desc: '₹40,000 – ₹1,00,000/person', icon: ShieldCheck },
    { id: 'luxury', label: 'Luxury', desc: '₹1,00,000+/person', icon: DollarSign }
];

const TRAVEL_TYPES = [
    { id: 'adventure', label: 'Adventure', icon: Compass },
    { id: 'beach', label: 'Beach', icon: Waves },
    { id: 'pilgrimage', label: 'Pilgrimage', icon: Heart },
    { id: 'honeymoon', label: 'Honeymoon', icon: Heart },
    { id: 'family', label: 'Family', icon: Users },
    { id: 'backpack', label: 'Backpack', icon: MapPin },
    { id: 'wellness', label: 'Wellness', icon: Leaf },
    { id: 'cultural', label: 'Cultural', icon: Camera }
];

const INTERESTS = [
    { id: 'food', label: 'Food & Cuisine', icon: Coffee },
    { id: 'photo', label: 'Photography', icon: Camera },
    { id: 'shop', label: 'Shopping', icon: ShoppingBag },
    { id: 'night', label: 'Night Life', icon: Music },
    { id: 'sports', label: 'Adventure Sports', icon: Dumbbell },
    { id: 'yoga', label: 'Yoga/Wellness', icon: Leaf },
    { id: 'trek', label: 'Trekking', icon: Compass },
    { id: 'history', label: 'History', icon: Hotel }
];

const TripPlanner = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isGenerating, setIsGenerating] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);

    // Typewriter effect
    const [wordIdx, setWordIdx] = useState(0);
    const [text, setText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const word = TYPEWRITER_WORDS[wordIdx];
        const timeout = setTimeout(() => {
            if (!isDeleting) {
                setText(word.substring(0, text.length + 1));
                if (text === word) {
                    setTimeout(() => setIsDeleting(true), 1500);
                }
            } else {
                setText(word.substring(0, text.length - 1));
                if (text === '') {
                    setIsDeleting(false);
                    setWordIdx((prev) => (prev + 1) % TYPEWRITER_WORDS.length);
                }
            }
        }, isDeleting ? 50 : 100);
        return () => clearTimeout(timeout);
    }, [text, isDeleting, wordIdx]);

    // Form State
    const [formData, setFormData] = useState({
        destination: '',
        startDate: '',
        endDate: '',
        duration: 3,
        isFlexible: true,
        adults: 2,
        children: 0,
        travelType: 'adventure',
        pace: 'balanced',
        budget: 'comfort',
        accommodation: 'Hotel',
        transport: 'Car/Cab',
        interests: [],
        specialRequests: ''
    });

    const updateForm = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

    const handleGenerate = async () => {
        if (!import.meta.env.VITE_GEMINI_API_KEY) {
            alert("No AI strictly configured (VITE_GEMINI_API_KEY missing). Please add to .env file to continue.");
            return;
        }

        setIsGenerating(true);

        // Fake loading steps
        const loadingInterval = setInterval(() => {
            setLoadingStep(prev => prev < 4 ? prev + 1 : prev);
        }, 2000);

        try {
            const itinerary = await generatePlanWithGemini(formData);

            // Generate shareId
            const shareId = Math.random().toString(36).substring(2, 10);

            // Save to Firestore
            const docRef = await addDoc(collection(db, 'ai_trip_plans'), {
                userId: auth.currentUser?.uid || 'guest',
                userName: auth.currentUser?.displayName || 'Guest',
                formData,
                itinerary,
                createdAt: serverTimestamp(),
                shareId,
                saved: !!auth.currentUser,
                viewCount: 0
            });

            // Award credits if logged in
            if (auth.currentUser) {
                const passportRef = doc(db, 'iy_passport', auth.currentUser.uid);
                await updateDoc(passportRef, {
                    credits: increment(10),
                    transactions: arrayUnion({
                        type: 'ai_planner',
                        amount: 10,
                        description: `Planned trip to ${formData.destination}`,
                        date: new Date().toISOString(),
                        id: `ai_${Date.now()}`
                    })
                });
            }

            clearInterval(loadingInterval);
            navigate(`/plan/${shareId}?new=true`);

        } catch (error) {
            console.error(error);
            alert(error.message || "Failed to generate itinerary. Please try again.");
            clearInterval(loadingInterval);
            setIsGenerating(false);
        }
    };

    const nextStep = () => {
        if (step === 1 && !formData.destination) {
            alert("Please enter a destination");
            return;
        }
        setStep(s => Math.min(4, s + 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const prevStep = () => {
        setStep(s => Math.max(1, s - 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // --- RENDER HELPERS ---

    const renderProgressBar = () => (
        <div className="max-w-3xl mx-auto mb-8 relative px-4">
            <div className="flex justify-between text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">
                <span className={step >= 1 ? 'text-purple-400' : ''}>Where & When</span>
                <span className={step >= 2 ? 'text-purple-400' : ''}>Style</span>
                <span className={step >= 3 ? 'text-purple-400' : ''}>Budget</span>
                <span className={step >= 4 ? 'text-purple-400' : ''}>Review</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 rounded-full"
                    style={{ width: `${(step / 4) * 100}%` }}
                />
            </div>
        </div>
    );

    const renderStep1 = () => (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
            <div>
                <label className="text-xl font-bold text-white mb-4 block flex items-center gap-2">
                    <MapPin className="text-purple-400" /> Where do you want to go?
                </label>
                <input
                    type="text"
                    value={formData.destination}
                    onChange={(e) => updateForm('destination', e.target.value)}
                    placeholder="e.g. Manali, Bali, Kerala..."
                    className="w-full bg-[#111] border border-white/10 rounded-2xl px-6 py-4 text-white text-lg focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all placeholder:text-zinc-600 shadow-inner shadow-black/50"
                />
                <div className="flex gap-2 mt-3 flex-wrap">
                    {['Manali', 'Goa', 'Kerala', 'Rajasthan', 'Kashmir', 'Ladakh'].map(dest => (
                        <button key={dest} onClick={() => updateForm('destination', dest)} className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full text-xs text-zinc-400 transition-colors">
                            {dest}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="text-xl font-bold text-white mb-4 block flex items-center gap-2">
                    <Calendar className="text-blue-400" /> When are you travelling?
                </label>
                <div className="grid md:grid-cols-2 gap-4">
                    <button
                        onClick={() => updateForm('isFlexible', true)}
                        className={`p-4 rounded-2xl border text-left transition-all ${formData.isFlexible ? 'bg-blue-500/10 border-blue-500/50' : 'bg-[#111] border-white/10 hover:border-white/20'}`}
                    >
                        <div className="font-bold text-white mb-1">I'm flexible</div>
                        <div className="text-sm text-zinc-500">I just know the duration</div>
                    </button>
                    <button
                        onClick={() => updateForm('isFlexible', false)}
                        className={`p-4 rounded-2xl border text-left transition-all ${!formData.isFlexible ? 'bg-purple-500/10 border-purple-500/50' : 'bg-[#111] border-white/10 hover:border-white/20'}`}
                    >
                        <div className="font-bold text-white mb-1">Specific dates</div>
                        <div className="text-sm text-zinc-500">I have flights/leaves booked</div>
                    </button>
                </div>

                {formData.isFlexible ? (
                    <div className="mt-4 p-6 bg-[#111] border border-white/10 rounded-2xl flex items-center justify-between">
                        <span className="text-zinc-400 font-medium">Trip Duration</span>
                        <div className="flex items-center gap-4">
                            <button onClick={() => updateForm('duration', Math.max(1, formData.duration - 1))} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white font-bold transition-colors">-</button>
                            <span className="text-xl font-bold text-white w-16 text-center">{formData.duration} Days</span>
                            <button onClick={() => updateForm('duration', formData.duration + 1)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white font-bold transition-colors">+</button>
                        </div>
                    </div>
                ) : (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <input type="date" value={formData.startDate} onChange={e => updateForm('startDate', e.target.value)} className="bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white outline-none" />
                        <input type="date" value={formData.endDate} onChange={e => {
                            updateForm('endDate', e.target.value);
                            if (formData.startDate) {
                                const days = Math.ceil((new Date(e.target.value) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24));
                                updateForm('duration', days > 0 ? days : 1);
                            }
                        }} className="bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white outline-none" />
                    </div>
                )}
            </div>

            <div>
                <label className="text-xl font-bold text-white mb-4 block flex items-center gap-2">
                    <Users className="text-pink-400" /> Travellers
                </label>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-[#111] border border-white/10 rounded-2xl flex items-center justify-between">
                        <div>
                            <span className="text-white font-bold block">Adults</span>
                            <span className="text-xs text-zinc-500">12+ years</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => updateForm('adults', Math.max(1, formData.adults - 1))} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors">-</button>
                            <span className="font-bold text-white w-4 text-center">{formData.adults}</span>
                            <button onClick={() => updateForm('adults', formData.adults + 1)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors">+</button>
                        </div>
                    </div>
                    <div className="p-4 bg-[#111] border border-white/10 rounded-2xl flex items-center justify-between">
                        <div>
                            <span className="text-white font-bold block">Children</span>
                            <span className="text-xs text-zinc-500">0-11 years</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => updateForm('children', Math.max(0, formData.children - 1))} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors">-</button>
                            <span className="font-bold text-white w-4 text-center">{formData.children}</span>
                            <button onClick={() => updateForm('children', formData.children + 1)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors">+</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-4">
                <button onClick={nextStep} className="w-full py-4 bg-white text-black rounded-2xl font-bold text-lg hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2">
                    Next Step <ChevronRight size={20} />
                </button>
            </div>
        </motion.div>
    );

    const renderStep2 = () => (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
            <div>
                <label className="text-xl font-bold text-white mb-4 block flex items-center gap-2">
                    <Sparkles className="text-purple-400" /> What kind of trip is this?
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {TRAVEL_TYPES.map(type => {
                        const Icon = type.icon;
                        const isSelected = formData.travelType === type.id;
                        return (
                            <button
                                key={type.id}
                                onClick={() => updateForm('travelType', type.id)}
                                className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${isSelected ? 'bg-purple-500/10 border-purple-500 text-purple-400' : 'bg-[#111] border-white/10 text-zinc-400 hover:border-white/30'}`}
                            >
                                <Icon size={24} />
                                <span className="font-medium text-sm">{type.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div>
                <label className="text-xl font-bold text-white mb-4 block flex items-center gap-2">
                    <Compass className="text-blue-400" /> Travel Pace
                </label>
                <div className="space-y-3">
                    {[
                        { id: 'relaxed', title: 'Relaxed', desc: '1-2 main activities per day, lots of free time' },
                        { id: 'balanced', title: 'Balanced', desc: '3-4 activities, good mix of exploring and resting' },
                        { id: 'packed', title: 'Packed', desc: 'Maximize sightseeing, early starts, full days' }
                    ].map(pace => (
                        <button
                            key={pace.id}
                            onClick={() => updateForm('pace', pace.id)}
                            className={`w-full p-4 rounded-xl border flex items-center justify-between text-left transition-all ${formData.pace === pace.id ? 'bg-blue-500/10 border-blue-500/50' : 'bg-[#111] border-white/10 hover:border-white/30'}`}
                        >
                            <div>
                                <div className={`font-bold ${formData.pace === pace.id ? 'text-blue-400' : 'text-white'}`}>{pace.title}</div>
                                <div className="text-xs text-zinc-500 mt-1">{pace.desc}</div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.pace === pace.id ? 'border-blue-500' : 'border-zinc-600'}`}>
                                {formData.pace === pace.id && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex gap-4 pt-4">
                <button onClick={prevStep} className="px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-bold transition-colors">
                    Back
                </button>
                <button onClick={nextStep} className="flex-1 py-4 bg-white text-black rounded-2xl font-bold text-lg hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2">
                    Next Step <ChevronRight size={20} />
                </button>
            </div>
        </motion.div>
    );

    const renderStep3 = () => (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
            <div>
                <label className="text-xl font-bold text-white mb-4 block flex items-center gap-2">
                    <Wallet className="text-green-400" /> What's your total budget?
                </label>
                <div className="grid md:grid-cols-2 gap-3">
                    {BUDGET_OPTIONS.map(budget => {
                        const Icon = budget.icon;
                        const isSelected = formData.budget === budget.id;
                        return (
                            <button
                                key={budget.id}
                                onClick={() => updateForm('budget', budget.id)}
                                className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${isSelected ? 'bg-green-500/10 border-green-500/50' : 'bg-[#111] border-white/10 hover:border-white/30'}`}
                            >
                                <div className={`p-2 rounded-lg ${isSelected ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-zinc-400'}`}>
                                    <Icon size={20} />
                                </div>
                                <div>
                                    <div className="font-bold text-white">{budget.label}</div>
                                    <div className="text-xs text-zinc-500">{budget.desc}</div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="text-sm font-bold text-white mb-3 block">Accommodation</label>
                    <select
                        value={formData.accommodation}
                        onChange={e => updateForm('accommodation', e.target.value)}
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500/50"
                    >
                        <option>Hostel</option>
                        <option>Guesthouse</option>
                        <option>Hotel</option>
                        <option>Resort</option>
                        <option>Homestay</option>
                    </select>
                </div>
                <div>
                    <label className="text-sm font-bold text-white mb-3 block">Transport</label>
                    <select
                        value={formData.transport}
                        onChange={e => updateForm('transport', e.target.value)}
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500/50"
                    >
                        <option>Train</option>
                        <option>Flight</option>
                        <option>Car/Cab</option>
                        <option>Bus</option>
                        <option>Bike</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="text-sm font-bold text-white mb-3 block">Special Interests (Optional)</label>
                <div className="flex flex-wrap gap-2">
                    {INTERESTS.map(interest => {
                        const Icon = interest.icon;
                        const isSelected = formData.interests.includes(interest.label);
                        return (
                            <button
                                key={interest.id}
                                onClick={() => {
                                    const next = isSelected
                                        ? formData.interests.filter(i => i !== interest.label)
                                        : [...formData.interests, interest.label];
                                    updateForm('interests', next);
                                }}
                                className={`px-3 py-2 rounded-full border text-xs font-medium flex items-center gap-1.5 transition-all ${isSelected ? 'bg-purple-500 border-purple-500 text-white' : 'bg-[#111] border-white/10 text-zinc-400 hover:border-white/30'}`}
                            >
                                <Icon size={12} /> {interest.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex gap-4 pt-4">
                <button onClick={prevStep} className="px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-bold transition-colors">
                    Back
                </button>
                <button onClick={nextStep} className="flex-1 py-4 bg-white text-black rounded-2xl font-bold text-lg hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2">
                    Review Plan <ChevronRight size={20} />
                </button>
            </div>
        </motion.div>
    );

    const renderStep4 = () => (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div>
                <label className="text-xl font-bold text-white mb-4 block flex items-center gap-2">
                    <Sparkles className="text-purple-400" /> Anything specific? (Optional)
                </label>
                <textarea
                    value={formData.specialRequests}
                    onChange={e => updateForm('specialRequests', e.target.value)}
                    placeholder="Tell us about dietary needs, accessibility requirements, specific places you must visit, or things you want to avoid..."
                    rows={4}
                    className="w-full bg-[#111] border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:border-purple-500/50 outline-none transition-all placeholder:text-zinc-600 resize-none"
                />
            </div>

            <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Your Trip Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <span className="text-zinc-500 block text-xs">Destination</span>
                        <span className="text-white font-bold">{formData.destination}</span>
                    </div>
                    <div>
                        <span className="text-zinc-500 block text-xs">Duration</span>
                        <span className="text-white font-bold">{formData.duration} Days</span>
                    </div>
                    <div>
                        <span className="text-zinc-500 block text-xs">Travellers</span>
                        <span className="text-white font-bold">{formData.adults + formData.children}</span>
                    </div>
                    <div>
                        <span className="text-zinc-500 block text-xs">Budget</span>
                        <span className="text-white font-bold capitalize">{formData.budget}</span>
                    </div>
                </div>
            </div>

            {!auth.currentUser && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm flex gap-3 text-blue-200">
                    <Sparkles className="shrink-0 text-blue-400" size={18} />
                    <p>Log in before generating to save this plan and earn <strong>10 IY Passport Credits</strong> automatically.</p>
                </div>
            )}

            <div className="flex gap-4 pt-4">
                <button onClick={prevStep} className="px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-bold transition-colors">
                    Back
                </button>
                <button
                    onClick={handleGenerate}
                    className="flex-1 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/40 transition-all active:scale-95 flex items-center justify-center gap-2 relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                    <Sparkles size={20} />
                    Generate AI Itinerary
                </button>
            </div>
        </motion.div>
    );

    const renderLoading = () => (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
        >
            <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 border-4 border-white/10 rounded-full" />
                <div className="absolute inset-0 border-4 border-purple-500 rounded-full border-t-transparent animate-spin" />
                <Plane className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple-400 animate-pulse" size={32} />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Planning your perfect trip...</h2>
            <p className="text-zinc-500 mb-8">Gemini AI is crafting a bespoke experience for you.</p>

            <div className="w-full max-w-sm space-y-4 text-left">
                {[
                    'Analyzing travel style & preferences',
                    'Finding the best routes & logistics',
                    'Checking IY Partner availability',
                    'Building day-by-day itinerary',
                    'Calculating budget breakdown'
                ].map((text, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                        {loadingStep > i ? (
                            <Check className="text-green-400" size={18} />
                        ) : loadingStep === i ? (
                            <Loader2 className="animate-spin text-purple-500" size={18} />
                        ) : (
                            <div className="w-4.5 h-4.5 rounded-full border border-white/20" />
                        )}
                        <span className={loadingStep >= i ? 'text-white' : 'text-zinc-600 transition-colors duration-500'}>
                            {text}
                        </span>
                    </div>
                ))}
            </div>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-20 relative overflow-hidden font-sans">
            <SEO title="AI Trip Planner | Infinite Yatra" description="Plan your perfect trip with our Gemini AI-powered itinerary generator." />

            {/* Cinematic Background */}
            <div className="absolute inset-0 z-0 opacity-40">
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-transparent to-[#0a0a0a] z-10" />
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-900/20 rounded-full blur-[120px] mix-blend-screen" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[100px] mix-blend-screen" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                {/* Hero */}
                {!isGenerating && (
                    <div className="text-center mb-16 pt-8">
                        <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight tracking-tight">
                            Plan Your Perfect <br className="md:hidden" />
                            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent border-b-4 border-purple-500">
                                {text}<span className="animate-pulse">|</span>
                            </span>
                        </h1>
                        <p className="text-zinc-400 text-lg max-w-2xl mx-auto font-medium">
                            Generate bespoke, day-by-day travel itineraries in seconds. Complete with budget estimates, transport guides, and curated stays.
                        </p>
                    </div>
                )}

                {/* Form / Loading Area */}
                <div className="max-w-3xl mx-auto">
                    {isGenerating ? (
                        renderLoading()
                    ) : (
                        <div className="bg-[#1a1a1a]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 md:p-10 shadow-2xl shadow-black/50">
                            {renderProgressBar()}

                            <div className="mt-8">
                                <AnimatePresence mode="wait">
                                    {step === 1 && <motion.div key="1">{renderStep1()}</motion.div>}
                                    {step === 2 && <motion.div key="2">{renderStep2()}</motion.div>}
                                    {step === 3 && <motion.div key="3">{renderStep3()}</motion.div>}
                                    {step === 4 && <motion.div key="4">{renderStep4()}</motion.div>}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TripPlanner;
