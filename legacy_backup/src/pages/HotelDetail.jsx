import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowLeft, MapPin, Star, Wifi, Utensils, Car, TreePine, Accessibility, ShieldCheck, ChevronRight, Info, Plus } from 'lucide-react';
import { calculateDynamicPrice } from '../utils/pricingEngine';
import RecommendationEngine from '../components/common/RecommendationEngine';
import SEO from '../components/SEO';

const HotelDetail = () => {
    const { id } = useParams();
    const [hotel, setHotel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeSection, setActiveSection] = useState('overview');
    const [isScrolled, setIsScrolled] = useState(false);

    // Fetch data
    useEffect(() => {
        const fetchHotel = async () => {
            try {
                const docRef = doc(db, 'hotels', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setHotel({ id: docSnap.id, ...docSnap.data() });
                } else {
                    setError("Hotel not found");
                }
            } catch (err) {
                console.error(err);
                setError("Failed to load hotel details");
            } finally {
                setLoading(false);
            }
        };
        fetchHotel();
    }, [id]);

    // Scroll Listener
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 400);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            const offset = 140;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;
            window.scrollTo({ top: offsetPosition, behavior: "smooth" });
            setActiveSection(sectionId);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    if (error || !hotel) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white">
            <h1 className="text-2xl font-bold mb-4">Hotel Not Available</h1>
            <p className="text-slate-400 mb-6">{error || "We couldn't find the property you're looking for."}</p>
            <Link to="/hotels" className="px-6 py-2 bg-blue-600 rounded-full font-bold">Browse Hotels</Link>
        </div>
    );

    // Derived Data for UI
    const heroImages = hotel.images && hotel.images.length > 0 ? hotel.images : [hotel.image];
    const rating = hotel.rating || 4.5;

    return (
        <div className="min-h-screen bg-[#f5f5f5] dark:bg-[#0a0a0a] text-zinc-900 dark:text-white pb-20 font-sans">
            <SEO
                title={`${hotel.name} | Infinite Yatra`}
                description={`Book your stay at ${hotel.name} in ${hotel.location}. Best rates guaranteed.`}
                image={hotel.image}
            />

            {/* Sticky Search Header */}
            <div className="bg-[#0a0a0a] border-b border-white/10 py-4 sticky top-0 z-50 transition-all duration-300">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="flex justify-between items-center">
                        <Link to="/hotels" className="text-white hover:text-blue-400 font-bold text-xl tracking-tight">
                            Infinite<span className="text-blue-500">Stays</span>
                        </Link>
                        {isScrolled && (
                            <div className="hidden md:flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
                                <span className="text-white font-bold">{hotel.name}</span>
                                <Link to={`/hotels/book/${hotel.id}`} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-bold">
                                    Book Now
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Breadcrumb & Header */}
            <div className="container mx-auto px-4 max-w-7xl py-6">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                    <Link to="/hotels" className="hover:text-blue-500">All Hotels</Link>
                    <ChevronRight size={14} />
                    <span>{hotel.location?.split(',')[0]}</span>
                    <ChevronRight size={14} />
                    <span className="text-zinc-900 dark:text-white font-medium line-clamp-1">{hotel.name}</span>
                </div>

                <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6 gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-zinc-900 dark:text-white">{hotel.name}</h1>
                        <div className="flex items-center gap-2 text-sm">
                            <div className="flex items-center text-yellow-500">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} size={16} fill={i < Math.floor(rating) ? "currentColor" : "none"} className={i >= Math.floor(rating) ? "text-zinc-600" : ""} />
                                ))}
                            </div>
                            <span className="text-zinc-400 mx-2">•</span>
                            <span className="bg-white/10 px-2 py-0.5 rounded text-xs border border-white/10">{hotel.category}</span>
                            <span className="text-zinc-400 mx-2">•</span>
                            <span className="flex items-center gap-1 text-slate-400"><MapPin size={14} /> {hotel.address || hotel.location}</span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button className="btn-icon-label"><Share2 size={16} /> Share</button>
                        <button className="btn-icon-label text-red-500"><Heart size={16} /> Save</button>
                    </div>
                </div>

                {/* IMAGE GRID */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[400px] md:h-[500px] rounded-2xl overflow-hidden mb-8 shadow-2xl shadow-black/50">
                    {/* Main Image */}
                    <div className="md:col-span-2 h-full relative group cursor-pointer">
                        <img src={heroImages[0]} alt="Main" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    </div>
                    {/* Dynamic Grid for remaining images */}
                    <div className="hidden md:grid grid-rows-2 col-span-2 gap-2 h-full">
                        <div className="grid grid-cols-2 gap-2 h-full">
                            {heroImages[1] && <img src={heroImages[1]} className="w-full h-full object-cover" />}
                            {heroImages[2] && <img src={heroImages[2]} className="w-full h-full object-cover" />}
                        </div>
                        <div className="grid grid-cols-2 gap-2 h-full relative">
                            {heroImages[3] && <img src={heroImages[3]} className="w-full h-full object-cover" />}
                            {heroImages[4] && (
                                <div className="relative w-full h-full cursor-pointer group">
                                    <img src={heroImages[4]} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                                        <span className="font-bold text-white text-sm border border-white/30 px-3 py-1 rounded backdrop-blur-sm">See all photos</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* STICKY NAV */}
            <div className={`sticky top-[73px] z-40 bg-white dark:bg-[#0a0a0a] border-b border-zinc-200 dark:border-white/10 mb-8 transition-shadow ${isScrolled ? 'shadow-md' : ''}`}>
                <div className="container mx-auto px-4 max-w-7xl flex gap-8 overflow-x-auto no-scrollbar">
                    {['Overview', 'Rooms', 'Amenities', 'Policies', 'FAQs'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => scrollToSection(tab.toLowerCase())}
                            className={`py-4 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${activeSection === tab.toLowerCase() ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-white'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* CONTENT GRID */}
            <div className="container mx-auto px-4 max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-12">

                    {/* OVERVIEW */}
                    <section id="overview" className="scroll-mt-32">
                        <h2 className="section-title">About this property</h2>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {hotel.hotelType?.map(tag => (
                                <span key={tag} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-slate-300">{tag}</span>
                            ))}
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed whitespace-pre-line">
                            {hotel.description || "Experience luxury and comfort."}
                        </p>

                        {/* Highlights */}
                        {hotel.highlights?.length > 0 && (
                            <div className="mb-8 p-6 bg-white/5 rounded-2xl border border-white/10">
                                <h4 className="font-bold text-sm uppercase text-slate-500 mb-4 tracking-wider">Property Highlights</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {hotel.highlights.map((highlight, idx) => (
                                        <div key={idx} className="flex gap-3 items-start">
                                            <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                                            <p className="font-medium text-sm text-zinc-900 dark:text-white">{highlight}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>

                    {/* ROOMS */}
                    <section id="rooms" className="scroll-mt-32 pt-8 border-t border-white/10">
                        <h2 className="section-title mb-6">Choose your room</h2>
                        <div className="space-y-6">
                            {hotel.rooms && hotel.rooms.length > 0 ? hotel.rooms.map((room) => (
                                <div key={room.id} className="bg-white dark:bg-[#111] rounded-2xl border border-zinc-200 dark:border-white/10 overflow-hidden hover:border-blue-500/50 transition-all group">
                                    <div className="flex flex-col md:flex-row">
                                        <div className="md:w-72 h-64 md:h-auto relative bg-zinc-800">
                                            <img src={(room.images && room.images[0]) || hotel.image} alt={room.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 p-6 flex flex-col justify-between">
                                            <div>
                                                <h3 className="text-xl font-bold text-white mb-2">{room.name}</h3>
                                                <div className="flex gap-4 text-xs text-slate-400 mb-4">
                                                    <span className="flex items-center gap-1"><Users size={14} /> Max {room.occupancy} Guests</span>
                                                    <span className="flex items-center gap-1"><Bed size={14} /> {room.count} Available</span>
                                                </div>
                                                <p className="text-sm text-slate-400 mb-4 line-clamp-2">{room.description}</p>
                                            </div>
                                            <div className="flex items-end justify-between pt-4 border-t border-white/5">
                                                <div>
                                                    <p className="text-2xl font-bold text-white">₹{parseInt(room.price).toLocaleString()}</p>
                                                    <p className="text-xs text-slate-500">+ Taxes & Fees</p>
                                                </div>
                                                <Link to={`/hotels/book/${hotel.id}?room=${room.id}`} className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-slate-200 transition-colors">
                                                    Select Room
                                                </Link>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cost Price Debug (Admin Only - simplified logic for now) */}
                                    {/* <div className="p-2 bg-red-900/20 text-red-400 text-xs">Margin: {Math.round(((room.price - room.costPrice)/room.price)*100)}%</div> */}
                                </div>
                            )) : (
                                <div className="p-8 text-center text-slate-500 border border-dashed border-white/10 rounded-2xl">
                                    No rooms configured for this property yet.
                                </div>
                            )}
                        </div>
                    </section>

                    {/* AMENITIES */}
                    <section id="amenities" className="scroll-mt-32 pt-8 border-t border-white/10">
                        <h2 className="section-title mb-6">Amenities & Services</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="font-bold text-green-400 flex items-center gap-2"><CheckCircle2 size={18} /> Inclusions</h3>
                                <ul className="space-y-2">
                                    {hotel.inclusions && hotel.inclusions.length > 0 ? hotel.inclusions.map((item, i) => (
                                        <li key={i} className="flex gap-3 text-sm text-slate-300">
                                            <Check size={16} className="text-green-500/50 mt-0.5 shrink-0" /> {item}
                                        </li>
                                    )) : <li className="text-slate-500 text-sm">No specific inclusions listed.</li>}
                                </ul>
                            </div>
                            <div className="space-y-4">
                                <h3 className="font-bold text-red-400 flex items-center gap-2"><XCircle size={18} /> Exclusions (Extra Charges)</h3>
                                <ul className="space-y-2">
                                    {hotel.exclusions && hotel.exclusions.length > 0 ? hotel.exclusions.map((item, i) => (
                                        <li key={i} className="flex gap-3 text-sm text-slate-300">
                                            <span className="w-4 h-[1px] bg-red-500/50 mt-2.5 shrink-0" /> {item}
                                        </li>
                                    )) : <li className="text-slate-500 text-sm">No specific exclusions listed.</li>}
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* POLICIES */}
                    <section id="policies" className="scroll-mt-32 pt-8 border-t border-white/10">
                        <h2 className="section-title mb-6">House Rules & Policies</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <PolicyCard title="Good to Know" icon={<Info size={18} className="text-blue-400" />} items={hotel.goodToKnow} />
                            <PolicyCard title="Who is this for?" icon={<Users size={18} className="text-purple-400" />} items={hotel.whoIsThisFor} />
                            <PolicyCard title="Things to Carry" icon={<Briefcase size={18} className="text-orange-400" />} items={hotel.thingsToCarry} />

                            {/* Specific Policies */}
                            {hotel.policies && (
                                <div className="md:col-span-2 bg-white/5 rounded-xl p-6 border border-white/10 space-y-4">
                                    {hotel.policies.cancellation && (
                                        <div><h4 className="font-bold text-sm text-slate-400 uppercase mb-1">Cancellation</h4><p className="text-sm text-slate-300">{hotel.policies.cancellation}</p></div>
                                    )}
                                    {hotel.policies.child && (
                                        <div><h4 className="font-bold text-sm text-slate-400 uppercase mb-1">Child Policy</h4><p className="text-sm text-slate-300">{hotel.policies.child}</p></div>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* FAQS */}
                    <section id="faqs" className="scroll-mt-32 pt-8 border-t border-white/10">
                        <h2 className="section-title mb-6">Frequently Asked Questions</h2>
                        <div className="space-y-4">
                            {hotel.faqs && hotel.faqs.length > 0 ? hotel.faqs.map((faq, i) => (
                                <details key={i} className="group border-b border-white/10 pb-4 cursor-pointer">
                                    <summary className="flex justify-between items-center font-bold text-white list-none">
                                        {faq.question}
                                        <span className="transition-transform group-open:rotate-180 text-blue-500"><ChevronDown size={20} /></span>
                                    </summary>
                                    <p className="mt-3 text-sm text-slate-400 leading-relaxed">{faq.answer}</p>
                                </details>
                            )) : <p className="text-slate-500">No FAQs available.</p>}
                        </div>
                    </section>

                </div>

                {/* RIGHT SIDEBAR - Sticky Booking Widget */}
                <div className="hidden lg:block relative">
                    <div className="sticky top-28 bg-[#111] border border-white/10 rounded-2xl p-6 shadow-xl">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-xs text-slate-400">Starting from</p>
                                <p className="text-3xl font-bold text-white">₹{parseInt(hotel.price).toLocaleString()}</p>
                                <p className="text-xs text-slate-500">per night</p>
                            </div>
                            <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-bold">
                                {hotel.rating} / 5 Rating
                            </div>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-sm flex justify-between">
                                <span className="text-slate-400">Check-in</span>
                                <span className="font-bold text-white">2:00 PM</span>
                            </div>
                            <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-sm flex justify-between">
                                <span className="text-slate-400">Check-out</span>
                                <span className="font-bold text-white">11:00 AM</span>
                            </div>
                        </div>

                        <button onClick={() => scrollToSection('rooms')} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20">
                            Select Room
                        </button>

                        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                            <ShieldCheck size={12} /> Secure Booking • Instant Confirmation
                        </div>
                    </div>
                </div>

            </div>

            {/* RECOMMENDATIONS */}
            {hotel && (
                <RecommendationEngine
                    currentId={hotel.id}
                    type="hotel"
                    location={hotel.location}
                    budget={Number(hotel.price)}
                    tags={hotel.highlights}
                />
            )}
        </div>
    );
};

const PolicyCard = ({ title, items, icon }) => {
    if (!items || items.length === 0) return null;
    return (
        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
            <div className="flex items-center gap-2 mb-4 font-bold text-white">
                {icon} <h3>{title}</h3>
            </div>
            <ul className="space-y-2">
                {items.map((item, i) => (
                    <li key={i} className="text-sm text-slate-400 flex gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600 mt-1.5 shrink-0" />
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );
}

// Icon Helper
const Briefcase = ({ size, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="14" x="2" y="7" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
);

const btnIconLabelStyle = "flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-colors text-sm font-medium text-slate-300";

export default HotelDetail;
