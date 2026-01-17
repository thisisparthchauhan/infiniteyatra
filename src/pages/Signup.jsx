import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const Signup = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    // Capitalize first letter of each word
    const capitalizeFirstLetter = (str) => {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    // Validate name fields (alphabetic only, allow hyphens for last name)
    const validateName = (name, isLastName = false) => {
        // Allow alphabetic characters and hyphens (for last name only)
        const regex = isLastName ? /^[a-zA-Z-]+$/ : /^[a-zA-Z]+$/;
        return regex.test(name) || name === '';
    };

    // Handle name field changes with validation and auto-capitalization
    const handleNameChange = (e, isLastName = false) => {
        const { name, value } = e.target;

        // Remove any trailing spaces during typing
        const trimmedValue = value.trimStart();

        // Validate the input
        if (validateName(trimmedValue, isLastName)) {
            // Auto-capitalize first letter
            const capitalizedValue = trimmedValue ? capitalizeFirstLetter(trimmedValue) : '';
            setFormData({ ...formData, [name]: capitalizedValue });

            // Clear field error if valid
            setFieldErrors({ ...fieldErrors, [name]: '' });
        } else {
            // Set error message
            const errorMsg = isLastName
                ? 'Last name can only contain letters and hyphens'
                : 'First name can only contain letters';
            setFieldErrors({ ...fieldErrors, [name]: errorMsg });
        }
    };

    // Validate email format (only allow standard characters)
    const validateEmail = (email) => {
        // Allow: letters, numbers, dots, hyphens, underscores, @ and domain
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    };

    // Handle email change with validation
    const handleEmailChange = (e) => {
        const { value } = e.target;
        setFormData({ ...formData, email: value });

        // Validate email format
        if (value && !validateEmail(value)) {
            setFieldErrors({ ...fieldErrors, email: 'Please enter a valid email address (only letters, numbers, dots, hyphens, and underscores allowed)' });
        } else {
            setFieldErrors({ ...fieldErrors, email: '' });
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePhoneChange = (value) => {
        setFormData({ ...formData, phone: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});
        setLoading(true);

        // Trim all fields before validation
        const trimmedData = {
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            password: formData.password.trim(),
            confirmPassword: formData.confirmPassword.trim()
        };

        // Validate password confirmation
        if (trimmedData.password !== trimmedData.confirmPassword) {
            setFieldErrors({ confirmPassword: 'Passwords do not match' });
            setLoading(false);
            return;
        }

        // Validate names one more time
        if (!validateName(trimmedData.firstName)) {
            setFieldErrors({ firstName: 'First name can only contain letters' });
            setLoading(false);
            return;
        }

        if (!validateName(trimmedData.lastName, true)) {
            setFieldErrors({ lastName: 'Last name can only contain letters and hyphens' });
            setLoading(false);
            return;
        }

        try {
            const fullName = `${trimmedData.firstName} ${trimmedData.lastName}`;
            await signup(trimmedData.email, trimmedData.password, fullName, trimmedData.phone);
            navigate('/');
        } catch (err) {
            console.error(err);
            let errorMessage = 'Failed to create an account.';
            if (err.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already registered. Please log in instead.';
            } else if (err.code === 'auth/weak-password') {
                errorMessage = 'Password should be at least 6 characters.';
            } else if (err.code === 'auth/invalid-email') {
                errorMessage = 'Please enter a valid email address.';
            }
            setError(errorMessage);
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative">
            <SEO
                title="Sign Up"
                description="Create an account with Infinite Yatra to start planning your dream journey."
                url="/signup"
            />
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop"
                    alt="Background"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40" />
            </div>

            <div className="relative z-10 w-full max-w-md bg-white p-8 rounded-2xl shadow-xl mx-4 my-8">
                <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-6 transition-colors">
                    <ArrowLeft size={20} /> Back to Home
                </Link>

                <h2 className="text-3xl font-bold text-slate-900 mb-2">Create Account</h2>
                <p className="text-slate-500 mb-8">Start your journey with us today.</p>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                            <input
                                type="text"
                                name="firstName"
                                required
                                value={formData.firstName}
                                onChange={(e) => handleNameChange(e, false)}
                                placeholder="First name"
                                className={`w-full px-4 py-3 rounded-lg border ${fieldErrors.firstName ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-200'} focus:ring-2 outline-none transition-all`}
                            />
                            {fieldErrors.firstName && (
                                <p className="text-red-500 text-xs mt-1">{fieldErrors.firstName}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                            <input
                                type="text"
                                name="lastName"
                                required
                                value={formData.lastName}
                                onChange={(e) => handleNameChange(e, true)}
                                placeholder="Last name"
                                className={`w-full px-4 py-3 rounded-lg border ${fieldErrors.lastName ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-200'} focus:ring-2 outline-none transition-all`}
                            />
                            {fieldErrors.lastName && (
                                <p className="text-red-500 text-xs mt-1">{fieldErrors.lastName}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
                        <PhoneInput
                            country={'in'}
                            value={formData.phone}
                            onChange={handlePhoneChange}
                            inputStyle={{
                                width: '100%',
                                height: '48px',
                                fontSize: '16px',
                                paddingLeft: '48px',
                                borderRadius: '0.5rem',
                                border: fieldErrors.phone ? '1px solid #ef4444' : '1px solid #e2e8f0'
                            }}
                            containerStyle={{
                                width: '100%'
                            }}
                            buttonStyle={{
                                borderRadius: '0.5rem 0 0 0.5rem',
                                border: fieldErrors.phone ? '1px solid #ef4444' : '1px solid #e2e8f0'
                            }}
                        />
                        {fieldErrors.phone && (
                            <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleEmailChange}
                            placeholder="Enter your email"
                            className={`w-full px-4 py-3 rounded-lg border ${fieldErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-200'} focus:ring-2 outline-none transition-all`}
                        />
                        {fieldErrors.email && (
                            <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Create a password"
                                className={`w-full px-4 py-3 rounded-lg border ${fieldErrors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-200'} focus:ring-2 outline-none transition-all pr-10`}
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
                        {fieldErrors.password && (
                            <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="confirmPassword"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Re-enter your password"
                                className={`w-full px-4 py-3 rounded-lg border ${fieldErrors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-200'} focus:ring-2 outline-none transition-all pr-10`}
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
                        {fieldErrors.confirmPassword && (
                            <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>
                        )}
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Creating Account...
                            </>
                        ) : (
                            "Sign Up"
                        )}
                    </button>
                </form>

                <p className="mt-6 text-center text-slate-500">
                    Already have an account?{' '}
                    <Link to="/login" className="text-blue-600 font-bold hover:underline">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Signup;
