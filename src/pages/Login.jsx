import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const Login = () => {
    const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'phone'
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login, loginWithPhone } = useAuth();
    const navigate = useNavigate();

    // Validate email format
    const validateEmail = (email) => {
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (loginMethod === 'email') {
                // Validate email format
                if (!validateEmail(email)) {
                    setError('Please enter a valid email address');
                    setLoading(false);
                    return;
                }
                await login(email, password);
            } else {
                // Login with phone number
                await loginWithPhone(phone, password);
            }
            navigate('/');
        } catch (err) {
            console.error(err);
            let errorMessage = 'Failed to log in.';

            if (err.message && err.message.includes('Phone number not registered')) {
                errorMessage = 'Phone number not registered. Please sign up first.';
            } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                errorMessage = loginMethod === 'email'
                    ? 'Incorrect email or password.'
                    : 'Incorrect phone number or password.';
            } else if (err.code === 'auth/too-many-requests') {
                errorMessage = 'Too many failed attempts. Please try again later.';
            }
            setError(errorMessage);
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative">
            <SEO
                title="Login"
                description="Login to your Infinite Yatra account to manage your bookings and preferences."
                url="/login"
            />
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop"
                    alt="Background"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40" />
            </div>

            <div className="relative z-10 w-full max-w-md bg-white p-8 rounded-2xl shadow-xl mx-4">
                <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-6 transition-colors">
                    <ArrowLeft size={20} /> Back to Home
                </Link>

                <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h2>
                <p className="text-slate-500 mb-8">Please enter your details to sign in.</p>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Login Method Toggle */}
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-lg mb-6">
                        <button
                            type="button"
                            onClick={() => setLoginMethod('email')}
                            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${loginMethod === 'email'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            Email
                        </button>
                        <button
                            type="button"
                            onClick={() => setLoginMethod('phone')}
                            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${loginMethod === 'phone'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            Phone Number
                        </button>
                    </div>

                    {/* Email Input (shown when email method selected) */}
                    {loginMethod === 'email' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                            />
                        </div>
                    )}

                    {/* Phone Input (shown when phone method selected) */}
                    {loginMethod === 'phone' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                            <PhoneInput
                                country={'in'}
                                value={phone}
                                onChange={setPhone}
                                inputStyle={{
                                    width: '100%',
                                    height: '48px',
                                    fontSize: '16px',
                                    paddingLeft: '48px',
                                    borderRadius: '0.5rem',
                                    border: '1px solid #e2e8f0'
                                }}
                                containerStyle={{
                                    width: '100%'
                                }}
                                buttonStyle={{
                                    borderRadius: '0.5rem 0 0 0.5rem',
                                    border: '1px solid #e2e8f0'
                                }}
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 z-10 cursor-pointer p-1"
                                title={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" /></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Signing In...
                            </>
                        ) : (
                            "Sign In"
                        )}
                    </button>
                </form>

                <p className="mt-6 text-center text-slate-500">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-blue-600 font-bold hover:underline">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
