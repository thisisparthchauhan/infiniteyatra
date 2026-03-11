import React, { useState, useEffect, useRef } from 'react';
import { Home, Star, Eye, EyeOff, Save, RefreshCw, GripVertical, Image as ImageIcon, Upload, X, Loader2, Plus, GripHorizontal } from 'lucide-react';
import { usePackages } from '../../../context/PackageContext';
import { getTransportConfig, updateTransportConfig } from '../../../services/transportService';
import { uploadToCloudinary } from '../../../services/cloudinary';
import { transportItems as defaultTransportItems } from '../../HomeTransport';

const AdminHomepageManager = () => {
    const { allPackages, updatePackageHomepageSettings, loading } = usePackages();
    const [packageSettings, setPackageSettings] = useState([]);
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);
    const [activeTab, setActiveTab] = useState('packages'); // 'packages' | 'transport'
    
    // Transport Config State
    const [transportConfig, setTransportConfig] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadProgressId, setUploadProgressId] = useState(null);
    const fileInputRefs = useRef({});

    useEffect(() => {
        if (allPackages && allPackages.length > 0) {
            // Initialize package settings with current values
            const settings = allPackages.map(pkg => ({
                id: pkg.id,
                title: pkg.title,
                image: pkg.image,
                location: pkg.location,
                price: pkg.priceDisplay || pkg.price,
                rating: pkg.rating,
                featuredOnHomepage: pkg.featuredOnHomepage || false,
                displayOrder: pkg.displayOrder || 999
            }));
            setPackageSettings(settings.sort((a, b) => a.displayOrder - b.displayOrder));
        }

        const fetchTransportConfig = async () => {
            try {
                const configData = await getTransportConfig();
                setTransportConfig(configData);
            } catch (error) {
                console.error("Failed to load transport config:", error);
            }
        };

        fetchTransportConfig();
    }, [allPackages]);

    const toggleFeatured = (packageId) => {
        setPackageSettings(prev => prev.map(pkg =>
            pkg.id === packageId
                ? { ...pkg, featuredOnHomepage: !pkg.featuredOnHomepage }
                : pkg
        ));
    };

    const updateDisplayOrder = (packageId, order) => {
        const numOrder = parseInt(order) || 0;
        setPackageSettings(prev => prev.map(pkg =>
            pkg.id === packageId
                ? { ...pkg, displayOrder: numOrder }
                : pkg
        ));
    };

    const handleSaveChanges = async () => {
        setSaving(true);
        setSaveStatus(null);

        try {
            if (activeTab === 'packages') {
                const updatePromises = packageSettings.map(pkg =>
                    updatePackageHomepageSettings(pkg.id, {
                        featuredOnHomepage: pkg.featuredOnHomepage,
                        displayOrder: pkg.displayOrder
                    })
                );

                const results = await Promise.all(updatePromises);
                const allSuccessful = results.every(r => r.success);

                if (allSuccessful) {
                    setSaveStatus({ type: 'success', message: 'Homepage settings saved successfully!' });
                } else {
                    setSaveStatus({ type: 'error', message: 'Some updates failed. Please try again.' });
                }
            } else if (activeTab === 'transport') {
                await updateTransportConfig(transportConfig);
                setSaveStatus({ type: 'success', message: 'Transport homepage configuration saved successfully!' });
            }
        } catch (error) {
            console.error('Error saving homepage settings:', error);
            setSaveStatus({ type: 'error', message: 'Failed to save changes. Please try again.' });
        } finally {
            setSaving(false);
            // Clear status message after 3 seconds
            setTimeout(() => setSaveStatus(null), 3000);
        }
    };

    // TRANSPORT TAB HANDLERS
    const handleTransportConfigChange = (field, value) => {
        setTransportConfig(prev => ({ ...prev, [field]: value }));
    };

    const handleCategoryChange = (index, field, value) => {
        setTransportConfig(prev => {
            const newCats = [...prev.categories];
            newCats[index] = { ...newCats[index], [field]: value };
            return { ...prev, categories: newCats };
        });
    };

    const handleAddCategory = () => {
        const newCat = {
            id: `cat-${Date.now()}`,
            title: 'New Vehicle',
            desc: 'Describe this vehicle type',
            image: '',
            type: 'New Vehicle',
            icon: 'Car',
            isVisible: true,
            isCustomImage: true
        };
        setTransportConfig(prev => ({
            ...prev,
            categories: [...prev.categories, newCat]
        }));
    };

    const handleTransportImageUpload = async (e, index, catId) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        setUploadProgressId(catId);
        setSaveStatus(null);

        try {
            const secureUrl = await uploadToCloudinary(file);
            setTransportConfig(prev => {
                const newCats = [...prev.categories];
                newCats[index] = { ...newCats[index], image: secureUrl, isCustomImage: true };
                return { ...prev, categories: newCats };
            });
            setSaveStatus({ type: 'success', message: `Image uploaded successfully! Remember to hit Save Changes.` });
        } catch (error) {
            console.error('Error uploading transport image:', error);
            setSaveStatus({ type: 'error', message: `Failed to update image.` });
        } finally {
            setUploadingImage(false);
            setUploadProgressId(null);
            setTimeout(() => setSaveStatus(null), 3000);
        }
    };

    const handleRemoveTransportImage = async (index, catId) => {
        setTransportConfig(prev => {
            const newCats = [...prev.categories];
            // Look for default image in local items
            const defaultItem = defaultTransportItems.find(item => item.id === catId || item.type === newCats[index].type);
            const defaultImageUrl = defaultItem ? defaultItem.image : '';
            
            newCats[index] = { ...newCats[index], image: defaultImageUrl, isCustomImage: false };
            return { ...prev, categories: newCats };
        });
        setSaveStatus({ type: 'success', message: `Image reset to default! Remember to hit Save Changes.` });
        setTimeout(() => setSaveStatus(null), 3000);
    };

    const featuredCount = packageSettings.filter(pkg => pkg.featuredOnHomepage).length;

    if (loading || (!transportConfig && activeTab === 'transport')) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <Home className="text-blue-500" size={28} />
                        <h2 className="text-2xl font-bold text-white">Homepage Manager</h2>
                    </div>
                    <p className="text-slate-400 mt-1">
                        Control the featured content that appears on the public homepage.
                    </p>
                </div>
                <button
                    onClick={handleSaveChanges}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap"
                >
                    {saving ? (
                        <>
                            <RefreshCw className="animate-spin" size={20} />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save size={20} />
                            Save Changes
                        </>
                    )}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 max-w-md">
                <button
                    onClick={() => setActiveTab('packages')}
                    className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors ${
                        activeTab === 'packages' 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                >
                    Tour Packages
                </button>
                <button
                    onClick={() => setActiveTab('transport')}
                    className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors ${
                        activeTab === 'transport' 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                >
                    Transport Section
                </button>
            </div>

            {/* Status Message */}
            {saveStatus && (
                <div className={`p-4 rounded-lg ${saveStatus.type === 'success'
                        ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                        : 'bg-red-500/20 border border-red-500/50 text-red-400'
                    }`}>
                    {saveStatus.message}
                </div>
            )}

            {activeTab === 'packages' && (
                <>
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                            <div className="text-slate-400 text-sm">Total Packages</div>
                            <div className="text-2xl font-bold text-white mt-1">{packageSettings.length}</div>
                        </div>
                        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                            <div className="text-slate-400 text-sm">Featured on Homepage</div>
                            <div className="text-2xl font-bold text-blue-400 mt-1">{featuredCount}</div>
                        </div>
                        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                            <div className="text-slate-400 text-sm">Not Featured</div>
                            <div className="text-2xl font-bold text-slate-400 mt-1">{packageSettings.length - featuredCount}</div>
                        </div>
                    </div>

                    {/* Package List */}
                    <div className="bg-slate-800 rounded-lg border border-slate-700">
                        <div className="p-4 border-b border-slate-700">
                            <h3 className="text-lg font-semibold text-white">Package Settings</h3>
                            <p className="text-sm text-slate-400 mt-1">
                                Toggle packages to feature them on homepage and set their display order (lower numbers appear first)
                            </p>
                        </div>

                        <div className="divide-y divide-slate-700">
                            {packageSettings.map((pkg) => (
                                <div key={pkg.id} className={`p-4 hover:bg-slate-750 transition-colors ${pkg.featuredOnHomepage ? 'bg-slate-750/50' : ''}`}>
                                    <div className="flex items-center gap-4">
                                        {/* Drag Handle */}
                                        <div className="text-slate-600">
                                            <GripVertical size={20} />
                                        </div>

                                        {/* Package Image */}
                                        <img
                                            src={pkg.image}
                                            alt={pkg.title}
                                            className="w-16 h-16 object-cover rounded-lg"
                                        />

                                        {/* Package Info */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-white font-semibold truncate">{pkg.title}</h4>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                                                <span>{pkg.location}</span>
                                                <span className="flex items-center gap-1">
                                                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                                                    {pkg.rating}
                                                </span>
                                                <span className="font-semibold text-white">{pkg.price}</span>
                                            </div>
                                        </div>

                                        {/* Display Order Input */}
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-slate-400">Order</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={pkg.displayOrder === 999 ? '' : pkg.displayOrder}
                                                onChange={(e) => updateDisplayOrder(pkg.id, e.target.value)}
                                                placeholder="999"
                                                disabled={!pkg.featuredOnHomepage}
                                                className="w-20 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-center disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-blue-500"
                                            />
                                        </div>

                                        {/* Featured Toggle */}
                                        <button
                                            onClick={() => toggleFeatured(pkg.id)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${pkg.featuredOnHomepage
                                                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                                }`}
                                        >
                                            {pkg.featuredOnHomepage ? (
                                                <>
                                                    <Eye size={18} />
                                                    Featured
                                                </>
                                            ) : (
                                                <>
                                                    <EyeOff size={18} />
                                                    Hidden
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Help Text */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                        <h4 className="text-blue-400 font-semibold mb-2">💡 How it works</h4>
                        <ul className="text-slate-300 text-sm space-y-1">
                            <li>• Toggle packages as "Featured" to show them on the homepage</li>
                            <li>• Set display order (1, 2, 3...) to control the sequence - lower numbers appear first</li>
                            <li>• Packages with the same order will be sorted alphabetically</li>
                            <li>• If no packages are featured, the homepage will show the first 4 packages by default</li>
                            <li>• Click "Save Changes" to apply your settings</li>
                        </ul>
                    </div>
                </>
            )}

            {activeTab === 'transport' && transportConfig && (
                <div className="space-y-6">
                    {/* Header Configuration */}
                    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                        <h3 className="text-lg font-semibold text-white mb-6 border-b border-slate-700 pb-3">Section Header configuration</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Heading</label>
                                <input
                                    type="text"
                                    value={transportConfig.homepageHeading || ''}
                                    onChange={(e) => handleTransportConfigChange('homepageHeading', e.target.value)}
                                    className="w-full bg-[#111] border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                    placeholder="e.g. Move Infinite"
                                />
                           </div>
                           <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Subtext</label>
                                <textarea
                                    value={transportConfig.homepageSubtext || ''}
                                    onChange={(e) => handleTransportConfigChange('homepageSubtext', e.target.value)}
                                    className="w-full bg-[#111] border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 min-h-[48px]"
                                    placeholder="e.g. From a cycle to a Cruise..."
                                    rows={1}
                                />
                           </div>
                           <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Button Prefix</label>
                                <input
                                    type="text"
                                    value={transportConfig.buttonPrefix || 'Explore'}
                                    onChange={(e) => handleTransportConfigChange('buttonPrefix', e.target.value)}
                                    className="w-full bg-[#111] border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                    placeholder="e.g. Explore"
                                />
                           </div>
                        </div>
                    </div>

                    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-3">
                            <h3 className="text-lg font-semibold text-white">Vehicle Categories</h3>
                            <button 
                                onClick={handleAddCategory}
                                className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-3 py-1.5 rounded flex items-center gap-2 text-sm font-medium transition-colors"
                            >
                                <Plus size={16} /> Add Vehicle
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {transportConfig.categories?.map((cat, index) => {
                                const isCurrentlyUploading = uploadingImage && uploadProgressId === cat.id;

                                return (
                                    <div key={cat.id || index} className={`bg-slate-900 rounded-xl border transition-all overflow-hidden flex flex-col ${cat.isVisible ? 'border-slate-700' : 'border-slate-800 opacity-60'}`}>
                                        
                                        {/* Image Section */}
                                        <div className="relative aspect-video bg-slate-800 flex flex-col items-center justify-center group overflow-hidden shrink-0">
                                            {cat.image ? (
                                                <>
                                                    <img src={cat.image} alt={cat.type} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                        <button 
                                                            onClick={() => fileInputRefs.current[index]?.click()}
                                                            disabled={uploadingImage}
                                                            className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors disabled:opacity-50 shadow-lg"
                                                            title="Replace Image"
                                                        >
                                                            <Upload size={18} />
                                                        </button>
                                                        {cat.isCustomImage && (
                                                            <button 
                                                                onClick={() => handleRemoveTransportImage(index, cat.id)}
                                                                disabled={uploadingImage}
                                                                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors disabled:opacity-50 shadow-lg"
                                                                title="Clear & Revert to Default"
                                                            >
                                                                <X size={18} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <ImageIcon size={32} className="text-slate-600 mb-2" />
                                                    <span className="text-xs text-slate-500">No Asset</span>
                                                    <button 
                                                        onClick={() => fileInputRefs.current[index]?.click()}
                                                        disabled={uploadingImage}
                                                        className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100 disabled:opacity-0"
                                                    >
                                                        <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
                                                            <Upload size={14} /> Upload Custom
                                                        </span>
                                                    </button>
                                                </>
                                            )}

                                            {isCurrentlyUploading && (
                                                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                                                    <Loader2 className="animate-spin text-blue-500 mb-2" size={24} />
                                                    <span className="text-xs text-blue-400 font-medium">Uploading...</span>
                                                </div>
                                            )}

                                            <input 
                                                type="file" 
                                                accept="image/*"
                                                className="hidden"
                                                ref={el => fileInputRefs.current[index] = el}
                                                onChange={(e) => handleTransportImageUpload(e, index, cat.id)}
                                            />
                                        </div>

                                        {/* Content Editor Section */}
                                        <div className="p-4 flex-1 flex flex-col gap-3">
                                            <div className="flex items-center justify-between mb-1 gap-2">
                                                <input 
                                                    type="text" 
                                                    value={cat.title} 
                                                    onChange={e => handleCategoryChange(index, 'title', e.target.value)}
                                                    className="w-full bg-transparent font-bold text-white focus:outline-none focus:border-b focus:border-blue-500 px-1"
                                                    placeholder="Vehicle Title"
                                                />
                                                <button
                                                    onClick={() => handleCategoryChange(index, 'isVisible', !cat.isVisible)}
                                                    className={`p-1.5 rounded shrink-0 ${cat.isVisible ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                                                    title={cat.isVisible ? "Visible to users" : "Hidden from users"}
                                                >
                                                    {cat.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                                                </button>
                                            </div>

                                            <input 
                                                type="text" 
                                                value={cat.desc} 
                                                onChange={e => handleCategoryChange(index, 'desc', e.target.value)}
                                                className="w-full bg-[#111] rounded border border-slate-700 text-sm text-slate-300 focus:outline-none focus:border-blue-500 p-2"
                                                placeholder="Short description"
                                            />
                                            
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    value={cat.type} 
                                                    onChange={e => handleCategoryChange(index, 'type', e.target.value)}
                                                    className="flex-1 bg-[#111] rounded border border-slate-700 text-xs font-mono text-slate-400 focus:outline-none focus:border-blue-500 p-2"
                                                    placeholder="Type Matcher (e.g. Cars, Bus)"
                                                    title="System identifier - must match Transport Filters"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminHomepageManager;
