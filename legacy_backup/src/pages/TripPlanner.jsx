import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, Calendar, DollarSign, Users, Sparkles,
    Clock, Sun, Sunset, Moon, Coffee, Utensils, UtensilsCrossed,
    Camera, Compass, Heart, TrendingUp, Loader2,
    ChevronRight, Leaf, Check, Plane, Hotel
} from 'lucide-react';
import SEO from '../components/SEO';
import { generateItinerary as generateItineraryAPI } from '../services/groq';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { sendTripEmail } from '../services/email';


const budgetOptions = [
    { value: 'comfort', label: 'Comfort', icon: '🛋️', description: 'Standard' },
    { value: 'premium', label: 'Premium', icon: '💎', description: 'High End' },
    { value: 'luxury', label: 'Luxury', icon: '👑', description: 'Top Tier' }
];

const travelStyles = [
    { value: 'cultural', label: 'Cultural', icon: Camera },
    { value: 'classic', label: 'Classic', icon: Compass },
    { value: 'nature', label: 'Nature', icon: Leaf },
    { value: 'cityscape', label: 'Cityscape', icon: Hotel },
    { value: 'historical', label: 'Historical', icon: MapPin }
];

const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const groupTypes = [
    { value: 'solo', label: 'Solo', icon: Users },
    { value: 'family', label: 'Family', icon: Users },
    { value: 'couple', label: 'Couple', icon: Heart },
    { value: 'friends', label: 'Friends', icon: Users },
    { value: 'elderly', label: 'Elderly', icon: Users }
];

const paceOptions = [
    { value: 'ambitious', label: 'Ambitious', icon: TrendingUp },
    { value: 'relaxed', label: 'Relaxed', icon: Coffee }
];

