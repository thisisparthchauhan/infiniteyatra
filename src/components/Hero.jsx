import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Users, Phone, Send, CheckCircle, Loader, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';
import BackgroundSlider from './BackgroundSlider';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const popularDestinations = [
    "Agra, India", "Ahmedabad, India", "Amritsar, India", "Andaman & Nicobar", "Alleppey, Kerala",
    "Bangalore, India", "Bangkok, Thailand", "Bali, Indonesia",
    "Chennai, India", "Coorg, Karnataka",
    "Darjeeling, West Bengal", "Dehradun, Uttarakhand", "Delhi, India", "Dubai, UAE",
    "Gangtok, Sikkim", "Goa, India", "Gulmarg, Kashmir",
    "Haridwar, Uttarakhand", "Hyderabad, India",
    "Jaipur, Rajasthan", "Jaisalmer, Rajasthan", "Jodhpur, Rajasthan",
    "Kochi, Kerala", "Kolkata, West Bengal", "Kullu Manali, Himachal",
    "Ladakh, India", "Las Vegas, USA", "London, UK", "Lonavala, Maharashtra",
    "Mumbai, Maharashtra", "Munnar, Kerala", "Mussoorie, Uttarakhand", "Mukteshwar, Uttarakhand",
    "Nainital, Uttarakhand", "New York, USA",
    "Ooty, Tamil Nadu",
    "Paris, France", "Phuket, Thailand", "Pondicherry, India", "Pune, Maharashtra",
    "Rishikesh, Uttarakhand", "Rome, Italy",
    "Shimla, Himachal", "Singapore", "Srinagar, Kashmir", "Surat, Gujarat",
    "Tokyo, Japan",
    "Udaipur, Rajasthan",
    "Varanasi, Uttar Pradesh",
    "Wayanad, Kerala"
];

