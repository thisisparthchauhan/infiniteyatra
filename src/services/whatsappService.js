/**
 * WhatsApp Notification Service for Infinite Yatra
 * Since we don't have a server backend, all WhatsApp messages are sent via wa.me links.
 */

const IY_ADMIN_PHONE = '919265799325';

export const sendWhatsAppNotification = (phone, message) => {
    const cleaned = phone.replace(/\D/g, '');
    const formatted = cleaned.startsWith('91') ? cleaned : `91${cleaned}`;
    const url = `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
};

export const notifyAdminNewInquiry = (inquiry) => {
    const msg = `🔔 *New Hotel Inquiry — IY*

Guest: ${inquiry.clientName}
Phone: ${inquiry.clientPhone}
Hotel: ${inquiry.hotelName}
Room: ${inquiry.roomType}
Dates: ${inquiry.checkIn} → ${inquiry.checkOut} (${inquiry.nights} night${inquiry.nights > 1 ? 's' : ''})
Amount: ₹${inquiry.totalAmount?.toLocaleString()}
Ref: ${inquiry.refId}

Open admin: https://infiniteyatra.com/admin`;

    sendWhatsAppNotification(IY_ADMIN_PHONE, msg);
};

export const buildConfirmationMessage = (inquiry, paymentLink) => {
    return `✅ *Booking Confirmed — Infinite Yatra*

Dear ${inquiry.clientName},

Your hotel booking has been confirmed! 🎉

*Booking Details:*
📍 Hotel: ${inquiry.hotelName}${inquiry.hotelCity ? `, ${inquiry.hotelCity}` : ''}
🛏️ Room: ${inquiry.roomType}
📅 Check-in: ${inquiry.checkIn}
📅 Check-out: ${inquiry.checkOut}
👥 Guests: ${inquiry.guests}
🔖 Ref: ${inquiry.refId}

*Payment:*
Total Amount: ₹${inquiry.totalAmount?.toLocaleString()}
${paymentLink ? `Payment Link: ${paymentLink}` : 'Please pay via UPI to: 9265799325@paytm'}

Please complete payment to secure your booking.

Need help? Reply to this message anytime.
— Team Infinite Yatra 🌍`;
};

export const buildVoucherMessage = (inquiry) => {
    return `🎫 *Booking Voucher — Infinite Yatra*

Dear ${inquiry.clientName}, your booking is fully confirmed!

*Ref: ${inquiry.refId}*
🏨 ${inquiry.hotelName}
📅 ${inquiry.checkIn} → ${inquiry.checkOut}
🛏️ ${inquiry.roomType}

Please show this message at hotel check-in.
Check-in time: 2:00 PM | Check-out: 12:00 PM

Have an amazing stay! 🌟
— Infinite Yatra`;
};

export const buildCancellationMessage = (inquiry) => {
    return `❌ *Booking Cancelled — Infinite Yatra*

Dear ${inquiry.clientName},

We're sorry to inform you that your booking has been cancelled.

Ref: ${inquiry.refId}
Hotel: ${inquiry.hotelName}
Dates: ${inquiry.checkIn} → ${inquiry.checkOut}

If you'd like to rebook or have questions, please don't hesitate to reach out.

— Team Infinite Yatra`;
};
