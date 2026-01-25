/**
 * Payment Service
 * Handles Razorpay interactions and Backend calls
 */

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

// URL of your Firebase Cloud Functions
// When running locally with emulators: http://localhost:5001/YOUR_PROJECT_ID/us-central1/api
// When deployed: https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/api
const API_BASE_URL = 'https://us-central1-infiniteyatra-iy.cloudfunctions.net/api'; // Updated path

export const PaymentService = {
    /**
     * Initiate a Payment
     * @param {Object} bookingDetails - { id, amount, user: { name, email, phone } }
     */
    initiatePayment: async (bookingDetails) => {
        const res = await loadRazorpayScript();

        if (!res) {
            alert('Razorpay SDK failed to load. Are you online?');
            return;
        }

        try {
            // 1. Create Order on Backend
            const response = await fetch(`${API_BASE_URL}/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: bookingDetails.amount,
                    bookingId: bookingDetails.id
                })
            });

            if (!response.ok) throw new Error('Failed to create order');
            const order = await response.json();

            // 2. Open Checkout
            const options = {
                key: "YOUR_RAZORPAY_KEY_ID", // Replace with actual Key ID or env var
                amount: order.amount,
                currency: order.currency,
                name: "Infinite Yatra",
                description: "Travel Booking",
                image: "/logo.png", // Add your logo path
                order_id: order.id,
                handler: async function (response) {
                    // 3. Verify Payment on Backend
                    const verifyRes = await fetch(`${API_BASE_URL}/verify-payment`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            bookingId: bookingDetails.id
                        })
                    });

                    const verifyData = await verifyRes.json();

                    if (verifyData.status === 'success' || verifyData.success) {
                        alert("Payment Successful!");
                        // Redirect to success page or callback
                        if (bookingDetails.onSuccess) bookingDetails.onSuccess();
                    } else {
                        alert("Payment verification failed. Please contact support.");
                    }
                },
                prefill: {
                    name: bookingDetails.user.name,
                    email: bookingDetails.user.email,
                    contact: bookingDetails.user.phone
                },
                theme: {
                    color: "#2563EB"
                }
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();

        } catch (error) {
            console.error("Payment Error:", error);
            alert("Something went wrong with the payment gateway.");
        }
    }
};
