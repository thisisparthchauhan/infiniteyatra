import React from 'react';
import { MessageCircle } from 'lucide-react';

const WhatsAppBookingButton = ({ packageTitle, price, mobile = false }) => {
    const phoneNumber = "919265799325"; // Infinite Yatra official number
    const message = encodeURIComponent(
        `Hi, I'm interested in booking *${packageTitle}* (Price: ₹${price}). \n\nCan you please share more details and availability?`
    );
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

    const handleClick = () => {
        window.open(whatsappUrl, '_blank');
    };

    if (mobile) {
        return (
            <button
                onClick={handleClick}
                className="w-full bg-green-500 hover:bg-green-600 text-white p-3 rounded-xl font-bold shadow-lg shadow-green-500/30 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
                <MessageCircle size={20} className="fill-white text-white" />
                WhatsApp
            </button>
        );
    }

    return (
        <button
            onClick={handleClick}
            className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white px-6 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 flex items-center justify-center gap-3 group"
        >
            <MessageCircle size={24} className="group-hover:scale-110 transition-transform fill-white text-white" />
            <span>Book via WhatsApp</span>
        </button>
    );
};

export default WhatsAppBookingButton;
