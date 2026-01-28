import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Users, User, Mail, Phone, CheckCircle, ArrowRight, ArrowLeft, Loader, CreditCard, Lock, Gift } from 'lucide-react';
import { getPackageById } from '../data/packages';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { sendBookingEmails } from '../services/email';
import { RazorpayService } from '../services/razorpayService';
import { Upload, FileText, X, Download } from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { generateInvoicePDF } from '../services/InvoiceGenerator';
// import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // REMOVED
// import { storage } from '../firebase'; // REMOVED

const BookingPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [pkg, setPkg] = useState(null);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [confirmedBookingId, setConfirmedBookingId] = useState(null);
    const [error, setError] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [paymentOption, setPaymentOption] = useState('token'); // 'token' or 'full'

    const [bookingData, setBookingData] = useState({
        date: '',

        travelers: 2,
        name: '',
        email: '',
        phone: '',
        specialRequests: '',
        travelersList: [],
        referralCode: '',
        discount: 0
    });

    const [activeModal, setActiveModal] = useState(null);
    const [activeTravelerIndex, setActiveTravelerIndex] = useState(null);
    const [editingContactId, setEditingContactId] = useState(null);
    const [contactForm, setContactForm] = useState({
        firstName: '',
        middleName: '',
        lastName: '',
        relation: '',
        email: '',
        phoneNumbers: ['']
    });

    const [useMyDetails, setUseMyDetails] = useState(false);

    useEffect(() => {
        setBookingData(prev => {
            const count = Number(prev.travelers) || 1;
            const currentList = prev.travelersList || [];

            if (currentList.length === count) return prev;

            // Resize array while preserving existing data
            const newList = Array(count).fill(null).map((_, i) =>
                currentList[i] || {
                    firstName: '',
                    middleName: '',
                    lastName: '',
                    age: '',
                    gender: '',
                    mobile: '',
                    email: '',
                    idType: '',
                    idFiles: {},
                    emergencyContacts: []
                }
            );

            return { ...prev, travelersList: newList };
        });
    }, [bookingData.travelers]);

    useEffect(() => {
        const fetchPackage = async () => {
            try {
                // 1. Try fetching from Firestore first (for updated prices/details)
                const docRef = doc(db, 'packages', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setPkg({ id: docSnap.id, ...docSnap.data() });
                } else {
                    // 2. Fallback to static data if not in Firestore
                    const packageData = getPackageById(id);
                    if (packageData) {
                        setPkg(packageData);
                    } else {
                        navigate('/'); // Not found anywhere
                        return;
                    }
                }

                setLoading(false);
                // Pre-fill user data if available
                if (currentUser) {
                    setBookingData(prev => ({
                        ...prev,
                        email: currentUser.email || '',
                        name: currentUser.name || currentUser.displayName || '',
                        phone: currentUser.phone || ''
                    }));
                }
            } catch (err) {
                console.error("Error fetching package:", err);
                // Fallback on error
                const packageData = getPackageById(id);
                if (packageData) {
                    setPkg(packageData);
                    setLoading(false);
                } else {
                    navigate('/');
                }
            }
        };

        fetchPackage();
    }, [id, navigate, currentUser]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setBookingData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePhoneChange = (value) => {
        setBookingData(prev => ({
            ...prev,
            phone: value
        }));
    };

    const handleDateChange = (date) => {
        if (!date) {
            setBookingData(prev => ({ ...prev, date: '' }));
            return;
        }
        // Adjust for timezone offset to prevent date shifting
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset * 60 * 1000));
        const dateString = localDate.toISOString().split('T')[0];

        setBookingData(prev => ({
            ...prev,
            date: dateString
        }));
    };

    const handleTravelerChange = (index, field, value) => {
        setBookingData(prev => {
            const newList = [...prev.travelersList];
            if (field === 'mobile') {
                newList[index] = { ...newList[index], mobile: value };
            } else if (field === 'idFiles') {
                newList[index] = { ...newList[index], idFiles: { ...newList[index].idFiles, ...value } };
            } else {
                newList[index] = { ...newList[index], [field]: value };
            }
            return { ...prev, travelersList: newList };
        });
    };

    const ID_TYPES = {
        aadhaar: { label: 'Aadhaar Card', fields: ['front', 'back'] },
        pan: { label: 'PAN Card', fields: ['front'] },
        voter: { label: 'Voter ID', fields: ['front', 'back'] },
        license: { label: 'Driving Licence', fields: ['front', 'back'] },
        passport: { label: 'Passport', fields: ['front', 'back', 'visa'] }
    };

    const handleFileUpload = (index, fieldName, file) => {
        if (!file) return;
        handleTravelerChange(index, 'idFiles', { [fieldName]: file });
    };

    const calculateAge = (dob) => {
        if (!dob) return '';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age.toString();
    };

    // Emergency Contact Helpers
    const validateName = (name) => /^[A-Za-z\s]+$/.test(name);
    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const openContactModal = (travelerIndex, contactId = null) => {
        setActiveTravelerIndex(travelerIndex);
        if (contactId !== null) {
            const contact = bookingData.travelersList[travelerIndex].emergencyContacts[contactId];
            setContactForm({ ...contact });
            setEditingContactId(contactId);
        } else {
            setContactForm({
                firstName: '',
                middleName: '',
                lastName: '',
                relation: '',
                email: '',
                phoneNumbers: ['']
            });
            setEditingContactId(null);
        }
        setActiveModal('emergencyContact');
    };

    const closeContactModal = () => {
        setActiveModal(null);
        setEditingContactId(null);
        setActiveTravelerIndex(null);
    };

    const saveEmergencyContact = () => {
        // Basic validation
        if (!contactForm.firstName || !contactForm.lastName || !contactForm.relation || !contactForm.phoneNumbers[0]) {
            alert('Please fill in all mandatory fields.');
            return;
        }

        // Email Validation
        if (contactForm.email && !validateEmail(contactForm.email)) {
            alert('Please enter a valid email address.');
            return;
        }

        setBookingData(prev => {
            const newTravelersList = [...prev.travelersList];
            const traveler = { ...newTravelersList[activeTravelerIndex] };
            let updatedContacts = [...(traveler.emergencyContacts || [])];

            if (editingContactId !== null) {
                updatedContacts[editingContactId] = contactForm;
            } else {
                updatedContacts.push(contactForm);
            }

            traveler.emergencyContacts = updatedContacts;
            newTravelersList[activeTravelerIndex] = traveler;

            return { ...prev, travelersList: newTravelersList };
        });
        closeContactModal();
    };

    const deleteEmergencyContact = (travelerIndex, contactIndex, e) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this contact?')) return;

        setBookingData(prev => {
            const newTravelersList = [...prev.travelersList];
            const traveler = { ...newTravelersList[travelerIndex] };
            traveler.emergencyContacts = traveler.emergencyContacts.filter((_, i) => i !== contactIndex);
            newTravelersList[travelerIndex] = traveler;
            return { ...prev, travelersList: newTravelersList };
        });
    };

    const handleContactPhoneChange = (index, value) => {
        const newPhones = [...contactForm.phoneNumbers];
        newPhones[index] = '+' + value;
        setContactForm({ ...contactForm, phoneNumbers: newPhones });
    };

    const addContactPhone = () => {
        setContactForm({ ...contactForm, phoneNumbers: [...contactForm.phoneNumbers, ''] });
    };

    const removeContactPhone = (index) => {
        const newPhones = contactForm.phoneNumbers.filter((_, i) => i !== index);
        setContactForm({ ...contactForm, phoneNumbers: newPhones });
    };

    const toggleSyncUser = (enabled) => {
        setUseMyDetails(enabled);
        if (!currentUser) return;

        setBookingData(prev => {
            const newList = [...prev.travelersList];

            if (enabled) {
                // Sync Data
                const userAge = calculateAge(currentUser.dateOfBirth);

                // Name filling logic
                let fName = currentUser.firstName || '';
                let mName = currentUser.middleName || '';
                let lName = currentUser.lastName || '';

                if (!fName && (currentUser.name || currentUser.displayName)) {
                    const fullName = currentUser.name || currentUser.displayName || '';
                    const parts = fullName.split(' ');
                    fName = parts[0] || '';
                    lName = parts.slice(1).join(' ') || '';
                }

                newList[0] = {
                    ...newList[0],
                    firstName: fName,
                    middleName: mName,
                    lastName: lName,
                    mobile: currentUser.phone || '',
                    email: currentUser.email || '',
                    gender: currentUser.gender || '',
                    age: userAge,
                    emergencyContacts: currentUser.emergencyContacts ? JSON.parse(JSON.stringify(currentUser.emergencyContacts)) : []
                };
            } else {
                // Clear Data
                newList[0] = {
                    ...newList[0],
                    firstName: '',
                    middleName: '',
                    lastName: '',
                    mobile: '',
                    email: '',
                    gender: '',
                    age: '',
                    idType: '',
                    idFiles: {},
                    emergencyContacts: []
                };
            }
            return { ...prev, travelersList: newList };
        });
    };

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    const checkAvailability = async (packageId, date, requestedSlots) => {
        try {
            const q = query(
                collection(db, 'bookings'),
                where('packageId', '==', packageId),
                where('bookingDate', '==', date)
            );
            const querySnapshot = await getDocs(q);
            let totalBooked = 0;
            querySnapshot.docs
                .filter(doc => doc.data().status !== 'cancelled')
                .forEach((doc) => {
                    totalBooked += doc.data().travelers || 0;
                });

            const maxSlots = pkg.maxGroupSize || 12; // Default to 12 if not set
            const remainingSlots = maxSlots - totalBooked;

            if (requestedSlots > remainingSlots) {
                return {
                    available: false,
                    remaining: remainingSlots,
                    message: remainingSlots <= 0
                        ? "Sorry, this date is fully booked."
                        : `Only ${remainingSlots} slot${remainingSlots === 1 ? '' : 's'} left for this date.`
                };
            }
            return { available: true };
        } catch (error) {
            console.error("Error checking availability:", error);
            // In case of error, you might want to allow or block. 
            // Blocking is safer to prevent overbooking.
            return { available: false, message: "Unable to verify availability. Please try again." };
        }
    };

    const handleConfirm = async () => {
        if (!currentUser) return;

        setSubmitting(true);
        setError(''); // Clear previous errors

        try {
            // 1. Check availability
            const availability = await checkAvailability(pkg.id, bookingData.date, Number(bookingData.travelers));

            if (!availability.available) {
                setError(availability.message);
                setSubmitting(false);
                return;
            }

            // 2. Calculate Amount (in paise for Razorpay)
            // If token payment: 1000 * travelers
            // If full payment: (price * travelers) - discount
            const tokenAmount = pkg.tokenPrice || 1000;
            const amountToPay = paymentOption === 'token'
                ? (tokenAmount * Number(bookingData.travelers))
                : (pkg.price * Number(bookingData.travelers) - (bookingData.discount || 0));

            const totalAmount = pkg.price * Number(bookingData.travelers) - (bookingData.discount || 0);

            // 3. Create "Pending" Booking in Firestore first
            // Sanitize travelersList to remove File objects before saving to Firestore
            const initialTravelersList = bookingData.travelersList.map(({ idFiles, ...rest }) => rest);

            const bookingRef = await addDoc(collection(db, 'bookings'), {
                userId: currentUser.uid,
                packageId: pkg.id,
                packageTitle: pkg.title,
                bookingDate: bookingData.date,
                travelers: Number(bookingData.travelers),
                contactName: bookingData.name,
                contactEmail: bookingData.email,
                contactPhone: bookingData.phone,
                travelersList: initialTravelersList,
                specialRequests: bookingData.specialRequests,
                totalPrice: pkg.price * Number(bookingData.travelers),
                paymentType: paymentOption,
                amountPaid: 0, // Initially 0 until payment success
                balanceDue: totalAmount,
                status: 'pending_payment', // Use a temporary status
                createdAt: serverTimestamp()
            });

            // Upload ID Documents if present
            let updatedTravelersList = [...initialTravelersList];
            let hasUploads = false;

            try {
                updatedTravelersList = await Promise.all(bookingData.travelersList.map(async (traveler, index) => {
                    const { idFiles, ...rest } = traveler;
                    if (!traveler.idFiles || Object.keys(traveler.idFiles).length === 0) {
                        return rest; // Return sanitized traveler without files or links
                    }

                    const uploadedLinks = {};
                    let travelerHasUploads = false;

                    for (const [key, file] of Object.entries(traveler.idFiles)) {
                        if (file) {
                            hasUploads = true;
                            travelerHasUploads = true;
                            // File path: booking_docs/{bookingId}/traveler_{index}/{docType}_{timestamp}_{filename}
                            // const fileRef = ref(storage, `booking_docs/${bookingRef.id}/traveler_${index + 1}/${key}_${Date.now()}_${file.name}`);
                            // await uploadBytes(fileRef, file);
                            // const url = await getDownloadURL(fileRef);

                            // CLOUDINARY UPLOAD
                            const formData = new FormData();
                            formData.append("file", file);
                            formData.append("upload_preset", "infinite_unsigned"); // Hardcoded preset

                            const response = await fetch(
                                "https://api.cloudinary.com/v1_1/infiniteyatra/image/upload",
                                { method: "POST", body: formData }
                            );

                            if (!response.ok) throw new Error("ID Proof upload failed");
                            const data = await response.json();
                            uploadedLinks[key] = data.secure_url;
                        }
                    }

                    if (travelerHasUploads) {
                        return { ...rest, idProofLinks: uploadedLinks, idType: traveler.idType };
                    }
                    return rest;
                }));

                if (hasUploads) {
                    await updateDoc(doc(db, 'bookings', bookingRef.id), {
                        travelersList: updatedTravelersList
                    });
                }

            } catch (uploadError) {
                console.error("Error uploading documents:", uploadError);
                // We don't block payment for upload errors, but we log it.
                // Optionally show a warning? For now proceeding.
            }

            // 4. Payment Handling
            if (amountToPay <= 0) {
                // FREE BOOKING BYPASS
                await updateDoc(doc(db, 'bookings', bookingRef.id), {
                    status: 'confirmed',
                    bookingStatus: 'confirmed',
                    paymentStatus: 'paid',
                    amountPaid: 0,
                    balanceDue: 0,
                    paymentId: 'FREE',
                    paymentDate: serverTimestamp()
                });

                setConfirmedBookingId(bookingRef.id);

                sendBookingEmails({
                    id: bookingRef.id,
                    contactName: bookingData.name,
                    contactEmail: bookingData.email,
                    contactPhone: bookingData.phone,
                    travelersList: bookingData.travelersList,
                    packageTitle: pkg.title,
                    bookingDate: bookingData.date,
                    travelers: Number(bookingData.travelers),
                    totalPrice: pkg.price * Number(bookingData.travelers),
                    specialRequests: bookingData.specialRequests
                });

                setStep(4);
                setSubmitting(false);
                return;
            }

            // 5. Initialize Razorpay (Backend Driven)
            const isLoaded = await RazorpayService.loadRazorpayScript();
            if (!isLoaded) {
                setError('Razorpay SDK failed to load.');
                setSubmitting(false);
                return;
            }

            // Call Backend to Create Order
            const orderData = await RazorpayService.createOrder(bookingRef.id, amountToPay);

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY || "rzp_live_S2yg6cwyGDfgjI",
                amount: orderData.amount,
                currency: orderData.currency,
                name: "Infinite Yatra",
                description: `Booking ID: ${bookingRef.id}`,
                image: "https://your-logo-url.com/logo.png",
                order_id: orderData.id, // THE CRITICAL PART: Backend Order ID
                handler: async function (response) {
                    try {
                        // 5. Verify Payment (Backend)
                        await RazorpayService.verifyPayment(response, bookingRef.id);

                        // Note: Backend Webhook will also update status, but we do optimistic update here for UI speed

                        // Update Booking in Firestore (Optimistic UI update)
                        await updateDoc(doc(db, 'bookings', bookingRef.id), {
                            status: 'confirmed',
                            bookingStatus: 'confirmed', // Schema v2 sync
                            paymentStatus: 'paid',     // Schema v2 sync
                            amountPaid: amountToPay,
                            balanceDue: paymentOption === 'token' ? (totalAmount - amountToPay) : 0,
                            paymentId: response.razorpay_payment_id,
                            paymentDate: serverTimestamp()
                        });

                        setConfirmedBookingId(bookingRef.id);

                        // Send Emails (Non-blocking)
                        sendBookingEmails({
                            id: bookingRef.id,
                            contactName: bookingData.name,
                            contactEmail: bookingData.email,
                            contactPhone: bookingData.phone,
                            travelersList: bookingData.travelersList,
                            packageTitle: pkg.title,
                            bookingDate: bookingData.date,
                            travelers: Number(bookingData.travelers),
                            totalPrice: pkg.price * Number(bookingData.travelers),
                            specialRequests: bookingData.specialRequests
                        });

                        // Redirect to Success Page
                        navigate('/booking-success', {
                            state: {
                                bookingId: bookingRef.id,
                                packageTitle: pkg.title,
                                amountPaid: amountToPay,
                                totalAmount: totalAmount,
                                date: bookingData.date,
                                paymentOption: paymentOption
                            }
                        });


                    } catch (err) {
                        console.error("Payment Verification Failed:", err);
                        // Even if UI verification fails, Webhook might save us. 
                        // But we show error to be safe.
                        setError("Payment verification failed. If money was deducted, it will be refunded or confirmed shortly.");
                        setSubmitting(false);
                    }
                },
                prefill: {
                    name: bookingData.name,
                    email: bookingData.email,
                    contact: bookingData.phone
                },
                notes: {
                    address: "Infinite Yatra Office"
                },
                theme: {
                    color: "#2563EB"
                },
                modal: {
                    ondismiss: function () {
                        setSubmitting(false);
                        console.log("Payment modal closed");
                    }
                }
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.on('payment.failed', function (response) {
                setError(`Payment Failed: ${response.error.description}`);
                setSubmitting(false);
            });

            rzp1.open();

        } catch (error) {
            console.error("Error initiating booking:", error);
            setError(`Booking Error: ${error.message}`);
            setSubmitting(false);
        }
    };

    const handleWhatsAppShare = () => {
        let travelerDetails = bookingData.travelersList.map((t, i) =>
            `Traveler ${i + 1}: ${t.firstName} ${t.lastName} (${t.age}, ${t.gender})`
        ).join('\n');

        const message = `*Booking Confirmation*\n\n*Booking ID:* ${confirmedBookingId}\n*Package:* ${pkg.title}\n*Date:* ${bookingData.date}\n*Travelers:* ${bookingData.travelers}\n\n*Primary Contact:*\nName: ${bookingData.name}\nPhone: ${bookingData.phone}\n\n*Traveler Details:*\n${travelerDetails}\n\n--------------------------------\nSent via Infinite Yatra Website`;
        const whatsappUrl = `https://wa.me/919265799325?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const isFormValid = () => {
        const contactValid = bookingData.name && bookingData.email && bookingData.phone;
        const travelersValid = bookingData.travelersList.every(t =>
            t.firstName && t.lastName && t.age && t.gender && t.mobile
        );
        return contactValid && travelersValid;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader className="animate-spin text-blue-600" size={40} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black pt-24 pb-12 px-4 relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] pointer-events-none"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] pointer-events-none"></div>

            <div className="max-w-4xl mx-auto relative z-10">
                {/* Progress Steps */}
                <div className="mb-12">
                    <div className="flex items-center justify-between relative max-w-2xl mx-auto">
                        <div className="absolute left-0 right-0 top-1/2 h-1 bg-white/10 -z-10 rounded-full"></div>
                        <div className="absolute left-0 top-1/2 h-1 bg-blue-600 -z-10 rounded-full transition-all duration-500" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>

                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex flex-col items-center gap-2 bg-black px-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 border-2 ${step >= s
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.5)]'
                                    : 'bg-black border-white/20 text-slate-400'
                                    }`}>
                                    {step > s ? <CheckCircle size={20} /> : s}
                                </div>
                                <span className={`text-sm font-medium transition-colors ${step >= s ? 'text-white' : 'text-slate-400'
                                    }`}>
                                    {s === 1 ? 'Selection' : s === 2 ? 'Details' : 'Payment'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">
                    <div className="p-6 md:p-10">
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{pkg.title}</h1>
                        <p className="text-slate-400 mb-8">Complete your booking details below</p>

                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Select Date</label>
                                            <div className="relative custom-datepicker-wrapper">
                                                <Calendar className="absolute left-4 top-4 text-slate-400 z-10 pointer-events-none" size={18} />
                                                {pkg.type === 'fixed' ? (
                                                    <select
                                                        name="date"
                                                        value={bookingData.date}
                                                        onChange={handleInputChange}
                                                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white/10 outline-none appearance-none text-white transition-all cursor-pointer hover:border-white/20"
                                                    >
                                                        <option value="" className="bg-slate-900">Select a departure date</option>
                                                        {pkg.availableDates?.map((date) => (
                                                            <option key={date} value={date} className="bg-slate-900">
                                                                {new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : pkg.type === 'mixed' ? (
                                                    <div className="space-y-4">
                                                        <select
                                                            name="date"
                                                            value={bookingData.date}
                                                            onChange={handleInputChange}
                                                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white/10 outline-none appearance-none text-white transition-all cursor-pointer hover:border-white/20"
                                                        >
                                                            <option value="" className="bg-slate-900">Select a Group Departure</option>
                                                            {pkg.availableDates?.map((date) => (
                                                                <option key={date} value={date} className="bg-slate-900">
                                                                    {new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <div className="text-center text-sm text-slate-400 font-medium">- OR -</div>
                                                        <div className="relative">
                                                            <DatePicker
                                                                selected={bookingData.date ? new Date(bookingData.date) : null}
                                                                onChange={handleDateChange}
                                                                dateFormat="dd/MM/yyyy"
                                                                minDate={pkg.validDateRange?.start ? new Date(pkg.validDateRange.start) : new Date()}
                                                                maxDate={pkg.validDateRange?.end ? new Date(pkg.validDateRange.end) : null}
                                                                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white/10 outline-none text-white transition-all hover:border-white/20"
                                                                placeholderText="dd/mm/yyyy"
                                                                wrapperClassName="w-full"
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="relative">
                                                        <DatePicker
                                                            selected={bookingData.date ? new Date(bookingData.date) : null}
                                                            onChange={handleDateChange}
                                                            dateFormat="dd/MM/yyyy"
                                                            minDate={pkg.validDateRange?.start ? new Date(pkg.validDateRange.start) : new Date()}
                                                            maxDate={pkg.validDateRange?.end ? new Date(pkg.validDateRange.end) : null}
                                                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white/10 outline-none text-white transition-all hover:border-white/20"
                                                            placeholderText="dd/mm/yyyy"
                                                            wrapperClassName="w-full"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            {pkg.type === 'fixed' && (
                                                <p className="text-xs text-blue-400 mt-2 font-medium flex items-center gap-1">
                                                    <CheckCircle size={12} /> Fixed departure group tour
                                                </p>
                                            )}
                                            {pkg.type === 'mixed' && (
                                                <p className="text-xs text-blue-400 mt-2 font-medium flex items-center gap-1">
                                                    <CheckCircle size={12} /> Choose a group departure or your own custom date
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Number of Travelers</label>
                                            <div className="relative">
                                                <Users className="absolute left-4 top-4 text-slate-400" size={18} />
                                                <input
                                                    type="number"
                                                    name="travelers"
                                                    min="1"
                                                    value={bookingData.travelers}
                                                    onChange={handleInputChange}
                                                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white/10 outline-none text-white transition-all hover:border-white/20"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-6">
                                        <button
                                            onClick={nextStep}
                                            disabled={!bookingData.date}
                                            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-1"
                                        >
                                            Next Step <ArrowRight size={20} />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-8">
                                        {/* Primary Contact */}
                                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                                            <h3 className="flex items-center gap-2 font-bold text-white mb-6 border-b border-white/10 pb-4">
                                                <User size={20} className="text-blue-400" /> Primary Contact
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="relative">
                                                    <User className="absolute left-4 top-4 text-slate-400" size={18} />
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        placeholder="Full Name"
                                                        value={bookingData.name}
                                                        onChange={handleInputChange}
                                                        readOnly={!!currentUser}
                                                        className={`w-full pl-12 pr-4 py-4 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder-slate-500 transition-all ${currentUser
                                                            ? 'bg-white/5 border-white/5 text-slate-400 cursor-not-allowed'
                                                            : 'bg-black/20 border-white/10 hover:border-white/20'
                                                            }`}
                                                    />
                                                </div>
                                                <div className="relative">
                                                    <Mail className="absolute left-4 top-4 text-slate-400" size={18} />
                                                    <input
                                                        type="email"
                                                        name="email"
                                                        placeholder="Email Address"
                                                        value={bookingData.email}
                                                        onChange={handleInputChange}
                                                        readOnly={!!currentUser}
                                                        className={`w-full pl-12 pr-4 py-4 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder-slate-500 transition-all ${currentUser
                                                            ? 'bg-white/5 border-white/5 text-slate-400 cursor-not-allowed'
                                                            : 'bg-black/20 border-white/10 hover:border-white/20'
                                                            }`}
                                                    />
                                                </div>
                                                <div className="relative md:col-span-2">
                                                    <PhoneInput
                                                        country={'in'}
                                                        value={bookingData.phone}
                                                        onChange={handlePhoneChange}
                                                        disabled={!!currentUser}
                                                        enableSearch={true}
                                                        disableSearchIcon={false}
                                                        searchStyle={{
                                                            background: '#1e293b',
                                                            color: 'white',
                                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                                            borderRadius: '0.5rem',
                                                            padding: '0.5rem'
                                                        }}
                                                        inputStyle={{
                                                            width: '100%',
                                                            height: '56px',
                                                            fontSize: '16px',
                                                            paddingLeft: '48px',
                                                            borderRadius: '0.75rem',
                                                            border: currentUser ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(255, 255, 255, 0.1)',
                                                            backgroundColor: currentUser ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.2)',
                                                            color: currentUser ? '#94a3b8' : 'white', // slate-400 : white
                                                            cursor: currentUser ? 'not-allowed' : 'text'
                                                        }}
                                                        buttonStyle={{
                                                            backgroundColor: 'transparent',
                                                            border: 'none',
                                                            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                                                            cursor: currentUser ? 'not-allowed' : 'pointer'
                                                        }}
                                                        dropdownStyle={{
                                                            backgroundColor: '#1e293b',
                                                            color: 'white',
                                                            border: '1px solid rgba(255, 255, 255, 0.1)'
                                                        }}
                                                        containerStyle={{
                                                            width: '100%'
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Travelers Details */}
                                        <div className="space-y-4">
                                            <h3 className="flex items-center gap-2 font-bold text-white text-lg">
                                                <Users size={20} className="text-blue-400" /> Traveler Details
                                            </h3>
                                            {bookingData.travelersList.map((traveler, index) => (
                                                <div key={index} className="bg-white/5 p-6 rounded-2xl border border-white/10 relative hover:bg-white/10 transition-colors">
                                                    <div className="absolute -left-3 top-6 bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-lg shadow-blue-600/50">
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex justify-between items-center mb-4 pl-4">
                                                        <h4 className="font-semibold text-slate-200">Traveler {index + 1}</h4>
                                                        {index === 0 && currentUser && (
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-xs text-slate-400 font-medium">Use My Details</span>
                                                                <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                                                                    <button
                                                                        onClick={() => toggleSyncUser(true)}
                                                                        className={`text-xs px-3 py-1 rounded-md transition-all ${useMyDetails
                                                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                                                            : 'text-slate-400 hover:text-white'
                                                                            }`}
                                                                    >
                                                                        On
                                                                    </button>
                                                                    <button
                                                                        onClick={() => toggleSyncUser(false)}
                                                                        className={`text-xs px-3 py-1 rounded-md transition-all ${!useMyDetails
                                                                            ? 'bg-white/10 text-white'
                                                                            : 'text-slate-400 hover:text-white'
                                                                            }`}
                                                                    >
                                                                        Off
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="col-span-1 md:col-span-2 grid grid-cols-3 gap-2">
                                                            <input
                                                                type="text"
                                                                placeholder="First Name *"
                                                                value={traveler.firstName}
                                                                onChange={(e) => {
                                                                    let val = e.target.value.replace(/[^A-Za-z\s]/g, '');
                                                                    val = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
                                                                    handleTravelerChange(index, 'firstName', val);
                                                                }}
                                                                className="w-full px-4 py-4 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder-slate-500 transition-all hover:border-white/20"
                                                            />
                                                            <input
                                                                type="text"
                                                                placeholder="Middle Name"
                                                                value={traveler.middleName}
                                                                onChange={(e) => {
                                                                    let val = e.target.value.replace(/[^A-Za-z\s]/g, '');
                                                                    val = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
                                                                    handleTravelerChange(index, 'middleName', val);
                                                                }}
                                                                className="w-full px-4 py-4 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder-slate-500 transition-all hover:border-white/20"
                                                            />
                                                            <input
                                                                type="text"
                                                                placeholder="Last Name *"
                                                                value={traveler.lastName}
                                                                onChange={(e) => {
                                                                    let val = e.target.value.replace(/[^A-Za-z\s]/g, '');
                                                                    val = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
                                                                    handleTravelerChange(index, 'lastName', val);
                                                                }}
                                                                className="w-full px-4 py-4 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder-slate-500 transition-all hover:border-white/20"
                                                            />
                                                        </div>
                                                        <input
                                                            type="email"
                                                            placeholder="Email Address"
                                                            value={traveler.email}
                                                            onChange={(e) => handleTravelerChange(index, 'email', e.target.value)}
                                                            className="w-full px-4 py-4 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder-slate-500 transition-all hover:border-white/20"
                                                        />
                                                        <div className="flex gap-4">
                                                            <input
                                                                type="number"
                                                                placeholder="Age"
                                                                value={traveler.age}
                                                                onChange={(e) => handleTravelerChange(index, 'age', e.target.value)}
                                                                className="w-1/2 px-4 py-4 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder-slate-500 transition-all hover:border-white/20"
                                                            />
                                                            <select
                                                                value={traveler.gender}
                                                                onChange={(e) => handleTravelerChange(index, 'gender', e.target.value)}
                                                                className="w-1/2 px-4 py-4 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none text-white transition-all hover:border-white/20"
                                                            >
                                                                <option value="" className="bg-slate-900">Gender</option>
                                                                <option value="Male" className="bg-slate-900">Male</option>
                                                                <option value="Female" className="bg-slate-900">Female</option>
                                                                <option value="Other" className="bg-slate-900">Other</option>
                                                            </select>
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <PhoneInput
                                                                country={'in'}
                                                                value={traveler.mobile}
                                                                onChange={(value) => handleTravelerChange(index, 'mobile', value)}
                                                                enableSearch={true}
                                                                disableSearchIcon={false}
                                                                searchStyle={{
                                                                    background: '#1e293b',
                                                                    color: 'white',
                                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                                    borderRadius: '0.5rem',
                                                                    padding: '0.5rem'
                                                                }}
                                                                inputStyle={{
                                                                    width: '100%',
                                                                    height: '56px',
                                                                    fontSize: '16px',
                                                                    paddingLeft: '48px',
                                                                    borderRadius: '0.75rem',
                                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                                                    color: 'white'
                                                                }}
                                                                buttonStyle={{
                                                                    backgroundColor: 'transparent',
                                                                    border: 'none',
                                                                    borderRight: '1px solid rgba(255, 255, 255, 0.1)'
                                                                }}
                                                                dropdownStyle={{
                                                                    backgroundColor: '#1e293b',
                                                                    color: 'white',
                                                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                                                }}
                                                                containerStyle={{
                                                                    width: '100%'
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="md:col-span-2 space-y-4">
                                                            <div className="relative">
                                                                <FileText className="absolute left-4 top-4 text-slate-400" size={18} />
                                                                <select
                                                                    value={traveler.idType}
                                                                    onChange={(e) => handleTravelerChange(index, 'idType', e.target.value)}
                                                                    className="w-full pl-12 pr-4 py-4 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none text-white transition-all hover:border-white/20 cursor-pointer"
                                                                >
                                                                    <option value="" className="bg-slate-900">Select Government ID Type</option>
                                                                    {Object.entries(ID_TYPES).map(([key, type]) => (
                                                                        <option key={key} value={key} className="bg-slate-900">{type.label}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            {traveler.idType && (
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                                                    {ID_TYPES[traveler.idType].fields.map((field) => (
                                                                        <div key={field} className="relative">
                                                                            <input
                                                                                type="file"
                                                                                id={`file-${index}-${field}`}
                                                                                onChange={(e) => handleFileUpload(index, field, e.target.files[0])}
                                                                                className="hidden"
                                                                                accept="image/*,.pdf"
                                                                            />
                                                                            <label
                                                                                htmlFor={`file-${index}-${field}`}
                                                                                className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${traveler.idFiles?.[field]
                                                                                    ? 'border-green-500/50 bg-green-500/10'
                                                                                    : 'border-white/10 bg-white/5 hover:border-blue-500/50 hover:bg-blue-600/5'
                                                                                    }`}
                                                                            >
                                                                                {traveler.idFiles?.[field] ? (
                                                                                    <>
                                                                                        <CheckCircle className="text-green-400 mb-2" size={24} />
                                                                                        <span className="text-xs text-green-400 font-medium truncate w-full text-center">
                                                                                            {traveler.idFiles[field].name}
                                                                                        </span>
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <Upload className="text-blue-400 mb-2" size={24} />
                                                                                        <span className="text-xs text-slate-400 font-medium capitalize">
                                                                                            {field === 'front' ? 'Front Side' : field === 'back' ? (traveler.idType === 'passport' ? 'Last Page' : 'Back Side') : 'Visa Page'}
                                                                                        </span>
                                                                                        {field === 'visa' && <span className="text-[10px] text-slate-500">(If applicable)</span>}
                                                                                    </>
                                                                                )}
                                                                            </label>
                                                                            {traveler.idFiles?.[field] && (
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.preventDefault();
                                                                                        handleFileUpload(index, field, null);
                                                                                    }}
                                                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                                                                                >
                                                                                    <X size={12} />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>


                                                    {/* Emergency Contacts for this Traveler */}
                                                    <div className="mt-6 pt-6 border-t border-white/10">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <h5 className="font-semibold text-slate-300 flex items-center gap-2">
                                                                <span className="text-lg">🆘</span> Emergency Contact
                                                            </h5>
                                                            <button
                                                                onClick={() => openContactModal(index)}
                                                                className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                                                            >
                                                                + Add
                                                            </button>
                                                        </div>

                                                        <div className="space-y-3">
                                                            {(!traveler.emergencyContacts || traveler.emergencyContacts.length === 0) ? (
                                                                <div className="text-center py-4 text-slate-500 bg-black/20 rounded-xl border border-white/5 border-dashed text-sm">
                                                                    <p>No contact added.</p>
                                                                </div>
                                                            ) : (
                                                                traveler.emergencyContacts.map((contact, cIndex) => (
                                                                    <div key={cIndex} className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5 hover:border-white/20 transition-all cursor-pointer group" onClick={() => openContactModal(index, cIndex)}>
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-sm">
                                                                                🆘
                                                                            </div>
                                                                            <div>
                                                                                <div className="text-xs text-slate-400 font-medium">{contact.relation}</div>
                                                                                <div className="text-sm text-white font-semibold">{contact.firstName} {contact.lastName}</div>
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            onClick={(e) => deleteEmergencyContact(index, cIndex, e)}
                                                                            className="text-slate-500 hover:text-red-500 p-1.5 opacity-0 group-hover:opacity-100 transition-all"
                                                                            title="Delete Contact"
                                                                        >
                                                                            <X size={16} />
                                                                        </button>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>





                                        <div>
                                            <textarea
                                                name="specialRequests"
                                                placeholder="Any special requests? (Dietary, accessibility, etc.)"
                                                value={bookingData.specialRequests}
                                                onChange={handleInputChange}
                                                className="w-full p-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none text-white placeholder-slate-500 transition-all hover:border-white/20"
                                            ></textarea>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm mb-4 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                            {error}
                                        </div>
                                    )}

                                    <div className="flex justify-between pt-6">
                                        <button
                                            onClick={prevStep}
                                            className="text-slate-400 font-semibold hover:text-white transition-colors flex items-center gap-2 px-4 py-2"
                                        >
                                            <ArrowLeft size={20} /> Back
                                        </button>
                                        <button
                                            onClick={nextStep}
                                            disabled={!isFormValid()}
                                            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-1"
                                        >
                                            Proceed to Payment <ArrowRight size={20} />
                                        </button>

                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                                        <h3 className="text-xl font-bold text-white mb-6">Payment Details</h3>

                                        <div className="flex flex-col gap-4 mb-8">
                                            <div className="flex justify-between items-center p-4 bg-black/20 rounded-xl border border-white/10">
                                                <span className="text-slate-400">Package Base Price</span>
                                                <span className="font-medium text-white">₹{pkg.price.toLocaleString()} x {bookingData.travelers}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-4 bg-black/20 rounded-xl border border-white/10">
                                                <span className="text-slate-400">Token Amount (Per Person)</span>
                                                <span className="font-medium text-white">₹{(pkg.tokenPrice || 1000).toLocaleString()}</span>
                                            </div>
                                            {bookingData.discount > 0 && (
                                                <div className="flex justify-between items-center p-4 bg-green-500/10 rounded-xl border border-green-500/20 text-green-400">
                                                    <span className="flex items-center gap-2"><CheckCircle size={16} /> Referral Discount</span>
                                                    <span className="font-bold">- ₹{bookingData.discount}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center p-4 bg-blue-600/10 rounded-xl border border-blue-600/20">
                                                <span className="text-lg font-bold text-white">Total Amount</span>
                                                <span className="text-2xl font-bold text-blue-400">
                                                    ₹{(pkg.price * Number(bookingData.travelers) - (bookingData.discount || 0)).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid gap-4">
                                            <h4 className="font-semibold text-slate-300 mb-2">Select Payment Option</h4>

                                            {/* Token Amount Option */}
                                            <label className={`flex items-start gap-4 p-5 border-2 rounded-2xl cursor-pointer transition-all hover:border-blue-500/50 ${paymentOption === 'token'
                                                ? 'border-blue-600 bg-blue-600/10 shadow-[0_0_20px_rgba(37,99,235,0.2)]'
                                                : 'border-white/10 bg-white/5 hover:bg-white/10'
                                                }`}>
                                                <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${paymentOption === 'token' ? 'border-blue-500' : 'border-slate-500'
                                                    }`}>
                                                    {paymentOption === 'token' && <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>}
                                                </div>
                                                <input
                                                    type="radio"
                                                    name="paymentOption"
                                                    checked={paymentOption === 'token'}
                                                    onChange={() => setPaymentOption('token')}
                                                    className="hidden"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex justify-between">
                                                        <div className="font-bold text-white">Pay Token Amount</div>
                                                        <div className="font-bold text-blue-400">₹{((pkg.tokenPrice || 1000) * bookingData.travelers).toLocaleString()}</div>
                                                    </div>
                                                    <div className="text-sm text-slate-400 mt-1">
                                                        Mandatory to secure your slots.
                                                    </div>
                                                </div>
                                            </label>

                                            {/* Full Amount Option */}
                                            <label className={`flex items-start gap-4 p-5 border-2 rounded-2xl cursor-pointer transition-all hover:border-blue-500/50 ${paymentOption === 'full'
                                                ? 'border-blue-600 bg-blue-600/10 shadow-[0_0_20px_rgba(37,99,235,0.2)]'
                                                : 'border-white/10 bg-white/5 hover:bg-white/10'
                                                }`}>
                                                <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${paymentOption === 'full' ? 'border-blue-500' : 'border-slate-500'
                                                    }`}>
                                                    {paymentOption === 'full' && <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>}
                                                </div>
                                                <input
                                                    type="radio"
                                                    name="paymentOption"
                                                    checked={paymentOption === 'full'}
                                                    onChange={() => setPaymentOption('full')}
                                                    className="hidden"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex justify-between">
                                                        <div className="font-bold text-white">Pay Full Amount</div>
                                                        <div className="font-bold text-blue-400">
                                                            ₹{(pkg.price * Number(bookingData.travelers) - (bookingData.discount || 0)).toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div className="text-sm text-slate-400 mt-1">
                                                        Clear all dues now.
                                                    </div>
                                                </div>
                                            </label>
                                        </div>

                                        {/* Summary of what is being paid */}
                                        <div className="flex justify-between items-center p-6 bg-black/40 border border-white/10 text-white rounded-2xl shadow-xl mt-6">
                                            <div>
                                                <div className="text-slate-400 text-sm">Amount Payable Now</div>
                                                <div className="text-3xl font-bold mt-1 text-white">
                                                    ₹{paymentOption === 'token'
                                                        ? ((pkg.tokenPrice || 1000) * bookingData.travelers).toLocaleString()
                                                        : (pkg.price * Number(bookingData.travelers) - (bookingData.discount || 0)).toLocaleString()
                                                    }
                                                </div>
                                            </div>
                                            {paymentOption === 'token' && (
                                                <div className="text-right">
                                                    <div className="text-slate-400 text-xs">Balance Due</div>
                                                    <div className="font-medium text-slate-200">
                                                        ₹{((pkg.price * Number(bookingData.travelers) - (bookingData.discount || 0)) - ((pkg.tokenPrice || 1000) * bookingData.travelers)).toLocaleString()}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Cancellation Policy */}
                                        <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10 text-sm text-slate-400">
                                            <h5 className="font-bold text-slate-200 mb-2">Cancellation & Refund Policy</h5>
                                            <ul className="list-disc pl-4 space-y-1">
                                                {pkg.cancellationPolicy && pkg.cancellationPolicy.length > 0 ? (
                                                    pkg.cancellationPolicy.map((item, index) => (
                                                        <li key={index}>
                                                            {item.includes("Token Amount: ₹1,000 per person")
                                                                ? "Token Amount is Non-Refundable & Non-Transferable"
                                                                : item}
                                                        </li>
                                                    ))
                                                ) : (
                                                    <>
                                                        <li><strong>Token Amount is Non-Refundable & Non-Transferable</strong></li>
                                                        <li><strong>Full Payment Refund:</strong>
                                                            <ul className="list-[circle] pl-4 mt-1 space-y-1">
                                                                <li>Cancelled <strong>&gt;7 days</strong> before trip: Full Refund minus token charges.</li>
                                                                <li>Cancelled <strong>&lt;7 days</strong> before trip: 50% Refund only.</li>
                                                            </ul>
                                                        </li>
                                                    </>
                                                )}
                                            </ul>
                                            <div className="mt-4 pt-4 border-t border-white/10">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex items-center h-5">
                                                        <input
                                                            id="terms-checkbox"
                                                            type="checkbox"
                                                            checked={agreedToTerms}
                                                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                                                            className="w-4 h-4 rounded border-gray-500 bg-black/40 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                        />
                                                    </div>
                                                    <label htmlFor="terms-checkbox" className="text-sm text-slate-400 cursor-pointer select-none">
                                                        I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-400 font-semibold hover:text-blue-300 hover:underline">Terms & Conditions</a>, Cancellation Policy, and Trip Rules.
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between pt-6">
                                        <button
                                            onClick={prevStep}
                                            className="text-slate-400 font-semibold hover:text-white transition-colors flex items-center gap-2 px-4 py-2"
                                        >
                                            <ArrowLeft size={20} /> Back
                                        </button>
                                        <button
                                            onClick={handleConfirm}
                                            disabled={submitting || !agreedToTerms}
                                            className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-xl font-bold hover:shadow-lg hover:shadow-green-500/30 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1"
                                        >
                                            {submitting ? (
                                                <>
                                                    <Loader className="animate-spin" size={20} /> Processing...
                                                </>
                                            ) : (
                                                <>Pay Now <CheckCircle size={20} /></>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 4 && (
                                <motion.div
                                    key="step4"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-8"
                                >
                                    <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(34,197,94,0.3)]">
                                        <CheckCircle className="text-green-500" size={48} />
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Booking Confirmed!</h2>
                                    <p className="text-slate-400 mb-8 max-w-md mx-auto">Your trip to {pkg.title} has been successfully booked.</p>

                                    <div className="bg-white/5 rounded-2xl p-8 mb-8 text-left max-w-md mx-auto border border-white/10">
                                        <div className="flex justify-between mb-4 pb-4 border-b border-white/10">
                                            <span className="text-slate-400">Booking ID</span>
                                            <span className="font-mono font-bold text-white">{confirmedBookingId}</span>
                                        </div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-slate-400">Date</span>
                                            <span className="font-medium text-white">{new Date(bookingData.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                        </div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-slate-400">Travelers</span>
                                            <span className="font-medium text-white">{bookingData.travelers}</span>
                                        </div>
                                        <div className="flex justify-between mt-4 pt-4 border-t border-white/10">
                                            <span className="text-slate-400">Amount Due</span>
                                            <span className="font-bold text-blue-400 text-lg">₹{(pkg.price * Number(bookingData.travelers) - (paymentOption === 'token' ? ((pkg.tokenPrice || 1000) * bookingData.travelers) : pkg.price * Number(bookingData.travelers))).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:flex-row gap-4 justify-center">
                                        <button
                                            onClick={() => {
                                                const amountPaid = paymentOption === 'token' ? ((pkg.tokenPrice || 1000) * bookingData.travelers) : (pkg.price * bookingData.travelers);
                                                const booking = {
                                                    id: confirmedBookingId,
                                                    packageTitle: pkg.title,
                                                    travelDate: bookingData.date,
                                                    category: pkg.category || 'Trip',
                                                    totalPrice: pkg.price * bookingData.travelers,
                                                    travelers: bookingData.travelers
                                                };
                                                const payment = {
                                                    amount: amountPaid,
                                                    method: 'Online',
                                                    id: 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase(), // Placeholder or use state if captured
                                                    status: 'Success'
                                                };
                                                const customer = {
                                                    name: bookingData.name,
                                                    email: bookingData.email,
                                                    phone: bookingData.phone
                                                };
                                                const doc = generateInvoicePDF(booking, payment, customer);
                                                doc.save(`IY_Invoice_${confirmedBookingId}.pdf`);
                                            }}
                                            className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl font-bold transition-all border border-white/10 flex items-center justify-center gap-2"
                                        >
                                            <Download size={20} /> Download Invoice
                                        </button>

                                        <button
                                            onClick={handleWhatsAppShare}
                                            className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-green-600/30 hover:shadow-green-600/50 hover:-translate-y-1 transform duration-200 flex items-center justify-center gap-2"
                                        >
                                            <span>📱</span> Get Ticket on WhatsApp
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div >
            </div >

            {/* Modal Dialog */}
            {
                activeModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={closeContactModal}>
                        <div className="bg-[#0f172a] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5">
                                <h3 className="text-lg font-bold text-white">
                                    {editingContactId !== null ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
                                </h3>
                                <button onClick={closeContactModal} className="text-slate-400 hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="w-full px-3 py-3 bg-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white text-sm placeholder-slate-500 transition-all"
                                            placeholder="First Name *"
                                            value={contactForm.firstName}
                                            onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value.replace(/[^A-Za-z\s]/g, '') })}
                                        />
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="w-full px-3 py-3 bg-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white text-sm placeholder-slate-500 transition-all"
                                            placeholder="Middle Name"
                                            value={contactForm.middleName}
                                            onChange={(e) => setContactForm({ ...contactForm, middleName: e.target.value.replace(/[^A-Za-z\s]/g, '') })}
                                        />
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="w-full px-3 py-3 bg-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white text-sm placeholder-slate-500 transition-all"
                                            placeholder="Last Name *"
                                            value={contactForm.lastName}
                                            onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value.replace(/[^A-Za-z\s]/g, '') })}
                                        />
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-500 pl-1 -mt-2">Only alphabets allowed for names</p>

                                <select
                                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white appearance-none cursor-pointer"
                                    value={contactForm.relation}
                                    onChange={(e) => setContactForm({ ...contactForm, relation: e.target.value })}
                                >
                                    <option value="" className="bg-slate-900">Select Relation *</option>
                                    <option value="Father" className="bg-slate-900">Father</option>
                                    <option value="Mother" className="bg-slate-900">Mother</option>
                                    <option value="Brother / Sister" className="bg-slate-900">Brother / Sister</option>
                                    <option value="Friend" className="bg-slate-900">Friend</option>
                                    <option value="Colleague" className="bg-slate-900">Colleague</option>
                                    <option value="Other" className="bg-slate-900">Other</option>
                                </select>

                                <input
                                    type="email"
                                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder-slate-500 transition-all"
                                    placeholder="Email Address"
                                    value={contactForm.email}
                                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                                />

                                <div>
                                    <label className="text-xs text-slate-400 mb-2 block">Mobile Number(s) *</label>
                                    {contactForm.phoneNumbers.map((phone, index) => (
                                        <div key={index} className="mb-2 relative">
                                            <PhoneInput
                                                country={'in'}
                                                value={phone}
                                                onChange={(value) => handleContactPhoneChange(index, value)}
                                                enableSearch={true}
                                                searchStyle={{
                                                    background: '#1e293b',
                                                    color: 'white',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                }}
                                                inputStyle={{
                                                    width: '100%',
                                                    height: '46px',
                                                    fontSize: '14px',
                                                    paddingLeft: '48px',
                                                    borderRadius: '0.75rem',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                                                    color: 'white'
                                                }}
                                                buttonStyle={{
                                                    backgroundColor: 'transparent',
                                                    border: 'none',
                                                    borderRight: '1px solid rgba(255, 255, 255, 0.1)'
                                                }}
                                                dropdownStyle={{
                                                    backgroundColor: '#1e293b',
                                                    color: 'white',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                                }}
                                                containerStyle={{
                                                    width: '100%'
                                                }}
                                            />
                                            {index > 0 && (
                                                <button
                                                    onClick={() => removeContactPhone(index)}
                                                    className="absolute -right-8 top-3 text-slate-500 hover:text-red-500 transition-colors"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        onClick={addContactPhone}
                                        className="text-xs text-blue-400 hover:text-blue-300 font-medium mt-1 flex items-center gap-1"
                                    >
                                        + Add Another Number
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end">
                                <button
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20"
                                    onClick={saveEmergencyContact}
                                >
                                    Save Contact
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default BookingPage;
