import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Shield, Mail, Phone, Loader } from 'lucide-react';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const AddStaffModal = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: 'operations' // internal default
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Handle name inputs: only alphabets, Title Case
    const handleNameChange = (e) => {
        const { name, value } = e.target;
        // Allow only alphabets and spaces
        if (/^[a-zA-Z\s]*$/.test(value)) {
            // Capitalize first letter, rest lowercase
            const formattedValue = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
            setFormData({ ...formData, [name]: formattedValue });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // In a real app with Blaze plan, we would call a Cloud Function here to create the Auth user.
            // DO NOT create auth users directly from client for other people (security risk if open).
            // However, we can create a "Invite" document in Firestore that triggers a function, 
            // OR for this MVP, just add to a 'staff_invites' collection that the Admin manually processes or a function picks up.

            // Simulating the Cloud Function call via a Firestore write for now (or placeholder).
            // When functions are deployed, replacing this with: 
            // const createStaff = httpsCallable(functions, 'createStaffAccount');
            // await createStaff(formData);

            await addDoc(collection(db, 'staff_invites'), {
                name: `${formData.firstName} ${formData.lastName}`.trim(),
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                role: formData.role,
                status: 'pending',
                invitedBy: 'Admin', // In real app, use currentUser.uid
                createdAt: serverTimestamp()
            });

            // Mock success for UI
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1000);

        } catch (err) {
            console.error(err);
            setError("Failed to create invitation. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass-card rounded-2xl shadow-2xl max-w-md w-full border border-white/10 bg-[#111] overflow-hidden"
            >
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <UserPlus className="text-blue-400" size={20} /> Add New Staff
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} className="text-slate-400 hover:text-white" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-400 uppercase">First Name</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="firstName"
                                    required
                                    value={formData.firstName}
                                    onChange={handleNameChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-blue-500 transition-colors pl-10"
                                    placeholder="Enter First Name"
                                />
                                <UserPlus size={16} className="absolute left-3 top-3.5 text-slate-500" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-400 uppercase">Last Name</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="lastName"
                                    required
                                    value={formData.lastName}
                                    onChange={handleNameChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-blue-500 transition-colors pl-10"
                                    placeholder="Enter Last Name"
                                />
                                <UserPlus size={16} className="absolute left-3 top-3.5 text-slate-500" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400 uppercase">Email Address</label>
                        <div className="relative">
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-blue-500 transition-colors pl-10"
                                placeholder="Enter your email"
                            />
                            <Mail size={16} className="absolute left-3 top-3.5 text-slate-500" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400 uppercase">Phone (Optional)</label>
                        <div className="phone-input-dark">
                            <PhoneInput
                                country={'in'}
                                value={formData.phone}
                                onChange={(value) => setFormData({ ...formData, phone: value })}
                                enableSearch={true}
                                searchPlaceholder="Search country..."
                                inputStyle={{
                                    width: '100%',
                                    height: '48px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '0.5rem',
                                    color: 'white',
                                    paddingLeft: '48px',
                                    fontSize: '1rem'
                                }}
                                buttonStyle={{
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '0.5rem 0 0 0.5rem',
                                    paddingLeft: '8px'
                                }}
                                dropdownStyle={{
                                    backgroundColor: '#1e293b',
                                    color: 'white',
                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400 uppercase">Assign Role</label>
                        <div className="grid grid-cols-2 gap-3">
                            {['admin', 'operations', 'finance', 'guide'].map((role) => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role })}
                                    className={`py-2 px-3 rounded-lg border text-sm font-medium capitalize transition-all ${formData.role === role
                                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25'
                                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                                        }`}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                            <Shield size={10} />
                            {formData.role === 'admin' ? 'Full Access to all modules.' :
                                formData.role === 'operations' ? 'Can manage trips, drivers, and bookings.' :
                                    formData.role === 'finance' ? 'Access to payments and invoices only.' :
                                        'Limited access for trip guides.'}
                        </p>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader className="animate-spin" size={20} /> : 'Send Invite'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default AddStaffModal;
