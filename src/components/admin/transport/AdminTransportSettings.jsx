import React, { useState, useEffect } from 'react';
import { Settings, ShieldAlert, Clock, Car, IndianRupee, MessageCircle, Save } from 'lucide-react';
import { getTransportSettings, updateTransportSettings } from '../../../services/transportService';

const AdminTransportSettings = () => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const data = await getTransportSettings();
            setSettings({
                // Default structure guaranteeing all fields exist
                isTransportEnabled: true,
                maintenanceMode: false,
                minAdvanceBookingHours: 12,
                maxAdvanceBookingDays: 60,
                freeCancellationHours: 24,
                typesEnabled: {
                    cycle: true,
                    ebicycle: true,
                    bike: true,
                    car: true,
                    traveller: true
                },
                pricingDisplay: {
                    showPerHour: true,
                    showPerDay: true,
                    showPriceOnCards: true
                },
                contactWhatsApp: '',
                directWhatsAppBooking: false,
                ...data
            });
        } catch (error) {
            console.error('Error fetching settings:', error);
            showToast('Failed to load settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await updateTransportSettings(settings);
            showToast('Settings saved successfully!');
        } catch (error) {
            console.error('Error saving settings:', error);
            showToast('Failed to save settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    const showToast = (message, type = 'success') => {
        setToastMessage({ text: message, type });
        setTimeout(() => setToastMessage(''), 3000);
    };

    const handleNestedChange = (category, field, value) => {
        setSettings(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [field]: value
            }
        }));
    };

    if (loading || !settings) return (
        <div className="flex justify-center items-center h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
    );

    return (
        <div className="p-6 max-w-5xl mx-auto">

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Settings className="text-blue-500" />
                        Transport Settings
                    </h2>
                    <p className="text-slate-400">Configure global rules and features for vehicle booking.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-colors shadow-lg shadow-blue-500/20"
                >
                    {saving ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Save size={18} />}
                    {saving ? 'Saving...' : 'Save All Settings'}
                </button>
            </div>

            {/* Toast Notification */}
            {toastMessage && (
                <div className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-xl font-bold shadow-2xl transition-all flex items-center gap-2 ${toastMessage.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                    }`}>
                    {toastMessage.text}
                </div>
            )}

            <div className="space-y-6">

                {/* 1. GLOBAL CONTROLS */}
                <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
                        <ShieldAlert className="text-purple-500" size={20} />
                        Global Controls
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <label className="flex items-center justify-between p-4 rounded-xl border border-slate-700 bg-[#111] cursor-pointer hover:border-blue-500 transition-colors">
                            <div>
                                <span className="text-sm font-bold text-white block">Enable Transport on Website</span>
                                <span className="text-xs text-slate-400">Master switch. If OFF, shows "Coming Soon".</span>
                            </div>
                            <div className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${settings.isTransportEnabled ? 'bg-green-500' : 'bg-slate-600'}`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.isTransportEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </div>
                            {/* Hidden input to maintain state */}
                            <input type="checkbox" className="hidden"
                                checked={settings.isTransportEnabled}
                                onChange={(e) => setSettings({ ...settings, isTransportEnabled: e.target.checked })}
                            />
                        </label>

                        <label className="flex items-center justify-between p-4 rounded-xl border border-slate-700 bg-[#111] cursor-pointer hover:border-yellow-500 transition-colors">
                            <div>
                                <span className="text-sm font-bold text-white block">Under Maintenance Mode</span>
                                <span className="text-xs text-yellow-500/70">Shows maintenance banner and pauses new bookings.</span>
                            </div>
                            <div className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${settings.maintenanceMode ? 'bg-yellow-500' : 'bg-slate-600'}`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
                            </div>
                            <input type="checkbox" className="hidden"
                                checked={settings.maintenanceMode}
                                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                            />
                        </label>
                    </div>
                </section>

                {/* 2. BOOKING RULES */}
                <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
                        <Clock className="text-blue-500" size={20} />
                        Booking Rules
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Minimum Advance Booking (Hours)</label>
                            <input
                                type="number" min="0"
                                className="w-full bg-[#111] border border-slate-800 rounded-xl px-4 py-3 text-white text-base min-h-[44px] focus:outline-none focus:border-blue-500 transition-colors"
                                value={settings.minAdvanceBookingHours}
                                onChange={(e) => setSettings({ ...settings, minAdvanceBookingHours: parseInt(e.target.value) || 0 })}
                            />
                            <p className="text-xs text-slate-500 mt-1">Users cannot book for the immediate next X hours.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Maximum Advance Booking (Days)</label>
                            <input
                                type="number" min="1"
                                className="w-full bg-[#111] border border-slate-800 rounded-xl px-4 py-3 text-white text-base min-h-[44px] focus:outline-none focus:border-blue-500 transition-colors"
                                value={settings.maxAdvanceBookingDays}
                                onChange={(e) => setSettings({ ...settings, maxAdvanceBookingDays: parseInt(e.target.value) || 0 })}
                            />
                            <p className="text-xs text-slate-500 mt-1">How far into the future users can book.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Free Cancellation Window (Hours)</label>
                            <input
                                type="number" min="0"
                                className="w-full bg-[#111] border border-slate-800 rounded-xl px-4 py-3 text-white text-base min-h-[44px] focus:outline-none focus:border-blue-500 transition-colors"
                                value={settings.freeCancellationHours}
                                onChange={(e) => setSettings({ ...settings, freeCancellationHours: parseInt(e.target.value) || 0 })}
                            />
                            <p className="text-xs text-slate-500 mt-1">Hours before pickup allowed for free cancellation.</p>
                        </div>
                    </div>
                </section>

                {/* 3. VEHICLE TYPE CONTROL */}
                <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
                        <Car className="text-emerald-500" size={20} />
                        Global Vehicle Type Controls
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {Object.entries({
                            cycle: 'Cycles',
                            ebicycle: 'E-Bicycles',
                            bike: 'Bikes',
                            car: 'Cars',
                            traveller: 'Travellers'
                        }).map(([key, label]) => (
                            <label key={key} className={`flex flex-col gap-3 p-4 rounded-xl border border-slate-700 cursor-pointer transition-colors text-center ${settings.typesEnabled?.[key] ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-[#111]'}`}>
                                <span className="text-sm font-bold text-white">{label}</span>
                                <div className="flex justify-center mt-1">
                                    <div className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${settings.typesEnabled?.[key] ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${settings.typesEnabled?.[key] ? 'translate-x-5' : 'translate-x-1'}`} />
                                    </div>
                                </div>
                                <input type="checkbox" className="hidden"
                                    checked={settings.typesEnabled?.[key]}
                                    onChange={(e) => handleNestedChange('typesEnabled', key, e.target.checked)}
                                />
                            </label>
                        ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-4">These switches override city-level settings. If turned OFF here, the vehicle type is hidden globally.</p>
                </section>

                {/* 4. PRICING & CONTACT */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">

                    {/* Pricing Display */}
                    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
                            <IndianRupee className="text-yellow-500" size={20} />
                            Pricing Display
                        </h3>

                        <div className="space-y-4">
                            <label className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-300">Show "Price Per Hour" Option</span>
                                <input type="checkbox" className="w-4 h-4 rounded bg-[#111] border-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900"
                                    checked={settings.pricingDisplay?.showPerHour}
                                    onChange={(e) => handleNestedChange('pricingDisplay', 'showPerHour', e.target.checked)}
                                />
                            </label>

                            <label className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-300">Show "Price Per Day" Option</span>
                                <input type="checkbox" className="w-4 h-4 rounded bg-[#111] border-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900"
                                    checked={settings.pricingDisplay?.showPerDay}
                                    onChange={(e) => handleNestedChange('pricingDisplay', 'showPerDay', e.target.checked)}
                                />
                            </label>

                            <label className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-300">Show Pricing on Vehicle Cards</span>
                                <input type="checkbox" className="w-4 h-4 rounded bg-[#111] border-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900"
                                    checked={settings.pricingDisplay?.showPriceOnCards}
                                    onChange={(e) => handleNestedChange('pricingDisplay', 'showPriceOnCards', e.target.checked)}
                                />
                            </label>

                            <div className="pt-4 mt-2 border-t border-slate-800 flex justify-between items-center">
                                <span className="text-sm font-medium text-slate-300">Default Currency</span>
                                <span className="bg-[#111] px-3 py-1 rounded-md text-slate-400 text-sm font-mono border border-slate-800">INR (₹)</span>
                            </div>
                        </div>
                    </section>

                    {/* Contact For Booking */}
                    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
                            <MessageCircle className="text-green-500" size={20} />
                            Contact & WhatsApp Integration
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">WhatsApp Number for Transport Enquiries</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">+91</span>
                                    <input
                                        type="tel"
                                        placeholder="Enter 10 digit number"
                                        className="w-full bg-[#111] border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white text-base min-h-[44px] focus:outline-none focus:border-green-500 transition-colors"
                                        value={settings.contactWhatsApp}
                                        onChange={(e) => setSettings({ ...settings, contactWhatsApp: e.target.value })}
                                    />
                                </div>
                            </div>

                            <label className="flex items-center justify-between p-4 rounded-xl border border-slate-700 bg-[#111] cursor-pointer hover:border-green-500 transition-colors">
                                <div>
                                    <span className="text-sm font-bold text-white block">Direct WhatsApp Booking</span>
                                    <span className="text-xs text-slate-400">If ON, "Book Now" opens WhatsApp instead of the internal checkout flow.</span>
                                </div>
                                <div className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${settings.directWhatsAppBooking ? 'bg-green-500' : 'bg-slate-600'}`}>
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.directWhatsAppBooking ? 'translate-x-6' : 'translate-x-1'}`} />
                                </div>
                                <input type="checkbox" className="hidden"
                                    checked={settings.directWhatsAppBooking}
                                    onChange={(e) => setSettings({ ...settings, directWhatsAppBooking: e.target.checked })}
                                />
                            </label>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
};

export default AdminTransportSettings;
