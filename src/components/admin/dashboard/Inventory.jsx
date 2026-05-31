import React, { useState, useRef } from 'react';
import { Package, Plus, Edit, Calendar, Users, Database, Zap, Copy, Eye, EyeOff, Trash2, RotateCcw, AlertTriangle, Lock, Loader2 } from 'lucide-react';
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../../../firebase';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

import { usePackages } from '../../../context/PackageContext';
import { useToast } from '../../../context/ToastContext';
import { packages as staticPackages } from '../../../data/packages';
import AdminPackageForm from '../../AdminPackageForm';
import AdminDepartureManager from './AdminDepartureManager';

// Deep compare helper — strips undefined/null for clean comparison
const hasChanges = (original, updated) => {
    const clean = (obj) => JSON.parse(JSON.stringify(obj ?? {}));
    return JSON.stringify(clean(original)) !== JSON.stringify(clean(updated));
};

// Confirm dialog (step 1)
const ConfirmDialog = ({ message, onConfirm, onCancel }) => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={20} className="text-red-400" />
                </div>
                <p className="text-white text-sm font-medium">{message}</p>
            </div>
            <div className="flex gap-3 justify-end">
                <button onClick={onCancel} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-sm border border-white/10 transition-colors">No, Cancel</button>
                <button onClick={onConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors">Yes, Delete</button>
            </div>
        </div>
    </div>
);

