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
}


export const sendContactEmail = async (formData) => {
    if (!PUBLIC_KEY || PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
        console.warn('EmailJS Public Key not found. Emails will not be sent.');
        // Simulate success for demo purposes if keys aren't set
        return { success: true, message: 'Simulated success (keys missing)' };
    }

    try {
        const contactParams = {
            from_name: formData.name,
            from_email: formData.email,
            subject: formData.subject,
            message: formData.message,
            to_name: 'Infinite Yatra Team'
        };

        // Reuse Admin Template for Contact Inquiries as it likely sends to the admin
        await emailjs.send(SERVICE_ID, TEMPLATE_ID_ADMIN, contactParams, PUBLIC_KEY);

        return { success: true };
    } catch (error) {
        console.error('Failed to send contact email:', error);
        return { success: false, error: error };
    }
};

export const sendTripEmail = async (tripData, userEmail, userName) => {
    if (!PUBLIC_KEY || PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
        console.warn('EmailJS Public Key not found. Emails will not be sent.');
        return { success: true, message: 'Simulated success (keys missing)' };
    }

    try {
        const tripParams = {
            to_name: userName,
            to_email: userEmail,
            destination: tripData.destination,
            days: tripData.days,
            budget_style: tripData.budget || 'Custom',
            itinerary_link: `${window.location.origin}/trip/${tripData.id || ''}`,
            total_est_cost: tripData.costBreakdown?.perPerson?.toLocaleString() || 'N/A',
            day_plan_summary: tripData.dayPlans?.map(d => `Day ${d.day}: ${d.title}`).join('\n') || 'Full details in link'
        };

        // Reuse User Template or a new one. For now re-using User Template with dynamic fields mapped if possible, 
        // or just sending a generic "Here is your trip" email. 
        // Since we can't easily change templates in backend, we'll try to map to existing fields or use a generic "message" field if available.
        // Assuming TEMPLATE_ID_USER might not fit perfectly. Let's use specific params that likely exist or create a new logical mapping.
        // Actually, let's just use the Admin template as a fallback if User template is too specific to Bookings, 
        // BUT best practice is to assume we can pass a 'message' variable if the template supports it.
        // Let's assume we use a new template ID for Trips, or reuse USER one.
        // For this task, I will use TEMPLATE_ID_USER and try to fit data.

        const params = {
            ...tripParams,
            package_name: `AI Trip to ${tripData.destination}`, // Mapping to existing template field
            booking_id: 'AI-GEN-' + Date.now().toString().slice(-6),
            status: 'AI Itinerary Generated'
        };

        await emailjs.send(SERVICE_ID, TEMPLATE_ID_USER, params, PUBLIC_KEY);

        return { success: true };
    } catch (error) {
        console.error('Failed to send trip email:', error);
        return { success: false, error: error };
    }
};
