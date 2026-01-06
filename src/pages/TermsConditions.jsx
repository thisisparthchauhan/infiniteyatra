import React from 'react';
import { FileText, Shield, AlertTriangle, CreditCard, Clock, Ban } from 'lucide-react';

const TermsConditions = () => {
    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-12">
            <div className="max-w-4xl mx-auto px-6">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-slate-900 text-white p-8 md:p-12 text-center">
                        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                            <FileText size={32} />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold mb-4">Terms & Conditions</h1>
                        <p className="text-slate-300 max-w-2xl mx-auto">
                            Infinite Yatra – Explore Infinite
                        </p>
                        <p className="text-xs text-slate-500 mt-4">Last Updated: January 2026</p>
                    </div>

                    {/* Content */}
                    <div className="p-8 md:p-12 space-y-12">

                        <div className="prose max-w-none text-slate-600">
                            <p className="font-medium text-slate-900 bg-blue-50 p-4 rounded-lg border border-blue-100">
                                By accessing, browsing, or booking any travel service through Infinite Yatra, you acknowledge that you have read, understood, and agreed to be bound by the following Terms & Conditions.
                            </p>
                        </div>

                        {/* Section 1 */}
                        <section>
                            <h2 className="flex items-center gap-3 text-xl font-bold text-slate-900 mb-4">
                                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm">1</span>
                                Company Information
                            </h2>
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 space-y-3">
                                <p><strong>Brand Name:</strong> Infinite Yatra</p>
                                <p><strong>Nature of Business:</strong> Travel & Trekking Services</p>
                                <div>
                                    <strong className="block mb-2">Services Offered:</strong>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Treks & Adventure Tours</li>
                                        <li>Spiritual & Cultural Journeys</li>
                                        <li>Fixed Group Departures</li>
                                        <li>Custom & Private Trips</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* Section 2 */}
                        <section>
                            <h2 className="flex items-center gap-3 text-xl font-bold text-slate-900 mb-4">
                                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm">2</span>
                                Acceptance of Terms
                            </h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>By making a booking on our website or through our official channels, the customer agrees to all terms mentioned herein.</li>
                                <li>These Terms & Conditions apply to all packages, including treks, tours, and customized itineraries.</li>
                                <li>Infinite Yatra reserves the right to modify these terms at any time without prior notice.</li>
                            </ul>
                        </section>

                        {/* Section 3 */}
                        <section>
                            <h2 className="flex items-center gap-3 text-xl font-bold text-slate-900 mb-4">
                                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm">3</span>
                                Booking & Confirmation Policy
                            </h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>A booking is considered confirmed only after successful receipt of payment (partial or full).</li>
                                <li>Confirmation is shared via: Website booking confirmation, WhatsApp message from Infinite Yatra Business Account, or Email (if provided).</li>
                                <li>A unique Booking ID is generated for every confirmed booking and must be quoted in all communications.</li>
                            </ul>
                        </section>

                        {/* Section 4 */}
                        <section>
                            <div className="flex items-start gap-4">
                                <h2 className="flex items-center gap-3 text-xl font-bold text-slate-900 mb-4">
                                    <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm">4</span>
                                    Payment Policy
                                </h2>
                            </div>
                            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 mb-4">
                                <div className="flex items-center gap-3 mb-3 font-semibold text-blue-900">
                                    <CreditCard size={20} /> Accepted Payment Modes
                                </div>
                                <p>UPI, Debit/Credit Cards, Net Banking (Processed securely through Razorpay)</p>
                            </div>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>All prices mentioned are per person, unless explicitly stated otherwise.</li>
                                <li>Any applicable bank or payment gateway charges are borne by the customer.</li>
                                <li>Partial payment (if allowed) confirms the seat; the remaining amount must be paid before departure as per package terms.</li>
                                <li className="text-red-600 font-medium">Failure to pay the balance amount may lead to cancellation without refund.</li>
                            </ul>
                        </section>

                        {/* Section 5 */}
                        <section>
                            <h2 className="flex items-center gap-3 text-xl font-bold text-slate-900 mb-4">
                                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm">5</span>
                                Cancellation & Refund Policy
                            </h2>
                            <div className="overflow-hidden rounded-xl border border-slate-200 mb-4">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-100 text-slate-900 font-bold">
                                        <tr>
                                            <th className="p-4">Cancellation Period</th>
                                            <th className="p-4">Charges</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        <tr>
                                            <td className="p-4">15 days or more before departure</td>
                                            <td className="p-4 text-green-600 font-bold">10%</td>
                                        </tr>
                                        <tr>
                                            <td className="p-4">7–14 days before departure</td>
                                            <td className="p-4 text-orange-600 font-bold">30%</td>
                                        </tr>
                                        <tr>
                                            <td className="p-4">3–6 days before departure</td>
                                            <td className="p-4 text-red-600 font-bold">50%</td>
                                        </tr>
                                        <tr className="bg-red-50">
                                            <td className="p-4 font-medium">Less than 72 hours / No Show</td>
                                            <td className="p-4 text-red-700 font-bold">No Refund</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <ul className="list-disc pl-5 space-y-2 text-sm">
                                <li>Refunds, if applicable, are processed within 7–10 working days.</li>
                                <li>Refunds are made only to the original payment method.</li>
                                <li>No cash refunds under any circumstances.</li>
                            </ul>
                        </section>

                        {/* Section 6 */}
                        <section>
                            <h2 className="flex items-center gap-3 text-xl font-bold text-slate-900 mb-4">
                                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm">6</span>
                                Force Majeure / Uncontrollable Events
                            </h2>
                            <p className="mb-3">Infinite Yatra shall not be held responsible for delays, changes, or cancellations due to:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                {['Weather conditions', 'Natural disasters', 'Roadblocks or landslides', 'Government restrictions', 'Political unrest'].map((item) => (
                                    <div key={item} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                                        <Shield size={16} className="text-slate-400" /> {item}
                                    </div>
                                ))}
                            </div>
                            <p className="text-sm italic text-slate-600">In such cases, alternative dates or trip credits may be offered. Cash refunds are not guaranteed.</p>
                        </section>

                        {/* Section 7 */}
                        <section>
                            <h2 className="flex items-center gap-3 text-xl font-bold text-slate-900 mb-4">
                                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm">7</span>
                                Itinerary & Service Changes
                            </h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Itineraries may be modified due to safety, weather, or operational reasons.</li>
                                <li>Such changes are made in the best interest of travelers.</li>
                                <li>No refunds will be issued for itinerary changes or skipped activities due to external conditions.</li>
                            </ul>
                        </section>

                        {/* Section 8, 9, 10 - Health & Eligibility */}
                        <section>
                            <h2 className="flex items-center gap-3 text-xl font-bold text-slate-900 mb-4">
                                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm">8-10</span>
                                Health, Medical & Eligibility
                            </h2>
                            <div className="space-y-4">
                                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                                    <h3 className="font-bold text-orange-900 mb-2 flex items-center gap-2"><AlertTriangle size={18} /> Fitness & Liability</h3>
                                    <p className="text-sm text-orange-800">Travelers are responsible for assessing their physical fitness. Infinite Yatra reserves the right to deny participation or remove a traveler mid-trip if found medically unfit. No refund provided.</p>
                                </div>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>Travelers must disclose medical conditions (asthma, heart issues, etc.) before booking.</li>
                                    <li>The company is not liable for medical emergencies or injuries during the trip.</li>
                                    <li>Age restrictions apply. Children below minimum age are not permitted on high-altitude treks.</li>
                                </ul>
                            </div>
                        </section>

                        {/* Remaining Sections */}
                        <section>
                            <h2 className="flex items-center gap-3 text-xl font-bold text-slate-900 mb-4">
                                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm">11-18</span>
                                General Policies
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-2">Behavior & Discipline</h3>
                                    <p className="text-sm text-slate-600 mb-4">Alcohol/drugs strictly prohibited. Misconduct leads to immediate removal without refund.</p>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-2">Accommodation & Transport</h3>
                                    <p className="text-sm text-slate-600 mb-4">As per package (sharing basis). Delays due to terrain/weather not eligible for refunds.</p>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-2">Belongings</h3>
                                    <p className="text-sm text-slate-600 mb-4">Infinite Yatra is not responsible for loss/theft. Participation is at own risk.</p>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-2">Media Consent</h3>
                                    <p className="text-sm text-slate-600 mb-4">Photos/videos may be used for marketing. Inform in writing if you wish to opt out.</p>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-2">Legal Jurisdiction</h3>
                                    <p className="text-sm text-slate-600 mb-4">All disputes subject to Indian laws. Jurisdiction: India only.</p>
                                </div>
                            </div>
                        </section>

                        <div className="pt-8 border-t border-slate-200 text-center">
                            <p className="text-slate-900 font-medium">By completing a booking with Infinite Yatra, you confirm that you have read and agree to all the above Terms & Conditions.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsConditions;
