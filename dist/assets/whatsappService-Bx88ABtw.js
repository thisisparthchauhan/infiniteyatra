const n="919265799325",s=(e,t)=>{const o=e.replace(/\D/g,""),a=`https://wa.me/${o.startsWith("91")?o:`91${o}`}?text=${encodeURIComponent(t)}`;window.open(a,"_blank")},l=e=>{const t=`🔔 *New Hotel Inquiry — IY*

Guest: ${e.clientName}
Phone: ${e.clientPhone}
Hotel: ${e.hotelName}
Room: ${e.roomType}
Dates: ${e.checkIn} → ${e.checkOut} (${e.nights} night${e.nights>1?"s":""})
Amount: ₹${e.totalAmount?.toLocaleString()}
Ref: ${e.refId}

Open admin: https://infiniteyatra.com/admin`;s(n,t)},h=(e,t)=>`✅ *Booking Confirmed — Infinite Yatra*

Dear ${e.clientName},

Your hotel booking has been confirmed! 🎉

*Booking Details:*
📍 Hotel: ${e.hotelName}${e.hotelCity?`, ${e.hotelCity}`:""}
🛏️ Room: ${e.roomType}
📅 Check-in: ${e.checkIn}
📅 Check-out: ${e.checkOut}
👥 Guests: ${e.guests}
🔖 Ref: ${e.refId}

*Payment:*
Total Amount: ₹${e.totalAmount?.toLocaleString()}
${t?`Payment Link: ${t}`:"Please pay via UPI to: 9265799325@paytm"}

Please complete payment to secure your booking.

Need help? Reply to this message anytime.
— Team Infinite Yatra 🌍`,m=e=>`🎫 *Booking Voucher — Infinite Yatra*

Dear ${e.clientName}, your booking is fully confirmed!

*Ref: ${e.refId}*
🏨 ${e.hotelName}
📅 ${e.checkIn} → ${e.checkOut}
🛏️ ${e.roomType}

Please show this message at hotel check-in.
Check-in time: 2:00 PM | Check-out: 12:00 PM

Have an amazing stay! 🌟
— Infinite Yatra`,$=e=>`❌ *Booking Cancelled — Infinite Yatra*

Dear ${e.clientName},

We're sorry to inform you that your booking has been cancelled.

Ref: ${e.refId}
Hotel: ${e.hotelName}
Dates: ${e.checkIn} → ${e.checkOut}

If you'd like to rebook or have questions, please don't hesitate to reach out.

— Team Infinite Yatra`;export{m as a,h as b,$ as c,l as n,s};
