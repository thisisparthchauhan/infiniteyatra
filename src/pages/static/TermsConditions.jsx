import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Shield, AlertTriangle, CreditCard, Clock, Ban, Gift, Users, Camera, MapPin, Briefcase, Globe, ChevronDown } from 'lucide-react';

const Section = ({ number, title, children, isOpen, onToggle }) => {
    return (
        <motion.div
            initial={false}
            className={`border rounded-2xl overflow-hidden backdrop-blur-sm transition-all duration-300 ${isOpen ? 'bg-white/10 border-blue-500/30' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'}`}
        >
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-6 text-left group"
            >
                <div className="flex items-center gap-4">
                    <span className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold border transition-colors ${isOpen ? 'bg-blue-500 text-white border-blue-400' : 'bg-white/5 text-slate-400 border-white/10 group-hover:bg-white/10 group-hover:text-white'}`}>
                        {number}
                    </span>
                    <h2 className={`text-lg md:text-xl font-bold transition-colors ${isOpen ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                        {title}
                    </h2>
                </div>
                <div className={`p-2 rounded-full transition-all duration-300 ${isOpen ? 'bg-blue-500/20 text-blue-400 rotate-180' : 'bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-white'}`}>
                    <ChevronDown size={20} />
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                        <div className="p-6 pt-0 text-slate-300 border-t border-white/5">
                            <div className="pt-4 space-y-4">
                                {children}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const TermsConditions = () => {
    // Only keeping the first section open by default for a cleaner look
    const [openSections, setOpenSections] = useState([1]);

    const toggleSection = (id) => {
        setOpenSections(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const expandAll = () => setOpenSections(Array.from({ length: 15 }, (_, i) => i + 1));
    const collapseAll = () => setOpenSections([]);

    return (
        <div className="min-h-screen bg-black pt-20 pb-20">
            {/* Background Atmosphere */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[128px]"></div>
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[128px]"></div>
            </div>

            {/* Hero Section */}
            <div className="relative pt-20 pb-16 overflow-hidden z-10">
                <div className="relative container mx-auto px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-white/10 backdrop-blur-xl shadow-2xl shadow-blue-500/10">
                            <FileText size={40} className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">Terms & Conditions</h1>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto font-light">
                            Infinite Yatra – Explore Infinite
                        </p>
                        <div className="mt-8 flex items-center justify-center gap-4">
                            <span className="text-sm font-medium text-slate-400 px-4 py-2 bg-white/5 rounded-full border border-white/10 flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                Last Updated: January 2026
                            </span>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 relative z-10 pb-12">
                {/* Intro Alert */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl text-blue-100 mb-12 backdrop-blur-md"
                >
                    <p className="font-medium text-center md:text-lg leading-relaxed">
                        By accessing, browsing, or booking any travel service through Infinite Yatra, you acknowledge that you have read, understood, and agreed to be bound by the following Terms & Conditions.
                    </p>
                </motion.div>

                {/* Controls */}
                <div className="flex justify-end gap-4 mb-6 text-sm">
                    <button onClick={expandAll} className="text-slate-400 hover:text-white transition-colors">Expand All</button>
                    <span className="text-slate-700">|</span>
                    <button onClick={collapseAll} className="text-slate-400 hover:text-white transition-colors">Collapse All</button>
                </div>

                {/* Sections */}
                <div className="space-y-4">
                    {/* Section 1 */}
                    <Section number="1" title="Company Information" isOpen={openSections.includes(1)} onToggle={() => toggleSection(1)}>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-black/40 p-5 rounded-xl border border-white/5">
                                <p className="text-slate-500 text-xs uppercase tracking-wider mb-1 font-bold">Brand Name</p>
                                <p className="text-white font-medium text-lg">Infinite Yatra</p>
                            </div>
                            <div className="bg-black/40 p-5 rounded-xl border border-white/5">
                                <p className="text-slate-500 text-xs uppercase tracking-wider mb-1 font-bold">Established</p>
                                <p className="text-white font-medium text-lg">2024</p>
                            </div>
                            <div className="bg-black/40 p-5 rounded-xl border border-white/5 md:col-span-2">
                                <p className="text-slate-500 text-xs uppercase tracking-wider mb-1 font-bold">Nature of Business</p>
                                <p className="text-white font-medium text-lg">Travel, Trekking & Worldwide Travel Services</p>
                            </div>
                        </div>
                        <p className="leading-relaxed text-slate-300 bg-white/5 p-4 rounded-xl border border-white/5">
                            Infinite Yatra provides curated travel experiences including trekking adventures, spiritual and cultural journeys, fixed group departures, and customized domestic & international tours.
                        </p>
                    </Section>

                    {/* Section 2 */}
                    <Section number="2" title="Acceptance of Terms" isOpen={openSections.includes(2)} onToggle={() => toggleSection(2)}>
                        <ul className="space-y-3 list-disc pl-5 marker:text-blue-500">
                            <li>By booking any service through our website or official communication channels, the customer agrees to these Terms & Conditions.</li>
                            <li>These terms apply to all services including treks, tours, and customized itineraries.</li>
                            <li>Infinite Yatra reserves the right to amend or update these Terms & Conditions at any time without prior notice.</li>
                        </ul>
                    </Section>

                    {/* Section 3 */}
                    <Section number="3" title="Booking & Confirmation Policy" isOpen={openSections.includes(3)} onToggle={() => toggleSection(3)}>
                        <ul className="space-y-3 list-disc pl-5 marker:text-blue-500">
                            <li>A booking is confirmed only after successful receipt of payment (partial or full, as specified).</li>
                            <li>
                                Booking confirmation is shared via:
                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="p-3 bg-white/5 rounded-lg text-center text-sm border border-white/5">Website</div>
                                    <div className="p-3 bg-white/5 rounded-lg text-center text-sm border border-white/5">WhatsApp</div>
                                    <div className="p-3 bg-white/5 rounded-lg text-center text-sm border border-white/5">Email</div>
                                </div>
                            </li>
                            <li>A unique Booking ID is generated for each confirmed booking and must be referenced in all communications.</li>
                        </ul>
                    </Section>

                    {/* Section 4 */}
                    <Section number="4" title="Payment Policy" isOpen={openSections.includes(4)} onToggle={() => toggleSection(4)}>
                        <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-6 rounded-xl border border-blue-500/20 mb-6">
                            <div className="flex items-center gap-3 mb-4 text-blue-300 font-semibold">
                                <CreditCard size={20} /> Accepted Payment Modes
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {['UPI', 'Debit / Credit Cards', 'Net Banking'].map(mode => (
                                    <span key={mode} className="px-3 py-1 bg-blue-500/20 rounded-lg text-sm text-blue-200 border border-blue-500/20">{mode}</span>
                                ))}
                            </div>
                            <p className="mt-4 text-xs text-blue-400/80 uppercase tracking-widest font-medium">Processed securely through authorized gateways</p>
                        </div>
                        <ul className="space-y-3 list-disc pl-5 marker:text-blue-500">
                            <li>All prices are per person, unless stated otherwise.</li>
                            <li>Any bank or payment gateway charges are borne by the customer.</li>
                            <li>Partial payment (if allowed) confirms the seat; the remaining amount must be paid before departure as per package terms.</li>
                            <li className="text-red-400 font-medium bg-red-500/10 p-2 rounded-lg inline-block border border-red-500/20">Failure to pay the balance amount may result in cancellation without refund.</li>
                        </ul>
                    </Section>

                    {/* Section 5 */}
                    <Section number="5" title="Cancellation & Refund Policy" isOpen={openSections.includes(5)} onToggle={() => toggleSection(5)}>
                        <div className="bg-red-500/10 p-6 rounded-xl border border-red-500/20 mb-8 max-w-md">
                            <h3 className="font-bold text-red-400 mb-2 uppercase tracking-wide text-sm">Token Amount Policy</h3>
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-2xl font-bold text-white">₹1,000</span>
                                <span className="text-red-300 text-sm">per person</span>
                            </div>
                            <p className="text-red-300/80 text-sm">Non-Refundable and Non-Transferable under all circumstances.</p>
                        </div>

                        <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Clock size={18} className="text-blue-400" /> Refund Structure</h3>
                        <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40 mb-8">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white/10 text-white font-bold">
                                    <tr>
                                        <th className="p-4 border-b border-white/10">Cancellation Timeline</th>
                                        <th className="p-4 border-b border-white/10">Refund Applicable</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    <tr>
                                        <td className="p-4">More than 7 days before trip</td>
                                        <td className="p-4 text-emerald-400 font-bold">Full refund <span className="text-slate-500 font-normal text-xs ml-1">(minus token)</span></td>
                                    </tr>
                                    <tr>
                                        <td className="p-4">4–7 days before trip</td>
                                        <td className="p-4 text-orange-400 font-bold">50% refund only</td>
                                    </tr>
                                    <tr className="bg-red-500/5">
                                        <td className="p-4 font-medium text-red-200">Less than 72 hours / No Show</td>
                                        <td className="p-4 text-red-500 font-bold">No refund</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <ul className="space-y-2 list-disc pl-5 marker:text-slate-500 text-sm opacity-80">
                            <li>Refunds (if applicable) are processed within 7–10 working days.</li>
                            <li>Refunds are credited only to the original payment method.</li>
                            <li>No cash refunds under any circumstances.</li>
                            <li>Cancellation requests must be submitted in writing via official Infinite Yatra communication channels.</li>
                        </ul>
                    </Section>

                    {/* Section 6 */}
                    <Section number="6" title="Force Majeure / Uncontrollable Events" isOpen={openSections.includes(6)} onToggle={() => toggleSection(6)}>
                        <p className="mb-4 text-slate-300">Infinite Yatra shall not be liable for delays, modifications, or cancellations caused by:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                            {['Weather conditions', 'Natural disasters', 'Roadblocks or landslides', 'Government regulations', 'Political unrest'].map((item) => (
                                <div key={item} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
                                    <Shield size={16} className="text-slate-400" />
                                    <span className="text-slate-200">{item}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-sm italic text-slate-500">In such cases, alternative travel dates or trip credits may be offered. Cash refunds are not guaranteed.</p>
                    </Section>

                    {/* Section 7 */}
                    <Section number="7" title="Itinerary & Service Changes" isOpen={openSections.includes(7)} onToggle={() => toggleSection(7)}>
                        <div className="space-y-4">
                            <div className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                                <Globe size={24} className="text-blue-400 flex-shrink-0" />
                                <div>
                                    <p className="text-white font-medium mb-1">Modifications for Safety</p>
                                    <p className="text-sm text-slate-400">Itineraries may be altered due to safety, weather, or operational reasons. Changes are always made in the best interest of travelers.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                                <Ban size={24} className="text-orange-400 flex-shrink-0" />
                                <div>
                                    <p className="text-white font-medium mb-1">No Refunds for Adaptation</p>
                                    <p className="text-sm text-slate-400">No refunds will be issued for itinerary changes or skipped activities caused by external circumstances beyond our control.</p>
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* Section 8 */}
                    <Section number="8" title="Health, Medical & Eligibility" isOpen={openSections.includes(8)} onToggle={() => toggleSection(8)}>
                        <div className="bg-orange-500/10 p-6 rounded-xl border border-orange-500/20 mb-6">
                            <h3 className="font-bold text-orange-400 mb-3 flex items-center gap-2"><AlertTriangle size={18} /> Fitness & Responsibility</h3>
                            <p className="text-orange-200/80 leading-relaxed">Travelers are responsible for assessing their physical and mental fitness before booking. Infinite Yatra reserves the right to deny participation or remove a traveler mid-trip if found medically unfit, without refund.</p>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                <h4 className="text-white font-medium mb-2">Disclosure</h4>
                                <p className="text-sm text-slate-400">All medical conditions (asthma, heart issues, allergies, etc.) must be disclosed prior to booking.</p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                <h4 className="text-white font-medium mb-2">Age Limits</h4>
                                <p className="text-sm text-slate-400">Age restrictions apply, especially for high-altitude treks. Ensure eligibility before booking.</p>
                            </div>
                        </div>
                    </Section>

                    {/* Section 9 */}
                    <Section number="9" title="Behavior & Discipline" isOpen={openSections.includes(9)} onToggle={() => toggleSection(9)}>
                        <div className="p-6 bg-red-500/5 rounded-xl border border-red-500/10 text-center">
                            <Ban size={32} className="text-red-400 mx-auto mb-3" />
                            <h3 className="text-white font-bold mb-2">Zero Tolerance Policy</h3>
                            <p className="text-slate-300">Alcohol, drugs, and illegal substances are strictly prohibited. Misbehavior will result in immediate removal without refund.</p>
                        </div>
                    </Section>

                    {/* Section 10 */}
                    <Section number="10" title="Accommodation & Transport" isOpen={openSections.includes(10)} onToggle={() => toggleSection(10)}>
                        <ul className="space-y-3 list-disc pl-5 marker:text-blue-500">
                            <li>Accommodation and transport are provided as per the selected package and availability.</li>
                            <li>Room sharing and vehicle allocation are determined by packaged terms.</li>
                            <li>Delays due to terrain, weather, or operational issues are largely unavoidable in certain regions and do not qualify for refunds.</li>
                        </ul>
                    </Section>

                    {/* Section 11 */}
                    <Section number="11" title="Personal Belongings" isOpen={openSections.includes(11)} onToggle={() => toggleSection(11)}>
                        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                            <Briefcase className="text-slate-400" size={24} />
                            <p className="text-slate-300">Infinite Yatra is not responsible for loss, theft, or damage to personal belongings. Travelers are advised to take care of their valuables at all times.</p>
                        </div>
                    </Section>

                    {/* Section 12 */}
                    <Section number="12" title="Media Consent" isOpen={openSections.includes(12)} onToggle={() => toggleSection(12)}>
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                                <Camera size={24} />
                            </div>
                            <div>
                                <p className="text-slate-300 mb-2">Photos and videos taken during tours may be used for marketing, social media, and promotional purposes.</p>
                                <p className="text-xs text-slate-500 uppercase tracking-wide font-bold">Opt-Out Policy</p>
                                <p className="text-sm text-slate-400">Travelers wishing to opt out must inform Infinite Yatra in writing before the trip begins.</p>
                            </div>
                        </div>
                    </Section>

                    {/* Section 13 */}
                    <Section number="13" title="Third-Party Services" isOpen={openSections.includes(13)} onToggle={() => toggleSection(13)}>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                <Users className="text-slate-400 mb-2" size={20} />
                                <p className="text-sm text-slate-300">Infinite Yatra works with verified hotels, transport providers, guides, and vendors.</p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                <AlertTriangle className="text-slate-400 mb-2" size={20} />
                                <p className="text-sm text-slate-300">We are not responsible for acts, omissions, delays, or service failures caused specifically by third-party providers.</p>
                            </div>
                        </div>
                    </Section>

                    {/* Section 14 */}
                    <Section number="14" title="Limitation of Liability" isOpen={openSections.includes(14)} onToggle={() => toggleSection(14)}>
                        <div className="bg-white/5 p-6 rounded-xl border border-white/10 text-center">
                            <p className="text-lg text-white font-medium mb-2">Participation is at your own risk.</p>
                            <p className="text-slate-400">Infinite Yatra shall not be liable for accidents, injuries, loss, delays, or unforeseen circumstances beyond its reasonable control.</p>
                        </div>
                    </Section>

                    {/* Section 15 */}
                    <Section number="15" title="Legal Jurisdiction" isOpen={openSections.includes(15)} onToggle={() => toggleSection(15)}>
                        <div className="flex items-center justify-between bg-white/5 p-6 rounded-xl border border-white/10">
                            <div>
                                <h3 className="text-white font-bold mb-1">Governing Law</h3>
                                <p className="text-slate-400 text-sm">Laws of India</p>
                            </div>
                            <div className="text-right">
                                <h3 className="text-white font-bold mb-1">Jurisdiction</h3>
                                <p className="text-slate-400 text-sm">Indian Courts Only</p>
                            </div>
                        </div>
                    </Section>
                </div>

                {/* Footer Message */}
                <div className="text-center pt-20 pb-8">
                    <p className="text-slate-500 text-sm">
                        By completing a booking with Infinite Yatra, you confirm that you have read, understood, and agreed to all the above Terms & Conditions.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TermsConditions;
