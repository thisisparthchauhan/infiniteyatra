import { Timestamp } from 'firebase/firestore';

/**
 * INFINITE YATRA - DATABASE SCHEMA DEFINITIONS
 * Based on the "Advanced Data Layer" specification.
 * 
 * 9 Core Collections:
 * 1. users (Customers)
 * 2. staff (Admin / Permissions)
 * 3. packages (Trips / Inventory)
 * 4. departures (Date-wise Inventory)
 * 5. bookings (Core Transaction)
 * 6. payments (Razorpay Sync)
 * 7. invoices (Billing)
 * 8. operations (Live Trip Management)
 * 9. stories (Content)
 */

// 1. Users (Customers)
export const createUserModel = (data) => ({
    name: data.name || '',
    email: data.email || '',
    phone: data.phone || '',
    role: 'customer',
    createdAt: data.createdAt || Timestamp.now(),
    lastLogin: data.lastLogin || Timestamp.now(),
    totalBookings: Number(data.totalBookings) || 0,
    lifetimeValue: Number(data.lifetimeValue) || 0,
    tags: data.tags || [], // ["repeat", "vip"]
    fcmToken: data.fcmToken || null,
});

// 2. Staff (Admin / Ops / Finance)
export const createStaffModel = (data) => ({
    name: data.name || '',
    email: data.email || '',
    phone: data.phone || '',
    role: data.role || 'operations', // 'admin' | 'operations' | 'finance' | 'support'
    permissions: data.permissions || {
        bookings: true,
        finance: false,
        operations: true
    },
    status: data.status || 'active',
    createdAt: data.createdAt || Timestamp.now(),
});

// 3. Packages (Trips)
export const createPackageModel = (data) => ({
    title: data.title || '',
    slug: data.slug || '',
    price: Number(data.price) || 0,
    basePrice: Number(data.basePrice) || 0,
    location: data.location || '',
    category: data.category || 'trek', // 'trek' | 'international' | 'pilgrimage'
    images: data.images || [],
    totalSeats: Number(data.totalSeats) || 20, // Default fleet capacity
    active: data.active !== false,
    createdAt: data.createdAt || Timestamp.now(),
    // UI Extras
    description: data.description || '',
    itinerary: data.itinerary || [],
    inclusions: data.inclusions || [],
    exclusions: data.exclusions || [],
});

// 4. Departures (Inventory Management) - VERY IMPORTANT
export const createDepartureModel = (data) => ({
    packageId: data.packageId,
    date: data.date || '', // ISO Date String YYYY-MM-DD
    totalSeats: Number(data.totalSeats) || 20,
    bookedSeats: Number(data.bookedSeats) || 0,
    price: Number(data.price) || 0, // Dynamic pricing per date
    status: data.status || 'open', // 'open' | 'full' | 'completed'
    vehicleAssigned: data.vehicleAssigned || null,
    guideAssigned: data.guideAssigned || null,
});

// 5. Bookings (CORE COLLECTION)
export const createBookingModel = (data) => ({
    userId: data.userId,
    packageId: data.packageId,
    departureId: data.departureId || null,
    seats: Number(data.seats) || 1,
    amount: Number(data.amount) || 0,
    paymentStatus: data.paymentStatus || 'pending', // 'pending' | 'paid' | 'refunded'
    bookingStatus: data.bookingStatus || 'created', // 'created' | 'confirmed' | 'cancelled'
    razorpayOrderId: data.razorpayOrderId || '',
    createdAt: data.createdAt || Timestamp.now(),
    // Extras
    contactName: data.contactName || '',
    contactEmail: data.contactEmail || '',
    contactPhone: data.contactPhone || '',
    travelers: data.travelers || [],
});

// 6. Payments (Razorpay Sync)
export const createPaymentModel = (data) => ({
    bookingId: data.bookingId,
    razorpayPaymentId: data.razorpayPaymentId || '',
    amount: Number(data.amount) || 0,
    currency: data.currency || 'INR',
    status: data.status || 'success', // 'success' | 'failed' | 'refunded'
    createdAt: data.createdAt || Timestamp.now(),
});

// 7. Invoices
export const createInvoiceModel = (data) => ({
    bookingId: data.bookingId,
    invoiceNumber: data.invoiceNumber || `INV-${Date.now()}`,
    pdfUrl: data.pdfUrl || '',
    createdAt: data.createdAt || Timestamp.now(),
});

// 8. Operations (Live Trips)
export const createOperationModel = (data) => ({
    departureId: data.departureId,
    vehicle: data.vehicle || '', // Vehicle Number/Type
    driver: data.driver || '',
    guide: data.guide || '',
    pickupPoints: data.pickupPoints || [],
    manifestPdf: data.manifestPdf || '',
    status: data.status || 'preparing', // 'preparing' | 'live' | 'completed'
});

// 9. Stories (Blog / Community)
export const createStoryModel = (data) => ({
    userId: data.userId,
    title: data.title || '',
    content: data.content || '',
    images: data.images || [],
    featured: data.featured || false,
    likes: Number(data.likes) || 0,
    status: data.status || 'pending', // 'pending' | 'approved'
    createdAt: data.createdAt || Timestamp.now(),
});