// Password verification dialog (step 2)
const PasswordDialog = ({ title, message, onVerified, onCancel }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [checking, setChecking] = useState(false);
    const inputRef = useRef(null);

    const verify = async () => {
        if (!password.trim()) { setError('Please enter your password.'); return; }
        setChecking(true);
        setError('');
        try {
            const user = auth.currentUser;
            if (!user || !user.email) throw new Error('Not logged in');
            const credential = EmailAuthProvider.credential(user.email, password);
            await reauthenticateWithCredential(user, credential);
            onVerified(); // password correct → proceed
        } catch (err) {
            if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError('❌ Incorrect password. Deletion blocked.');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Too many attempts. Try again later.');
            } else {
                setError('Verification failed. Please try again.');
            }
        } finally {
            setChecking(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1a1f2e] border border-red-500/30 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                        <Lock size={20} className="text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-sm">{title}</h3>
                        <p className="text-slate-400 text-xs mt-0.5">{message}</p>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-xs text-slate-400 mb-2 font-medium">Enter your login password to confirm:</label>
                    <input
                        ref={inputRef}
                        type="password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(''); }}
                        onKeyDown={(e) => e.key === 'Enter' && verify()}
                        autoFocus
                        placeholder="Your password"
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30"
                    />
                    {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
                </div>

                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-sm border border-white/10 transition-colors">Cancel</button>
                    <button onClick={verify} disabled={checking}
                        className="flex-1 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                        {checking ? <><Loader2 size={14} className="animate-spin" /> Verifying...</> : '🗑 Confirm Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const Inventory = () => {
    const { allPackages, refreshPackages } = usePackages();
    const { addToast } = useToast();
    const packages = allPackages || [];
    const [loading, setLoading] = useState(false);
    const [currentPackage, setCurrentPackage] = useState(null);
    const [originalPackage, setOriginalPackage] = useState(null); // snapshot before editing
    const [showPackageForm, setShowPackageForm] = useState(false);
    const [showDepartureManager, setShowDepartureManager] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null); // pkg pending delete
    const [passwordAction, setPasswordAction] = useState(null); // { type: 'delete'|'emptyBin'|'permanentDelete', pkg?, onVerified }
    const [showBin, setShowBin] = useState(false);

    // Split live vs hidden (sort live first)
    const livePackages = packages.filter(p => !p.deletedAt && p.isVisible !== false);
    const hiddenPackages = packages.filter(p => !p.deletedAt && p.isVisible === false);
    const deletedPackages = packages.filter(p => !!p.deletedAt);

    // Auto-expire: deleted > 30 days are shown as expired
    const now = Date.now();
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    const recentlyDeleted = deletedPackages.filter(p => (now - p.deletedAt) < THIRTY_DAYS);
    const expiredDeleted = deletedPackages.filter(p => (now - p.deletedAt) >= THIRTY_DAYS);

    const handleMigratePackages = async () => {
        if (!window.confirm("Overwrite database with static data?")) return;
        setLoading(true);
        try {
            for (const pkg of staticPackages) {
                await setDoc(doc(db, 'packages', pkg.id), pkg);
            }
            await refreshPackages();
            alert("Reset successful!");
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const toggleVisibility = async (pkg, e) => {
        e.stopPropagation();
        try {
            await updateDoc(doc(db, 'packages', pkg.id), { isVisible: !pkg.isVisible });
            await refreshPackages();
        } catch (err) { alert('Failed to update visibility.'); }
    };

    // Step 1: user clicks delete → show confirm dialog
    // Step 2: user confirms → show password dialog
    // Step 3: password verified → soft delete

    const handleDeleteConfirmed = () => {
        const pkg = confirmDelete;
        setConfirmDelete(null);
        // Ask for password before soft-deleting
        setPasswordAction({
            type: 'delete',
            title: 'Password Required to Delete',
            message: `Deleting "${pkg.title}". Enter your login password to confirm.`,
            onVerified: async () => {
                setPasswordAction(null);
                try {
                    await updateDoc(doc(db, 'packages', pkg.id), { deletedAt: Date.now(), isVisible: false });
                    await refreshPackages();
                    addToast(`"${pkg.title}" moved to Bin.`, 'warning', 4000);
                } catch (err) { addToast('Failed to delete. Try again.', 'error'); }
            }
        });
    };

    const handleRestore = async (pkg) => {
        try {
            await updateDoc(doc(db, 'packages', pkg.id), { deletedAt: null });
            await refreshPackages();
            addToast(`"${pkg.title}" restored successfully!`, 'success', 3000);
        } catch (err) { addToast('Failed to restore.', 'error'); }
    };

    const handlePermanentDelete = (pkg) => {
        setPasswordAction({
            type: 'permanentDelete',
            title: 'Password Required — Permanent Delete',
            message: `This will permanently delete "${pkg.title}". This cannot be undone.`,
            onVerified: async () => {
                setPasswordAction(null);
                try {
                    await deleteDoc(doc(db, 'packages', pkg.id));
                    await refreshPackages();
                    addToast(`"${pkg.title}" permanently deleted.`, 'warning', 4000);
                } catch (err) { addToast('Failed to delete permanently.', 'error'); }
            }
        });
    };

    const handleEmptyBin = () => {
        const total = recentlyDeleted.length + expiredDeleted.length;
        setPasswordAction({
            type: 'emptyBin',
            title: 'Password Required — Empty Bin',
            message: `This will permanently delete all ${total} packages in the bin. This cannot be undone.`,
            onVerified: async () => {
                setPasswordAction(null);
                try {
                    for (const pkg of [...recentlyDeleted, ...expiredDeleted]) {
                        await deleteDoc(doc(db, 'packages', pkg.id));
                    }
                    await refreshPackages();
                    addToast(`Bin emptied — ${total} packages permanently deleted.`, 'warning', 4000);
                } catch (err) { addToast('Failed to empty bin.', 'error'); }
            }
        });
    };

    const handleSavePackage = async (packageData) => {
        setLoading(true);
        const isNew = !originalPackage?.id;

        // Check for no changes on existing packages
        if (!isNew && !hasChanges(originalPackage, packageData)) {
            addToast('No changes detected — nothing was updated.', 'warning', 4000);
            setLoading(false);
            setShowPackageForm(false);
            setCurrentPackage(null);
            setOriginalPackage(null);
            return;
        }

        try {
            let pkgId = packageData.id;
            if (!pkgId) pkgId = packageData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            await setDoc(doc(db, 'packages', pkgId), { ...packageData, id: pkgId }, { merge: true });
            await refreshPackages();
            setShowPackageForm(false);
            setCurrentPackage(null);
            setOriginalPackage(null);
            addToast(
                isNew ? '✅ Package created successfully!' : '✅ Changes saved — package updated on site!',
                'success', 4000
            );
        } catch (err) {
            addToast('❌ Changes could not be saved. Please try again.', 'error', 5000);
        } finally {
            setLoading(false);
        }
    };

    const PackageCard = ({ pkg }) => (
        <div className={`glass-card group rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${pkg.isVisible === false ? 'border-red-500/30 opacity-75 hover:opacity-95 hover:shadow-red-500/10' : 'border-white/10 hover:border-white/20 hover:shadow-purple-500/10'}`}>
            <div className="h-44 relative overflow-hidden">
                <img src={pkg.image} alt={pkg.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                {/* Visibility badge */}
                <div className="absolute top-3 left-3">
                    <button onClick={(e) => toggleVisibility(pkg, e)}
                        title={pkg.isVisible === false ? 'Hidden — click to publish' : 'Live — click to hide'}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold backdrop-blur-md border transition-all hover:scale-105 ${pkg.isVisible === false ? 'bg-red-600/80 border-red-500/40 text-white' : 'bg-green-600/80 border-green-500/40 text-white'}`}>
                        {pkg.isVisible === false ? <><EyeOff size={11} /> Hidden</> : <><Eye size={11} /> Live</>}
                    </button>
                </div>
                <div className="absolute top-3 right-3">
                    <span className="bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold text-white border border-white/10 flex items-center gap-1">
                        <Zap size={10} className="text-yellow-400" fill="currentColor" /> Dynamic Pricing On
                    </span>
                </div>
                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                    <h3 className="text-base font-bold text-white leading-tight drop-shadow-md pr-2">{pkg.title}</h3>
                    <div className="flex flex-col items-end flex-shrink-0">
                        <span className="text-[10px] text-slate-300 mb-0.5">Selling Price</span>
                        <span className="bg-blue-600/90 backdrop-blur-md px-2 py-1 rounded-md text-xs font-bold text-white shadow-lg">₹{pkg.price?.toLocaleString()}</span>
                    </div>
                </div>
            </div>
            <div className="p-4 bg-white/5 space-y-3">
                <div className="flex justify-between text-sm text-slate-400">
                    <span className="flex items-center gap-1"><Calendar size={14} /> {pkg.batchDates?.length || pkg.availableDates?.length || 0} Dates</span>
                    <span className="flex items-center gap-1"><Users size={14} /> {pkg.maxGroupSize || pkg.maxSeats || 12} Seats</span>
                </div>
                {pkg.costPrice && (
                    <div className="text-xs text-slate-500 flex justify-between border-t border-white/5 pt-2">
                        <span>Cost: ₹{parseInt(pkg.costPrice).toLocaleString()}</span>
                        <span className="text-green-500">Margin: {Math.round(((pkg.price - pkg.costPrice) / pkg.price) * 100)}%</span>
                    </div>
                )}
                <div className="pt-3 border-t border-white/5 flex gap-2">
                    <button onClick={() => { setCurrentPackage(pkg); setShowDepartureManager(true); }}
                        className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium text-white transition-colors flex items-center justify-center gap-2 border border-white/5">
                        <Calendar size={14} /> Dates
                    </button>
                    <button onClick={() => { const c = { ...pkg, title: `${pkg.title} (Copy)`, id: null }; delete c.id; setCurrentPackage(c); setShowPackageForm(true); }}
                        className="px-3 py-2 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-600/20 rounded-lg transition-colors flex items-center justify-center" title="Duplicate">
                        <Copy size={14} />
                    </button>
                    <button onClick={() => { setCurrentPackage(pkg); setOriginalPackage(JSON.parse(JSON.stringify(pkg))); setShowPackageForm(true); }}
                        className="flex-1 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-600/20 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                        <Edit size={14} /> Edit
                    </button>
                    <button onClick={() => setConfirmDelete(pkg)}
                        className="px-3 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-600/20 rounded-lg transition-colors flex items-center justify-center" title="Delete">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        </div>
    );

    const totalDeleted = recentlyDeleted.length + expiredDeleted.length;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white/5 p-6 rounded-2xl border border-white/10 gap-4">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2"><Package className="text-purple-400" /> Package Inventory</h3>
                    <p className="text-slate-400 text-sm">Manage pricing, availability and trip details.</p>
                </div>
                <div className="flex gap-3">
                    {totalDeleted > 0 && (
                        <button onClick={() => setShowBin(!showBin)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border flex items-center gap-2 ${showBin ? 'bg-red-600/20 border-red-500/30 text-red-300' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}>
                            <Trash2 size={16} /> Bin ({totalDeleted})
                        </button>
                    )}
                    <button onClick={handleMigratePackages} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-sm font-medium transition-colors border border-white/10 flex items-center gap-2">
                        <Database size={16} /> Reset
                    </button>
                    <button onClick={() => { setCurrentPackage(null); setShowPackageForm(true); }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2">
                        <Plus size={16} /> Add Package
                    </button>
                </div>
            </div>

            {/* BIN */}
            {showBin && totalDeleted > 0 && (
                <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-red-300 font-bold flex items-center gap-2"><Trash2 size={16} /> Recently Deleted ({totalDeleted})</h4>
                        <button onClick={handleEmptyBin} className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-300 rounded-lg text-xs font-medium transition-colors">
                            🗑 Empty Bin
                        </button>
                    </div>
                    <p className="text-xs text-slate-500">Packages are permanently deleted after 30 days. You can restore them before that.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {[...recentlyDeleted, ...expiredDeleted].map(pkg => {
                            const daysLeft = Math.max(0, Math.ceil((THIRTY_DAYS - (now - pkg.deletedAt)) / 86400000));
                            const isExpired = daysLeft === 0;
                            return (
                                <div key={pkg.id} className={`rounded-xl overflow-hidden border ${isExpired ? 'border-red-600/40 opacity-50' : 'border-red-500/20'} bg-black/20`}>
                                    <div className="h-28 relative overflow-hidden">
                                        <img src={pkg.image} alt={pkg.title} className="w-full h-full object-cover opacity-50 grayscale" />
                                        <div className="absolute inset-0 bg-black/50" />
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <p className="text-white font-bold text-sm text-center px-2">{pkg.title}</p>
                                            <p className={`text-xs mt-1 ${isExpired ? 'text-red-400' : 'text-slate-400'}`}>
                                                {isExpired ? '⚠️ Expired' : `🗓 ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-3 flex gap-2">
                                        {!isExpired && (
                                            <button onClick={() => handleRestore(pkg)}
                                                className="flex-1 py-1.5 bg-green-600/10 hover:bg-green-600/20 text-green-400 border border-green-600/20 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1">
                                                <RotateCcw size={12} /> Restore
                                            </button>
                                        )}
                                        <button onClick={() => handlePermanentDelete(pkg)}
                                            className="flex-1 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-600/20 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1">
                                            <Trash2 size={12} /> Delete Forever
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* LIVE PACKAGES */}
            {livePackages.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-sm font-semibold text-green-400">Live Packages ({livePackages.length})</span>
                        <div className="flex-1 h-px bg-green-500/20"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {livePackages.map(pkg => <PackageCard key={pkg.id} pkg={pkg} />)}
                    </div>
                </div>
            )}

            {/* HIDDEN PACKAGES */}
            {hiddenPackages.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className="text-sm font-semibold text-red-400">Hidden Packages ({hiddenPackages.length})</span>
                        <div className="flex-1 h-px bg-red-500/20"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {hiddenPackages.map(pkg => <PackageCard key={pkg.id} pkg={pkg} />)}
                    </div>
                </div>
            )}

            {/* Step 1: Confirm delete */}
            {confirmDelete && (
                <ConfirmDialog
                    message={`Are you sure you want to delete "${confirmDelete.title}"? It will be moved to the Bin and permanently deleted after 30 days.`}
                    onConfirm={handleDeleteConfirmed}
                    onCancel={() => setConfirmDelete(null)}
                />
            )}

            {/* Step 2: Password verification */}
            {passwordAction && (
                <PasswordDialog
                    title={passwordAction.title}
                    message={passwordAction.message}
                    onVerified={passwordAction.onVerified}
                    onCancel={() => setPasswordAction(null)}
                />
            )}

            {/* PACKAGE FORM MODAL */}
            {showPackageForm && (
                <AdminPackageForm
                    initialData={currentPackage}
                    onSave={handleSavePackage}
                    onCancel={() => { setShowPackageForm(false); setCurrentPackage(null); setOriginalPackage(null); }}
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
