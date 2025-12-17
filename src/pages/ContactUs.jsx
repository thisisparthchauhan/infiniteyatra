import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, Instagram } from 'lucide-react';
import SEO from '../components/SEO';

const ContactUs = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call for now (we'll connect EmailJS later)
        await new Promise(resolve => setTimeout(resolve, 1500));

        console.log('Form submitted:', formData);
        setSubmitStatus('success');
        setIsSubmitting(false);
        setFormData({ name: '', email: '', subject: '', message: '' });

        setTimeout(() => setSubmitStatus(null), 5000);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <SEO
                title="Contact Us"
                description="Get in touch with Infinite Yatra. We are here to help you plan your perfect trip."
                url="/contact"
            />

            {/* Hero Section */}
            <div className="relative bg-slate-900 py-24">
                <div className="absolute inset-0 bg-blue-600/10"></div>
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1596386461350-326ea7750550?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
                <div className="relative container mx-auto px-6 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Get in Touch</h1>
                    <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                        Have questions about a package? Want a custom itinerary?
                        We're here to help you plan the trip of a lifetime.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-6 py-16 -mt-10 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Contact Info Cards */}
                    <div className="space-y-6">
                        {/* Contact Details */}
                        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
                            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <span className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                    <Phone size={20} />
                                </span>
                                Contact Details
                            </h3>

                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-slate-50 rounded-lg text-slate-600 mt-1">
                                        <Phone size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500 mb-1">Call Us</p>
                                        <a href="tel:+919265799325" className="text-slate-800 font-semibold hover:text-blue-600 transition-colors">
                                            +91 9265799325
                                        </a>
                                        <p className="text-xs text-slate-400 mt-1">Mon-Sat, 9am - 8pm</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-slate-50 rounded-lg text-slate-600 mt-1">
                                        <Mail size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500 mb-1">Email Us</p>
                                        <a href="mailto:infiniteyatra@gmail.com" className="text-slate-800 font-semibold hover:text-blue-600 transition-colors break-all">
                                            infiniteyatra@gmail.com
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-slate-50 rounded-lg text-slate-600 mt-1">
                                        <MapPin size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500 mb-1">Visit Us</p>
                                        <p className="text-slate-800 font-medium">
                                            Infinite Yatra HQ<br />
                                            Ahmedabad, Gujarat<br />
                                            India
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100 text-center">
                            <h3 className="text-xl font-bold text-slate-800 mb-6">Connect With Us</h3>
                            <div className="flex justify-center gap-4">
                                <a href="https://x.com/infiniteyatra" target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-50 rounded-full text-slate-600 hover:bg-black hover:text-white transition-all duration-300">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                                </a>
                                <a href="https://www.instagram.com/infinite.yatra/" target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-50 rounded-full text-slate-600 hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-600 hover:text-white transition-all duration-300">
                                    <Instagram size={20} />
                                </a>
                                <a href="https://www.whatsapp.com/channel/0029VbBX7rv3gvWStqSdXf08" target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-50 rounded-full text-slate-600 hover:bg-green-600 hover:text-white transition-all duration-300">
                                    <Phone size={20} />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-10 border border-slate-100 h-full">
                            <div className="mb-8">
                                <h1 className="text-3xl font-bold text-slate-900 mb-2">Send us a Message</h1>
                                <p className="text-slate-600">Fill out the form below and we'll get back to you within 24 hours.</p>
                            </div>

                            {submitStatus === 'success' && (
                                <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl flex items-center gap-2 animate-fadeIn">
                                    <div className="p-1 bg-green-100 rounded-full"><Send size={14} /></div>
                                    Message sent successfully! We'll be in touch soon.
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label htmlFor="name" className="text-sm font-semibold text-slate-700">Your Name</label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            required
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="email" className="text-sm font-semibold text-slate-700">Email Address</label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="subject" className="text-sm font-semibold text-slate-700">Subject</label>
                                    <input
                                        type="text"
                                        id="subject"
                                        name="subject"
                                        required
                                        value={formData.subject}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                                        placeholder="Inquiry about Kedarnath Trek"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="message" className="text-sm font-semibold text-slate-700">Message</label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        required
                                        rows="5"
                                        value={formData.message}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 transition-all outline-none resize-none"
                                        placeholder="Tell us about your travel plans..."
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`
                                        w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 
                                        text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/30 
                                        transition-all duration-300 transform hover:-translate-y-1
                                        flex items-center justify-center gap-2
                                        ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}
                                    `}
                                >
                                    {isSubmitting ? (
                                        <>Processing...</>
                                    ) : (
                                        <>
                                            Send Message
                                            <Send size={18} />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Map Section */}
                <div className="mt-16 bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
                    <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d117506.96543787766!2d72.48911585805562!3d23.019996818380896!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395e848aba5bd449%3A0x4fcedd11614f6516!2sAhmedabad%2C%20Gujarat!5e0!3m2!1sen!2sin!4v1709462829289!5m2!1sen!2sin"
                        width="100%"
                        height="400"
                        style={{ border: 0 }}
                        allowFullScreen=""
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Infinite Yatra Location"
                    ></iframe>
                </div>
            </div>
        </div>
    );
};

export default ContactUs;
