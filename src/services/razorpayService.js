/**
 * Razorpay Frontend Service
 * Handles interactions with the Backend (Firebase Functions) and Razorpay Checkout
 */

const API_BASE_URL = '/api'; // Proxied to Cloud Functions via firebase.json

export const RazorpayService = {
    /**
     * loadRazorpayScript
     * Dynamically loads the Razorpay checkout script
     */
    loadRazorpayScript: () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    },

    /**
     * createOrder
     * Calls backend to generate an Order ID
     * @param {string} bookingId - The ID of the pending booking
     * @param {number} amount - Amount in INR
     */
    createOrder: async (bookingId, amount) => {
        try {
            const response = await fetch(`${API_BASE_URL}/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId, amount })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create order');
            }

            return await response.json(); // Returns { id: "order_xyz", amount: 1000, ... }
        } catch (error) {
            console.error("RazorpayService createOrder Error:", error);
            throw error;
        }
    },

    /**
     * verifyPayment
     * Calls backend to verify the signature (Optional but recommended for strict checks)
     * @param {object} paymentData - { razorpay_order_id, razorpay_payment_id, razorpay_signature }
     * @param {string} bookingId
     */
    verifyPayment: async (paymentData, bookingId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/verify-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...paymentData, bookingId })
            });

            if (!response.ok) throw new Error('Payment verification failed');

            return await response.json(); // { success: true }
        } catch (error) {
            console.error("RazorpayService verifyPayment Error:", error);
            throw error;
        }
    }
};
