import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { Loader2, Lock, Mail, AlertTriangle, Building2 } from 'lucide-react';

const VendorLogin = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        if (!email || !password) { setError('Please fill in all fields.'); return; }

        setLoading(true);
        try {
            const cred = await signInWithEmailAndPassword(auth, email, password);
            
            // Check vendor status
            const vendorDoc = await getDoc(doc(db, 'hotel_vendors', cred.user.uid));
            if (!vendorDoc.exists()) {
                setError('This account is not registered as a hotel vendor. Please contact IY support.');
                setLoading(false);
                return;
            }

            const vendor = vendorDoc.data();
            if (vendor.status === 'suspended') {
                setError('Your account has been suspended. Contact IY support at +91 92657 99325.');
                setLoading(false);
                return;
            }

            navigate('/vendor/dashboard');
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                setError('Invalid email or password.');
            } else {
                setError('Login failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Building2 size={32} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Vendor Portal</h1>
                    <p className="text-sm text-zinc-500 mt-1">Infinite Yatra Hotel Partners</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="bg-[#111] border border-white/10 rounded-2xl p-8 space-y-5">
                    <div>
                        <label className="text-sm text-zinc-400 mb-2 block">Email</label>
                        <div className="relative">
                            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                                placeholder="vendor@email.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm text-zinc-400 mb-2 block">Password</label>
                        <div className="relative">
                            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2">
                            <AlertTriangle size={16} className="text-red-400 shrink-0" />
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:from-teal-600 hover:to-emerald-700 transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50"
                    >
                        {loading ? <><Loader2 size={18} className="animate-spin" /> Signing in...</> : 'Sign In'}
                    </button>
                </form>

                <p className="text-center text-xs text-zinc-600 mt-6">
                    Not a vendor? <Link to="/" className="text-teal-400 hover:underline">Go to Infinite Yatra</Link>
                </p>
                <p className="text-center text-xs text-zinc-600 mt-2">
                    Need help? <a href="https://wa.me/919265799325" className="text-teal-400 hover:underline">Contact Support</a>
                </p>
            </div>
        </div>
    );
};

export default VendorLogin;
