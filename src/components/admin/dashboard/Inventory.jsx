import React, { useState } from 'react';
import { Package, Plus, Edit, Calendar, Users, Database, Zap } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebase';

import { usePackages } from '../../../context/PackageContext';
import { packages as staticPackages } from '../../../data/packages';
import AdminPackageForm from '../../AdminPackageForm';
import AdminDepartureManager from './AdminDepartureManager';

const Inventory = () => {
    const { allPackages, refreshPackages } = usePackages();
    const packages = allPackages || [];
    const [loading, setLoading] = useState(false);
    const [currentPackage, setCurrentPackage] = useState(null);
    const [showPackageForm, setShowPackageForm] = useState(false);
    const [showDepartureManager, setShowDepartureManager] = useState(false);

    const handleMigratePackages = async () => {
        if (!window.confirm("Overwrite database with static data?")) return;
        setLoading(true);
        try {
            for (const pkg of staticPackages) {
                await setDoc(doc(db, 'packages', pkg.id), pkg);
            }
            await refreshPackages();
            alert("Reset successful!");
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSavePackage = async (packageData) => {
        setLoading(true);
        try {
            let pkgId = packageData.id;
            if (!pkgId) pkgId = packageData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            await setDoc(doc(db, 'packages', pkgId), { ...packageData, id: pkgId }, { merge: true });
            await refreshPackages();
            setShowPackageForm(false);
            setCurrentPackage(null);
        } catch (err) {
            alert("Failed to save.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white/5 p-6 rounded-2xl border border-white/10 gap-4">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Package className="text-purple-400" /> Package Inventory
                    </h3>
                    <p className="text-slate-400 text-sm">Manage pricing, availability and trip details.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleMigratePackages} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-sm font-medium transition-colors border border-white/10 flex items-center gap-2">
                        <Database size={16} /> Reset
                    </button>
                    <button
                        onClick={() => { setCurrentPackage(null); setShowPackageForm(true); }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2"
                    >
                        <Plus size={16} /> Add Package
                    </button>
                </div>
            </div>

            {/* GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {packages.map(pkg => (
                    <div key={pkg.id} className="glass-card group rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1">
                        <div className="h-48 relative overflow-hidden">
                            <img src={pkg.image} alt={pkg.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                            <div className="absolute top-4 right-4">
                                <span className="bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold text-white border border-white/10 flex items-center gap-1">
                                    <Zap size={10} className="text-yellow-400" fill="currentColor" /> Dynamic Pricing On
                                </span>
                            </div>
                            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                <h3 className="text-lg font-bold text-white leading-tight drop-shadow-md">{pkg.title}</h3>
                                <span className="bg-blue-600/90 backdrop-blur-md px-2 py-1 rounded-md text-xs font-bold text-white shadow-lg">
                                    ₹{pkg.price?.toLocaleString()}
                                </span>
                            </div>
                        </div>
                        <div className="p-4 bg-white/5 space-y-3">
                            <div className="flex justify-between text-sm text-slate-400">
                                <span className="flex items-center gap-1"><Calendar size={14} /> {pkg.availableDates?.length || 0} Dates</span>
                                <span className="flex items-center gap-1"><Users size={14} /> {pkg.maxSeats || 12} Seats</span>
                            </div>
                            <div className="pt-3 border-t border-white/5 flex gap-2">
                                <button
                                    onClick={() => { setCurrentPackage(pkg); setShowDepartureManager(true); }}
                                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium text-white transition-colors flex items-center justify-center gap-2 border border-white/5"
                                >
                                    <Calendar size={14} /> Dates
                                </button>
                                <button
                                    onClick={() => { setCurrentPackage(pkg); setShowPackageForm(true); }}
                                    className="flex-1 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-600/20 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <Edit size={14} /> Edit
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* MODAL */}
            {showPackageForm && (
                <AdminPackageForm
                    initialData={currentPackage}
                    onSave={handleSavePackage}
                    onCancel={() => { setShowPackageForm(false); setCurrentPackage(null); }}
                />
            )}

            {/* DEPARTURE MANAGER MODAL */}
            {showDepartureManager && currentPackage && (
                <AdminDepartureManager
                    packageId={currentPackage.id}
                    packageTitle={currentPackage.title}
                    onClose={() => { setShowDepartureManager(false); setCurrentPackage(null); }}
                />
            )}
        </div>
    );
};

export default Inventory;
