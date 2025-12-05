import emailjs from '@emailjs/browser';

// Initialize EmailJS with your Public Key
// You can find this in your EmailJS Account > Account > API Keys
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'YOUR_PUBLIC_KEY';
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'YOUR_SERVICE_ID';
const TEMPLATE_ID_USER = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_USER || 'YOUR_USER_TEMPLATE_ID';
const TEMPLATE_ID_ADMIN = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_ADMIN || 'YOUR_ADMIN_TEMPLATE_ID';

export const sendBookingEmails = async (bookingData) => {
    if (!PUBLIC_KEY || PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
        console.warn('EmailJS Public Key not found. Emails will not be sent.');
        return { success: false, message: 'Configuration missing' };
    }

    try {
        // 1. Send Confirmation to User
        const userParams = {
            to_name: bookingData.contactName,
            to_email: bookingData.contactEmail,
            booking_id: bookingData.id,
            package_name: bookingData.packageTitle,
            travel_date: bookingData.bookingDate,
            travelers: bookingData.travelers,
            total_price: bookingData.totalPrice,
            status: 'Pending Confirmation'
        };

        await emailjs.send(SERVICE_ID, TEMPLATE_ID_USER, userParams, PUBLIC_KEY);

        // 2. Send Alert to Admin
        const adminParams = {
            admin_email: 'chauhanparth165@gmail.com', // Or fetch from env
            customer_name: bookingData.contactName,
            customer_email: bookingData.contactEmail,
            customer_phone: bookingData.contactPhone,
            booking_id: bookingData.id,
            package_name: bookingData.packageTitle,
            travel_date: bookingData.bookingDate,
            travelers: bookingData.travelers,
            total_price: bookingData.totalPrice,
            special_requests: bookingData.specialRequests || 'None'
        };

        await emailjs.send(SERVICE_ID, TEMPLATE_ID_ADMIN, adminParams, PUBLIC_KEY);

        return { success: true };
    } catch (error) {
        console.error('Failed to send emails:', error);
        return { success: false, error: error };
    }
};
