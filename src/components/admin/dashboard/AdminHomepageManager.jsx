import React, { useState, useEffect } from 'react';
import { Home, Star, Eye, EyeOff, Save, RefreshCw, GripVertical } from 'lucide-react';
import { usePackages } from '../../../context/PackageContext';

const AdminHomepageManager = () => {
    const { allPackages, updatePackageHomepageSettings, loading } = usePackages();
    const [packageSettings, setPackageSettings] = useState([]);
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);

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
        } catch (error) {
            console.error('Error saving homepage settings:', error);
            setSaveStatus({ type: 'error', message: 'Failed to save changes. Please try again.' });
        } finally {
            setSaving(false);
            // Clear status message after 3 seconds
            setTimeout(() => setSaveStatus(null), 3000);
        }
    };

    const featuredCount = packageSettings.filter(pkg => pkg.featuredOnHomepage).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Home className="text-blue-500" size={28} />
                        <h2 className="text-2xl font-bold text-white">Homepage Manager</h2>
                    </div>
                    <p className="text-slate-400 mt-1">
                        Control which packages appear on your homepage and their display order
                    </p>
                </div>
                <button
                    onClick={handleSaveChanges}
                    disabled={saving}
                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
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

            {/* Status Message */}
            {saveStatus && (
                <div className={`p-4 rounded-lg ${saveStatus.type === 'success'
                        ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                        : 'bg-red-500/20 border border-red-500/50 text-red-400'
                    }`}>
                    {saveStatus.message}
                </div>
            )}

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
        </div>
    );
};

export default AdminHomepageManager;
