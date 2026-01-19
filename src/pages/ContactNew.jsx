import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, Instagram } from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { sendContactEmail } from '../services/email';
import { useToast } from '../context/ToastContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const ContactNew = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null);
    const { addToast } = useToast();

    // Handle generic text inputs
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // Handle Name Inputs (Alphabets only, Title Case)
    const handleNameChange = (e) => {
        const { name, value } = e.target;
        // Allow only alphabets and spaces
        if (/^[a-zA-Z\s]*$/.test(value)) {
            // Capitalize first letter, rest lowercase
            const formattedValue = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
            setFormData({
                ...formData,
                [name]: formattedValue
            });
        }
    };

    const handlePhoneChange = (value) => {
        setFormData({ ...formData, mobile: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const fullName = `${formData.firstName} ${formData.lastName}`.trim();
        // Prepare data for submission
        // Mapping mobile to 'subject' for email service compatibility as per previous logic, 
        // or just sending it as part of the payload.
        const submissionData = {
            name: fullName,
            email: formData.email,
            subject: `Enquiry from ${fullName} (${formData.mobile})`, // Better subject than just phone
            message: formData.message,
            mobile: formData.mobile, // Store separate proper mobile too
            firstName: formData.firstName,
            lastName: formData.lastName
        };

        try {
            // 1. Save to Firestore
            await addDoc(collection(db, 'enquiries'), {
                ...submissionData,
                timestamp: serverTimestamp(),
                status: 'new'
            });

            // 2. Send Email
            // email.js expects { name, email, subject, message }
            const result = await sendContactEmail(submissionData);

            if (result.success) {
                console.log('Form submitted:', submissionData);
                setSubmitStatus('success');
                addToast('Message sent successfully!', 'success');
                setFormData({ firstName: '', lastName: '', email: '', mobile: '', message: '' });
                setTimeout(() => setSubmitStatus(null), 5000);
            } else {
                console.error('Email submission failed');
                setSubmitStatus('error');
                addToast('Message saved, but email failed. We will contact you shortly.', 'warning');
            }
        } catch (error) {
            console.error('Submission failed:', error);
            setSubmitStatus('error');
            addToast(`Error: ${error.message || 'Failed to save data'}`, 'error');
        }

        setIsSubmitting(false);
    };

    return (
        <div className="min-h-screen bg-black pt-20">
            {/* Hero Section */}
            <div className="relative py-24 overflow-hidden">
                {/* Background Glows */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] pointer-events-none"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] pointer-events-none"></div>

                <div className="relative container mx-auto px-6 text-center z-10">
                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">Get In Touch</h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        Have questions about your next adventure? We'd love to hear from you.
                        Send us a message and we'll respond as soon as possible.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-6 py-12 -mt-10 relative z-10 pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Contact Info Cards */}
                    <div className="space-y-6">
                        {/* Contact Details */}
                        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
                            <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                                <span className="p-3 bg-white/10 rounded-xl text-blue-400">
                                    <Phone size={24} />
                                </span>
                                Infinite Yatra Contact Details
                            </h3>

                            <div className="space-y-8">
                                <div className="flex items-start gap-4 group">
                                    <div className="p-3 bg-white/5 rounded-xl text-slate-400 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-colors">
                                        <Phone size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500 mb-1 uppercase tracking-wider font-medium">Call Us</p>
                                        <a href="tel:+919265799325" className="text-white text-lg font-medium hover:text-blue-400 transition-colors">
                                            +91 9265799325
                                        </a>
                                        <p className="text-sm text-slate-500 mt-1">Mon-Sat, 9am - 8pm</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 group">
                                    <div className="p-3 bg-white/5 rounded-xl text-slate-400 group-hover:text-purple-400 group-hover:bg-purple-500/10 transition-colors">
                                        <Mail size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500 mb-1 uppercase tracking-wider font-medium">Email Us</p>
                                        <a href="mailto:infiniteyatra@gmail.com" className="text-white text-lg font-medium hover:text-purple-400 transition-colors break-all">
                                            infiniteyatra@gmail.com
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 group">
                                    <div className="p-3 bg-white/5 rounded-xl text-slate-400 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-colors">
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500 mb-1 uppercase tracking-wider font-medium">Visit Us</p>
                                        <p className="text-white font-medium leading-relaxed">
                                            Infinite Yatra HQ<br />
                                            Ahmedabad, Gujarat<br />
                                            India
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl text-center">
                            <h3 className="text-xl font-bold text-white mb-6">Connect With Us</h3>
                            <div className="flex justify-center gap-4">
                                <a href="https://x.com/infiniteyatra" target="_blank" rel="noopener noreferrer" className="p-4 bg-white/5 rounded-2xl text-slate-400 hover:bg-black hover:text-white border border-white/5 hover:border-white/20 transition-all duration-300">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                                </a>
                                <a href="https://www.instagram.com/infinite.yatra/" target="_blank" rel="noopener noreferrer" className="p-4 bg-white/5 rounded-2xl text-slate-400 hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-600 hover:text-white border border-white/5 hover:border-white/20 transition-all duration-300">
                                    <Instagram size={24} />
                                </a>
                                <a href="https://www.whatsapp.com/channel/0029VbBX7rv3gvWStqSdXf08" target="_blank" rel="noopener noreferrer" className="p-4 bg-white/5 rounded-2xl text-slate-400 hover:bg-green-600 hover:text-white border border-white/5 hover:border-white/20 transition-all duration-300">
                                    <Phone size={24} />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 lg:p-12 border border-white/10 h-full shadow-2xl">

                            {submitStatus === 'success' && (
                                <div className="mb-8 p-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl flex items-center gap-3 animate-fadeIn">
                                    <div className="p-2 bg-emerald-500/20 rounded-full"><Send size={16} /></div>
                                    <span className="font-medium">Message sent successfully! We'll be in touch soon.</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* First Name */}
                                    <div className="space-y-3">
                                        <label htmlFor="firstName" className="text-sm font-semibold text-slate-300 ml-1">First Name <span className="text-blue-500">*</span></label>
                                        <input
                                            type="text"
                                            id="firstName"
                                            name="firstName"
                                            required
                                            value={formData.firstName}
                                            onChange={handleNameChange}
                                            className="w-full pl-6 pr-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:bg-white/10 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                                            placeholder="Enter your first name"
                                        />
                                    </div>

                                    {/* Last Name */}
                                    <div className="space-y-3">
                                        <label htmlFor="lastName" className="text-sm font-semibold text-slate-300 ml-1">Last Name <span className="text-blue-500">*</span></label>
                                        <input
                                            type="text"
                                            id="lastName"
                                            name="lastName"
                                            required
                                            value={formData.lastName}
                                            onChange={handleNameChange}
                                            className="w-full pl-6 pr-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:bg-white/10 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                                            placeholder="Enter your last name"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Email */}
                                    <div className="space-y-3">
                                        <label htmlFor="email" className="text-sm font-semibold text-slate-300 ml-1">Email <span className="text-blue-500">*</span></label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full pl-6 pr-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:bg-white/10 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                                            placeholder="Enter your email"
                                        />
                                    </div>

                                    {/* Mobile Number */}
                                    <div className="space-y-3">
                                        <label htmlFor="mobile" className="text-sm font-semibold text-slate-300 ml-1">Mobile Number</label>
                                        <div className="phone-input-dark">
                                            <PhoneInput
                                                country={'in'}
                                                value={formData.mobile}
                                                onChange={handlePhoneChange}
                                                enableSearch={true}
                                                searchPlaceholder="Search country..."
                                                inputStyle={{
                                                    width: '100%',
                                                    height: '58px', // Matching py-4 approx which is ~56-60px total height
                                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                    borderRadius: '0.75rem',
                                                    color: 'white',
                                                    paddingLeft: '48px',
                                                    fontSize: '1rem'
                                                }}
                                                buttonStyle={{
                                                    backgroundColor: 'transparent',
                                                    border: 'none',
                                                    borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                                                    borderRadius: '0.75rem 0 0 0.75rem',
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
                                </div>

                                {/* Message */}
                                <div className="space-y-3">
                                    <label htmlFor="message" className="text-sm font-semibold text-slate-300 ml-1">Your Message <span className="text-blue-500">*</span></label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        required
                                        rows="6"
                                        value={formData.message}
                                        onChange={handleChange}
                                        className="w-full pl-6 pr-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:bg-white/10 focus:ring-1 focus:ring-blue-500 transition-all outline-none resize-none leading-relaxed"
                                        placeholder="Tell us about your travel plans or any questions you have..."
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`
                                        w-full bg-white/10 hover:bg-white/20 border border-white/10
                                        text-white font-bold py-5 rounded-xl shadow-xl backdrop-blur-sm
                                        transition-all duration-300 transform hover:-translate-y-1
                                        flex items-center justify-center gap-3 text-lg
                                        ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}
                                    `}
                                >
                                    {isSubmitting ? (
                                        <>Processing...</>
                                    ) : (
                                        <>
                                            Send Message
                                            <Send size={20} />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactNew;
