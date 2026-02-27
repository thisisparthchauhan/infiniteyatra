import { db } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Loads the Razorpay SDK script dynamically.
 */
export const loadRazorpay = () => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

/**
 * Creates an order on the server (Simulated for client-side demo).
 * In production, this MUST call your Backend API (Node.js/Firebase Functions).
 */
export const createPaymentOrder = async (bookingId, amount, currency = 'INR') => {
    // SIMULATION: Call your backend API here
    // const res = await fetch('/api/create-order', { body: { bookingId, amount } });
    // return res.json();

    console.log(`[Mock] Creating Razorpay Order for Booking ${bookingId} - ${currency} ${amount}`);

    // Returning a mock order ID
    return {
        id: 'order_' + new Date().getTime(),
        currency: currency,
        amount: amount * 100, // Razorpay expects paise
    };
};

/**
 * Verifies the payment signature (Simulated).
 * In production, verify signature on backend using razorpay-node SDK.
 */
export const verifyPayment = async (response) => {
    console.log("[Mock] Verifying Payment", response);
    // Simulate API call to verify signature
    return true;
};

/**
 * Handles the full payment flow for a booking.
 * @param {Object} bookingDetails - { id, amount, currency, user, description }
 * @param {Function} onSuccess - Callback
 * @param {Function} onFailure - Callback
 */
export const payWithRazorpay = async (bookingDetails, onSuccess, onFailure) => {
    const isLoaded = await loadRazorpay();
    if (!isLoaded) {
        alert('Razorpay SDK failed to load. Check your internet connection.');
        onFailure('SDK_LOAD_ERROR');
        return;
    }

    try {
        // 1. Create Order
        const order = await createPaymentOrder(bookingDetails.id, bookingDetails.amount, bookingDetails.currency);

        const options = {
            key: "YOUR_RAZORPAY_KEY_ID", // Replace with env variable
            amount: order.amount,
            currency: order.currency,
            name: "Infinite Yatra",
            description: bookingDetails.description || "Travel Booking",
            image: "https://infiniteyatra.com/logo.png", // Replace with your logo URL
            order_id: order.id,
            handler: async function (response) {
                // 2. Verify Payment on Success
                const isValid = await verifyPayment(response);
                if (isValid) {
                    onSuccess({
                        paymentId: response.razorpay_payment_id,
                        orderId: response.razorpay_order_id,
                        signature: response.razorpay_signature
                    });
                } else {
                    onFailure('VERIFICATION_FAILED');
                }
            },
            prefill: {
                name: bookingDetails.user?.name,
                email: bookingDetails.user?.email,
                contact: bookingDetails.user?.phone
            },
            notes: {
                bookingId: bookingDetails.id,
            },
            theme: {
                color: "#2563eb", // Blue-600
            },
            modal: {
                ondismiss: function () {
                    onFailure('USER_CANCELLED');
                }
            }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();

    } catch (error) {
        console.error("Payment Error", error);
        onFailure(error.message);
    }
};