const TripPlanner = () => {
    const [formData, setFormData] = useState({
        destination: '',
        startDate: '',
        endDate: '',
        budget: 'comfort',
        travelers: '2',
        travelStyle: [],
        groupType: 'couple',
        pace: 'relaxed',
        diet: 'none',
        interests: '',
        isFlexible: false,
        flexibleDays: 5,
        flexibleMonth: 'Any'
    });

    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedItinerary, setGeneratedItinerary] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [user, setUser] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isEmailing, setIsEmailing] = useState(false);
    const [savedTripId, setSavedTripId] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    const saveTrip = async (dataToSave = null, silent = false) => {
        if (!user) {
            if (!silent) alert("Please login to save your trip!");
            return null;
        }

        const tripData = dataToSave || generatedItinerary;
        if (!tripData) return null;

        setIsSaving(true);
        try {
            const docRef = await addDoc(collection(db, 'savedTrips'), {
                userId: user.uid,
                destination: tripData.destination,
                days: tripData.days,
                itinerary: tripData,
                createdAt: serverTimestamp(),
                isPublic: true,
                isDeleted: false
            });

            setSavedTripId(docRef.id);
            if (!silent) alert("Trip saved successfully! View it in My Trips.");
            return docRef.id;
        } catch (error) {
            console.error("Error saving trip:", error);
            if (!silent) alert("Failed to save trip.");
            return null;
        } finally {
            setIsSaving(false);
        }
    };

    const handleEmailTrip = async () => {
        if (!user) {
            alert("Please login to email the itinerary.");
            return;
        }
        if (!generatedItinerary) return;

        setIsEmailing(true);
        try {
            const tripDataWithId = { ...generatedItinerary, id: savedTripId };
            const result = await sendTripEmail(tripDataWithId, user.email, user.displayName || 'Traveler');
            if (result.success) {
                alert("Itinerary emailed successfully!");
            } else {
                alert("Failed to send email. Please try again.");
            }
        } catch (error) {
            console.error(error);
            alert("Error sending email.");
        } finally {
            setIsEmailing(false);
        }
    };

    // Scroll to top when component mounts
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);



    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const toggleTravelStyle = (style) => {
        setFormData(prev => ({
            ...prev,
            travelStyle: prev.travelStyle.includes(style)
                ? prev.travelStyle.filter(s => s !== style)
                : [...prev.travelStyle, style]
        }));
    };

    const generateItinerary = async (e) => {
        e.preventDefault();
        console.log("Generating itinerary with data:", formData); // Debug log
        setIsGenerating(true);
        setGeneratedItinerary(null);

        try {
            const dataToSubmit = { ...formData };
            console.log("Submitting to API:", dataToSubmit); // Debug log

            const itinerary = await generateItineraryAPI(dataToSubmit);
            console.log("API Response:", itinerary); // Debug log
            setGeneratedItinerary(itinerary);

            // Auto-save if user is logged in
            // Auto-save if user is logged in
            if (user) {
                try {
                    const savedId = await saveTrip(itinerary, true);
                    if (savedId) {
                        console.log("Auto-saved trip with ID:", savedId);
                    }
                } catch (err) {
                    console.error("Auto-save failed:", err);
                }
            }

            // Scroll to results
            setTimeout(() => {
                document.getElementById('itinerary-results')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 100);
        } catch (error) {
            console.error("Generation Error:", error); // Debug log
            alert(error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen bg-black pt-24 pb-16 relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] pointer-events-none"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] pointer-events-none"></div>

            <SEO
                title="Trip Planner"
                description="Plan your perfect trip with our AI-powered itinerary generator. Customized travel plans based on your budget and preferences."
                url="/trip-planner"
            />
            <div className="container mx-auto px-6 lg:px-8 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-4 border border-white/10">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        <span className="text-sm font-semibold text-purple-200">AI-Powered Trip Planning</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Plan Your Perfect Journey
                    </h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        Let our AI create a personalized itinerary tailored to your preferences, budget, and travel style
                    </p>
                </motion.div>

                {/* Trip Planning Form */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="max-w-4xl mx-auto mb-16"
                >
                    <form onSubmit={generateItinerary} className="glass-card rounded-3xl p-8 md:p-10 border border-white/10 relative">

                        {/* Destination */}
                        <div className="mb-8">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-3">
                                <MapPin className="w-5 h-5 text-blue-400" />
                                Where do you want to go?
                            </label>
                            <input
                                type="text"
                                name="destination"
                                value={formData.destination}
                                onChange={handleInputChange}
                                placeholder="e.g., Paris, Tokyo, Bali..."
                                required
                                className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500/50 focus:bg-white/10 focus:ring-1 focus:ring-blue-500/50 transition-all outline-none text-white placeholder-slate-500"
                            />
                        </div>

                        {/* Date & Duration Section */}
                        <div className="mb-8 relative">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-3">
                                <Calendar className="w-5 h-5 text-purple-400" />
                                Date & Duration
                            </label>

                            <button
                                type="button"
                                onClick={() => setShowDatePicker(!showDatePicker)}
                                className="w-full px-5 py-4 rounded-xl border border-white/10 hover:border-purple-500/50 bg-white/5 text-left flex items-center justify-between transition-all"
                            >
                                <span className="text-white font-medium">
                                    {formData.isFlexible
                                        ? `${formData.flexibleDays} Days in ${formData.flexibleMonth}`
                                        : (formData.startDate && formData.endDate
                                            ? `${formData.startDate} to ${formData.endDate}`
                                            : "Select Dates or Duration")
                                    }
                                </span>
                                <ChevronRight className={`w-5 h-5 text-slate-500 transition-transform ${showDatePicker ? 'rotate-90' : ''}`} />
                            </button>

                            {/* Date Picker Popover */}
                            <AnimatePresence>
                                {showDatePicker && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute z-50 top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 p-6"
                                    >
                                        {/* Toggle */}
                                        <div className="flex justify-center mb-6">
                                            <div className="bg-slate-100 p-1 rounded-full flex">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, isFlexible: false }))}
                                                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${!formData.isFlexible ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                                                >
                                                    Specific Dates
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, isFlexible: true }))}
                                                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${formData.isFlexible ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                                                >
                                                    I'm Flexible
                                                </button>
                                            </div>
                                        </div>

                                        {formData.isFlexible ? (
                                            <div className="space-y-6">
                                                {/* Days Selector */}
                                                <div>
                                                    <label className="text-sm font-medium text-slate-700 mb-3 block">How many days?</label>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData(prev => ({ ...prev, flexibleDays: Math.max(1, prev.flexibleDays - 1) }))}
                                                            className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-xl"
                                                        >-</button>
                                                        <span className="text-xl font-bold text-slate-900 w-16 text-center">{formData.flexibleDays} Days</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData(prev => ({ ...prev, flexibleDays: prev.flexibleDays + 1 }))}
                                                            className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-xl"
                                                        >+</button>
                                                    </div>
                                                    <div className="grid grid-cols-4 gap-2 mt-3">
                                                        {[3, 5, 7, 10].map(d => (
                                                            <button
                                                                key={d}
                                                                type="button"
                                                                onClick={() => setFormData(prev => ({ ...prev, flexibleDays: d }))}
                                                                className={`py-2 rounded-lg text-sm border ${formData.flexibleDays === d ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'}`}
                                                            >
                                                                {d} Days
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Month Selector */}
                                                <div>
                                                    <label className="text-sm font-medium text-slate-700 mb-3 block">Which month?</label>
                                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData(prev => ({ ...prev, flexibleMonth: 'Any' }))}
                                                            className={`py-2 rounded-lg text-sm border ${formData.flexibleMonth === 'Any' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'}`}
                                                        >
                                                            Any
                                                        </button>
                                                        {months.map(m => (
                                                            <button
                                                                key={m}
                                                                type="button"
                                                                onClick={() => setFormData(prev => ({ ...prev, flexibleMonth: m }))}
                                                                className={`py-2 rounded-lg text-sm border ${formData.flexibleMonth === m ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'}`}
                                                            >
                                                                {m.slice(0, 3)}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                                                    <input
                                                        type="date"
                                                        name="startDate"
                                                        value={formData.startDate}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
                                                    <input
                                                        type="date"
                                                        name="endDate"
                                                        value={formData.endDate}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => setShowDatePicker(false)}
                                            className="w-full mt-6 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                                        >
                                            Confirm
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* With Whom (Group Type) */}
                        <div className="mb-8">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                                <Users className="w-5 h-5 text-pink-600" />
                                With Whom
                            </label>
                            <div className="flex flex-wrap gap-3">
                                {groupTypes.map(type => (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, groupType: type.value }))}
                                        className={`px-6 py-3 rounded-xl border text-sm font-medium transition-all flex items-center gap-2 ${formData.groupType === type.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-blue-200'}`}
                                    >
                                        {/* <type.icon className="w-4 h-4" /> */}
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Travel Style */}
                        <div className="mb-8">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                                <Compass className="w-5 h-5 text-purple-600" />
                                Travel Style
                            </label>
                            <div className="flex flex-wrap gap-3">
                                {travelStyles.map(style => {
                                    const Icon = style.icon;
                                    const isSelected = formData.travelStyle.includes(style.value);
                                    return (
                                        <button
                                            key={style.value}
                                            type="button"
                                            onClick={() => toggleTravelStyle(style.value)}
                                            className={`px-6 py-3 rounded-xl border text-sm font-medium transition-all flex items-center gap-2 ${isSelected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-blue-200'}`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {style.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Travel Pace */}
                        <div className="mb-8">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                                <Clock className="w-5 h-5 text-orange-600" />
                                Travel Pace
                            </label>
                            <div className="flex flex-wrap gap-3">
                                {paceOptions.map(option => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, pace: option.value }))}
                                        className={`px-6 py-3 rounded-xl border text-sm font-medium transition-all flex items-center gap-2 ${formData.pace === option.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-blue-200'}`}
                                    >
                                        {/* <option.icon className="w-4 h-4" /> */}
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Accommodation (Budget) */}
                        <div className="mb-8">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                                <Hotel className="w-5 h-5 text-green-600" />
                                Accommodation
                            </label>
                            <div className="flex flex-wrap gap-3">
                                {budgetOptions.map(option => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, budget: option.value }))}
                                        className={`px-6 py-3 rounded-xl border text-sm font-medium transition-all flex items-center gap-2 ${formData.budget === option.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-blue-200'}`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Other Needs (Interests) */}
                        <div className="mb-8">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                                <Sparkles className="w-5 h-5 text-yellow-600" />
                                Other Needs
                            </label>
                            <textarea
                                name="interests"
                                value={formData.interests}
                                onChange={handleInputChange}
                                placeholder="e.g., Food, Shopping, Accessibility needs..."
                                rows="4"
                                className="w-full px-5 py-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-slate-900 placeholder-slate-400 resize-none"
                            />
                            <div className="text-right text-xs text-slate-400 mt-1">
                                {formData.interests?.length || 0}/1000
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isGenerating}
                            className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white py-5 rounded-xl font-semibold text-lg shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    Curating Your Exclusive Itinerary...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-6 h-6" />
                                    Generate AI Itinerary
                                </>
                            )}
                        </button>
                        <p className="text-center text-xs text-slate-500 mt-3">
                            *AI suggestions are generated instantly and refined by our travel experts.
                        </p>
                    </form>
                </motion.div>

                {/* Generated Itinerary Display */}
                <AnimatePresence>
                    {generatedItinerary && (
                        <motion.div
                            id="itinerary-results"
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 40 }}
                            className="space-y-12"
                        >
                            {/* Itinerary Header */}
                            <div className="text-center">
                                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                                    Your {generatedItinerary.days}-Day Journey to {generatedItinerary.destination}
                                </h2>
                                <p className="text-slate-600 max-w-2xl mx-auto mb-6">
                                    Curated for {generatedItinerary.travelers} travelers • {formData.budget} style
                                </p>

                                {/* Save & Share Actions */}
                                <div className="flex justify-center gap-4 mb-8">
                                    <button
                                        onClick={saveTrip}
                                        disabled={isSaving}
                                        className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all text-slate-700 font-medium"
                                    >
                                        {isSaving ? (
                                            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                        ) : (
                                            <Heart className="w-5 h-5 text-pink-500" />
                                        )}
                                        {isSaving ? 'Saving...' : (savedTripId ? 'Saved' : 'Save Trip')}
                                    </button>
                                    <button
                                        onClick={async () => {
                                            let linkToShare = window.location.href;

                                            // If we have a saved trip ID, generate specific link
                                            if (savedTripId) {
                                                linkToShare = `${window.location.origin}/trip/${savedTripId}`;
                                            } else if (user) {
                                                // Try to save first if not saved yet
                                                const newId = await saveTrip(generatedItinerary, true);
                                                if (newId) {
                                                    linkToShare = `${window.location.origin}/trip/${newId}`;
                                                }
                                            }

                                            navigator.clipboard.writeText(linkToShare);
                                            alert("Trip link copied to clipboard!");
                                        }}
                                        className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all text-slate-700 font-medium"
                                    >
                                        <Sparkles className="w-5 h-5 text-purple-500" />
                                        Share
                                    </button>
                                    <button
                                        onClick={handleEmailTrip}
                                        disabled={isEmailing}
                                        className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all text-slate-700 font-medium"
                                    >
                                        {isEmailing ? (
                                            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                        ) : (
                                            <Mail className="w-5 h-5 text-blue-500" />
                                        )}
                                        {isEmailing ? 'Sending...' : 'Email Plan'}
                                    </button>
                                </div>
                            </div>

                            {/* Day by Day Plan */}
                            <div className="grid gap-8">
                                {generatedItinerary.dayPlans?.map((day, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden border border-white/50"
                                    >
                                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white flex justify-between items-center">
                                            <h3 className="text-xl font-bold">Day {day.day}</h3>
                                            <span className="text-white/90 font-medium">{day.title}</span>
                                        </div>
                                        <div className="p-6 space-y-6">
                                            {day.activities.map((activity, actIndex) => (
                                                <div key={actIndex} className="flex gap-4 group hover:bg-slate-50 p-3 rounded-xl transition-colors">
                                                    <div className="w-16 flex-shrink-0 text-center">
                                                        <span className="block text-sm font-bold text-slate-900">{activity.time}</span>
                                                        <span className="text-xs text-slate-500 uppercase">{activity.period}</span>
                                                    </div>
                                                    <div className="flex-grow border-l-2 border-slate-100 pl-4">
                                                        <h4 className="font-bold text-slate-900 text-lg mb-1 group-hover:text-blue-600 transition-colors">
                                                            {activity.title}
                                                        </h4>
                                                        <p className="text-slate-600 text-sm leading-relaxed">
                                                            {activity.description}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 font-medium">
                                                            <Clock className="w-3 h-3" />
                                                            {activity.duration}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Budget Breakdown */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl p-6 md:p-8 border border-white/50"
                            >
                                <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                    <TrendingUp className="w-7 h-7 text-green-600" />
                                    Estimated Budget Breakdown
                                </h3>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                                            <span className="text-slate-700 font-medium">Accommodation</span>
                                            <span className="text-slate-900 font-bold">${generatedItinerary.costBreakdown?.categories?.accommodation || 0}/day</span>
                                        </div>
                                        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                                            <span className="text-slate-700 font-medium">Food & Dining</span>
                                            <span className="text-slate-900 font-bold">${generatedItinerary.costBreakdown?.categories?.food || 0}/day</span>
                                        </div>
                                        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-pink-50 to-blue-50 rounded-xl">
                                            <span className="text-slate-700 font-medium">Activities</span>
                                            <span className="text-slate-900 font-bold">${generatedItinerary.costBreakdown?.categories?.activities || 0}/day</span>
                                        </div>
                                        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl">
                                            <span className="text-slate-700 font-medium">Transportation</span>
                                            <span className="text-slate-900 font-bold">${generatedItinerary.costBreakdown?.categories?.transport || 0}/day</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
                                            <div className="text-sm opacity-90 mb-2">Daily Cost per Person</div>
                                            <div className="text-4xl font-bold mb-4">${generatedItinerary.costBreakdown?.daily || 0}</div>
                                            <div className="border-t border-white/30 pt-4">
                                                <div className="text-sm opacity-90 mb-1">Total per Person</div>
                                                <div className="text-2xl font-bold">${generatedItinerary.costBreakdown?.perPerson?.toLocaleString() || 0}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
};

export default TripPlanner;