const Hero = () => {
    const [formData, setFormData] = useState({
        location: '',
        days: '',
        persons: '',
        phone: ''
    });
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { addToast } = useToast();

    const words = ["Journey", "Adventure", "Escape", "Experience", "Odyssey"];
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prevIndex) => (prevIndex + 1) % words.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        if (name === 'location') {
            if (value.length > 0) {
                const filtered = popularDestinations.filter(city =>
                    city.toLowerCase().includes(value.toLowerCase())
                );
                setSuggestions(filtered);
                setShowSuggestions(true);
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }
    };

    const handleSuggestionClick = (city) => {
        setFormData({ ...formData, location: city });
        setShowSuggestions(false);
    };

    const handlePhoneChange = (value) => {
        setFormData({ ...formData, phone: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic Validation
        if (!formData.location || !formData.phone) {
            addToast("Location and Phone number are required", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, "enquiries"), {
                ...formData,
                days: Number(formData.days) || 0,
                persons: Number(formData.persons) || 0,
                status: 'new', // For admin to track
                createdAt: serverTimestamp(),
                source: 'homepage_hero'
            });

            setIsSubmitted(true);
            addToast("Enquiry sent successfully!", "success");

            // Reset form after 5 seconds to allow sending another
            setTimeout(() => {
                setIsSubmitted(false);
                setFormData({ location: '', days: '', persons: '', phone: '' });
            }, 5000);

        } catch (error) {
            console.error("Error submitting enquiry:", error);
            addToast("Failed to send enquiry. Please try again.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
            {/* Background Slider - keeping it but overlay will be cleaner */}
            <BackgroundSlider />

            {/* Premium Vignette Overlay (No heavy gradients) */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)] z-[1] pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 container mx-auto px-4 text-center text-white flex flex-col items-center">

                {/* Glass Badge */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="glass-card px-6 py-2 rounded-full mb-8 flex items-center gap-2 inline-flex"
                    style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}
                >
                    <span className="text-sm font-medium tracking-wider uppercase text-white/90">Follow Your</span>
                    <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#ff4d4d" stroke="none" className="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
                    </motion.div>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                    className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 drop-shadow-2xl"
                >
                    Discover Your Next <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300 inline-block min-w-[280px]">
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={words[index]}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.5 }}
                                className="inline-block"
                            >
                                {words[index]}
                            </motion.span>
                        </AnimatePresence>
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="text-xl md:text-2xl text-white/80 font-normal mb-12 max-w-2xl mx-auto tracking-wide"
                >
                    Explore the world with Infinite Yatra.
                </motion.p>

                {/* Glass Enquiry Form */}
                <div className="w-full max-w-7xl mx-auto">
                    <AnimatePresence mode="wait">
                        {isSubmitted ? (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="glass-card p-8 flex flex-col items-center justify-center text-white"
                            >
                                <CheckCircle size={48} className="mb-4 text-green-400" />
                                <h3 className="text-2xl font-bold mb-2">Thank you!</h3>
                                <p className="text-lg text-white/80">We'll be in touch shortly.</p>
                            </motion.div>
                        ) : (
                            <motion.form
                                id="enquiry-form"
                                key="form"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.8 }}
                                onSubmit={handleSubmit}
                                className="glass-card-dark p-2 rounded-[2rem] flex flex-col lg:flex-row items-center gap-2"
                            >
                                {/* Location - Wider */}
                                <div className="flex-[2] flex items-center gap-3 px-6 py-4 w-full border-b lg:border-b-0 lg:border-r border-white/10">
                                    <MapPin className="text-blue-400 shrink-0" size={20} />
                                    <div className="text-left w-full">
                                        <label htmlFor="location" className="block text-[10px] text-white/70 font-bold uppercase tracking-wider mb-1">Location</label>
                                        <div className="relative">
                                            <input
                                                id="location"
                                                name="location"
                                                type="text"
                                                value={formData.location}
                                                onChange={handleChange}
                                                onFocus={() => { if (formData.location) setShowSuggestions(true); }}
                                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay to allow click
                                                placeholder="Where to?"
                                                required
                                                autoComplete="off"
                                                className="w-full outline-none text-white placeholder:text-white/70 font-medium text-lg bg-transparent"
                                            />
                                            {/* Autocomplete Dropdown */}
                                            <AnimatePresence>
                                                {showSuggestions && suggestions.length > 0 && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="absolute top-full left-0 w-full mt-4 bg-[#0f1115] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                                                    >
                                                        {/* Header */}
                                                        <div className="px-5 py-3 border-b border-white/5 bg-white/5">
                                                            <h4 className="text-sm font-bold text-white/50 uppercase tracking-wider">Destinations</h4>
                                                        </div>

                                                        {/* List */}
                                                        <div className="max-h-60 overflow-y-auto scroller p-2">
                                                            {suggestions.map((city, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className="px-4 py-3 rounded-xl hover:bg-white/10 cursor-pointer flex items-center gap-4 transition-all duration-200 group"
                                                                    onClick={() => handleSuggestionClick(city)}
                                                                >
                                                                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/20 transition-colors">
                                                                        <img
                                                                            src={`https://source.unsplash.com/100x100/?${city.split(',')[0]},travel`}
                                                                            alt={city}
                                                                            className="w-full h-full object-cover rounded-lg opacity-0"
                                                                            onError={(e) => {
                                                                                e.target.style.display = 'none';
                                                                                e.target.nextSibling.style.display = 'block';
                                                                            }}
                                                                            onLoad={(e) => e.target.classList.remove('opacity-0')}
                                                                        />
                                                                        <MapPin size={18} className="text-blue-400 absolute" style={{ display: 'none' }} />
                                                                        {/* Fallback to icon initially or on error. Actually unsplash source might be flaky, let's stick to icon for reliability and speed as requested "show amravati... " */}
                                                                    </div>

                                                                    {/* Simple Icon version per user request style */}
                                                                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                                                                        <img
                                                                            src="https://cdn-icons-png.flaticon.com/512/201/201623.png"
                                                                            alt="map"
                                                                            className="w-6 h-6 opacity-80"
                                                                        />
                                                                    </div>

                                                                    <div className="flex-1 text-left">
                                                                        <p className="text-base font-semibold text-white group-hover:text-blue-300 transition-colors">{city.split(',')[0]}</p>
                                                                        <p className="text-xs text-white/40 group-hover:text-white/60 transition-colors">{city.split(',')[1] || 'India'}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                </div>

                                {/* Days - Compact */}
                                <div className="flex-[0.7] flex items-center gap-3 px-6 py-4 w-full border-b lg:border-b-0 lg:border-r border-white/10">
                                    <Calendar className="text-blue-400 shrink-0" size={20} />
                                    <div className="text-left w-full">
                                        <label htmlFor="days" className="block text-[10px] text-white/70 font-bold uppercase tracking-wider mb-1">Duration</label>
                                        <input
                                            id="days"
                                            name="days"
                                            type="number"
                                            min="1"
                                            value={formData.days}
                                            onChange={handleChange}
                                            placeholder="Days"
                                            className="w-full outline-none text-white placeholder:text-white/70 font-medium text-lg bg-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Travelers - Compact */}
                                <div className="flex-[0.7] flex items-center gap-3 px-6 py-4 w-full border-b lg:border-b-0 lg:border-r border-white/10">
                                    <Users className="text-blue-400 shrink-0" size={20} />
                                    <div className="text-left w-full">
                                        <label htmlFor="persons" className="block text-[10px] text-white/70 font-bold uppercase tracking-wider mb-1">Travelers</label>
                                        <input
                                            id="persons"
                                            name="persons"
                                            type="number"
                                            min="1"
                                            value={formData.persons}
                                            onChange={handleChange}
                                            placeholder="Guests"
                                            className="w-full outline-none text-white placeholder:text-white/70 font-medium text-lg bg-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Phone - Wider */}
                                <div className="flex-[1.8] flex items-center gap-3 px-6 py-4 w-full">
                                    <Phone className="text-blue-400 shrink-0" size={20} />
                                    <div className="text-left w-full">
                                        <label htmlFor="phone" className="block text-[10px] text-white/70 font-bold uppercase tracking-wider mb-1">Phone</label>
                                        <div className="phone-input-dark w-full">
                                            <PhoneInput
                                                country={'in'}
                                                value={formData.phone}
                                                onChange={handlePhoneChange}
                                                enableSearch={true}
                                                disableSearchIcon={false}
                                                searchPlaceholder="Search country"
                                                inputStyle={{
                                                    width: '100%',
                                                    height: '100%',
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: 'white',
                                                    fontSize: '1.125rem', // text-lg
                                                    fontWeight: 500,
                                                    paddingLeft: '48px'
                                                }}
                                                buttonStyle={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    paddingLeft: '0px'
                                                }}
                                                dropdownStyle={{
                                                    background: '#1e293b',
                                                    color: 'white',
                                                    border: '1px solid rgba(255,255,255,0.1)'
                                                }}
                                                containerStyle={{
                                                    width: '100%',
                                                    height: '100%'
                                                }}
                                                placeholder="Number"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="p-1 w-full lg:w-auto">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="bg-white text-black hover:bg-white/90 px-8 py-5 rounded-[1.7rem] w-full lg:w-auto transition-all duration-300 font-bold text-lg shadow-lg flex items-center justify-center gap-2 min-w-[160px]"
                                    >
                                        {isSubmitting ? (
                                            <Loader size={20} className="animate-spin" />
                                        ) : (
                                            <>
                                                <span>Plan Trip</span>
                                                <Send size={18} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Scroll Cue */}
            <motion.div
                className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 opacity-50 hover:opacity-100 transition-opacity"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                onClick={() => {
                    const destinations = document.getElementById('destinations');
                    if (destinations) destinations.scrollIntoView({ behavior: 'smooth' });
                }}
            >
                <ArrowDown size={32} className="text-white animate-bounce" />
            </motion.div>
        </div>
    );
};

export default Hero;
