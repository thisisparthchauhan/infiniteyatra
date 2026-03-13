import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Image as ImageIcon, Type, Sparkles, MessageSquare, Plus, Trash2, Shield, Zap, Car, Bus, Train, Ship, Plane, Bike, Rocket } from 'lucide-react';
import { getTransportConfig, updateTransportConfig } from '../../../services/transportService';
import ImageUploadField from './ImageUploadField';

const AVAILABLE_ICONS = [
    { name: 'Car', component: Car },
    { name: 'Bus', component: Bus },
    { name: 'Train', component: Train },
    { name: 'Ship', component: Ship },
    { name: 'Plane', component: Plane },
    { name: 'Bike', component: Bike },
    { name: 'Rocket', component: Rocket },
    { name: 'Shield', component: Shield },
    { name: 'Zap', component: Zap },
    { name: 'Sparkles', component: Sparkles }
];

const AdminTransportContent = () => {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            setLoading(true);
            const data = await getTransportConfig();
            setConfig(data || {
                heroImage: '',
                heroTitlePre: 'Move',
                heroTitleHighlight: 'Infinite',
                heroSubtitle: '',
                buttonPrefix: 'Explore',
                features: []
            });
        } catch (error) {
            console.error("Error loading config:", error);
            setConfig({
                heroImage: '',
                heroTitlePre: 'Move',
                heroTitleHighlight: 'Infinite',
                heroSubtitle: '',
                buttonPrefix: 'Explore',
                features: []
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await updateTransportConfig(config);
            alert('Content updated successfully!');
        } catch (error) {
            console.error("Error saving config:", error);
            alert("Failed to save changes.");
        } finally {
            setSaving(false);
        }
    };

    const handleFeatureChange = (index, field, value) => {
        const updatedFeatures = [...config.features];
        updatedFeatures[index] = { ...updatedFeatures[index], [field]: value };
        setConfig({ ...config, features: updatedFeatures });
    };

    const addFeature = () => {
        if (config.features.length >= 4) {
            alert('Maximum 4 features allowed.');
            return;
        }
        setConfig({
            ...config,
            features: [...config.features, { title: 'New Feature', description: 'Description here', iconName: 'Sparkles' }]
        });
    };

    const removeFeature = (index) => {
        const updatedFeatures = [...config.features];
        updatedFeatures.splice(index, 1);
        setConfig({ ...config, features: updatedFeatures });
    };

    if (loading || !config) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto pb-24">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Type className="text-purple-500" />
                        Transport Content Management
                    </h2>
                    <p className="text-slate-400 mt-1">Customize the texts, images, and features shown on the Transport homepage.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-colors shadow-lg shadow-purple-500/20"
                >
                    {saving ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" /> : <Save size={18} />}
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="space-y-6">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8"
                >
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
                        <ImageIcon className="text-blue-400" size={20} /> Hero Section Content
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <ImageUploadField
                                value={config.heroImage}
                                onChange={(url) => setConfig({ ...config, heroImage: url })}
                                storagePath="transport/content"
                                label="Hero Image"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Button Text</label>
                            <input
                                type="text"
                                className="w-full bg-black/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-purple-500 transition-colors"
                                value={config.buttonPrefix}
                                onChange={e => setConfig({ ...config, buttonPrefix: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Title Pre-Text</label>
                            <input
                                type="text"
                                className="w-full bg-black/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-purple-500 transition-colors"
                                value={config.heroTitlePre}
                                onChange={e => setConfig({ ...config, heroTitlePre: e.target.value })}
                                placeholder="e.g., Move"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Title Highlighted Text</label>
                            <input
                                type="text"
                                className="w-full bg-black/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-purple-500 transition-colors"
                                value={config.heroTitleHighlight}
                                onChange={e => setConfig({ ...config, heroTitleHighlight: e.target.value })}
                                placeholder="e.g., Infinite"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Subtitle / Description</label>
                        <textarea
                            className="w-full bg-black/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-purple-500 transition-colors"
                            rows="3"
                            value={config.heroSubtitle}
                            onChange={e => setConfig({ ...config, heroSubtitle: e.target.value })}
                        />
                    </div>
                </motion.div>

                {/* Features Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8"
                >
                    <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Sparkles className="text-yellow-400" size={20} /> Feature Highlights
                        </h3>
                        <button
                            onClick={addFeature}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-colors border border-slate-700"
                        >
                            <Plus size={14} /> Add Feature
                        </button>
                    </div>

                    <div className="space-y-4">
                        {config.features.map((feature, index) => (
                            <div key={index} className="bg-black/30 border border-slate-800 rounded-2xl p-5 relative group">
                                <button
                                    onClick={() => removeFeature(index)}
                                    className="absolute top-4 right-4 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 rounded-lg p-1.5"
                                >
                                    <Trash2 size={16} />
                                </button>
                                
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                                    <div className="md:col-span-3">
                                        <label className="block text-xs font-medium text-slate-500 mb-2">Icon</label>
                                        <select
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:border-purple-500"
                                            value={feature.iconName}
                                            onChange={(e) => handleFeatureChange(index, 'iconName', e.target.value)}
                                        >
                                            {AVAILABLE_ICONS.map(icon => (
                                                <option key={icon.name} value={icon.name}>{icon.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="md:col-span-9">
                                        <label className="block text-xs font-medium text-slate-500 mb-2">Title</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-purple-500 text-sm mb-4"
                                            value={feature.title}
                                            onChange={e => handleFeatureChange(index, 'title', e.target.value)}
                                        />
                                        
                                        <label className="block text-xs font-medium text-slate-500 mb-2">Description</label>
                                        <textarea
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-purple-500 text-sm"
                                            rows="2"
                                            value={feature.description}
                                            onChange={e => handleFeatureChange(index, 'description', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {config.features.length === 0 && (
                            <p className="text-slate-500 text-center py-8">No features added. Click "Add Feature" to create one.</p>
                        )}
                    </div>
                </motion.div>
                
                {/* Information Banner */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-3 text-blue-200 text-sm">
                    <MessageSquare className="shrink-0 text-blue-400 mt-0.5" size={18} />
                    <p>
                        Vehicle categories shown on the homepage are managed separately in the <strong>Vehicles Configuration</strong> area. The settings here only control the main marketing copy and imagery.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminTransportContent;
