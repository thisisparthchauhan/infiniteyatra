import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Users, User, Mail, Phone, CheckCircle, ArrowRight, ArrowLeft, Loader, Gift, MapPin, FileText, Star, Shield, Upload, X, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { getPackageById } from '../data/packages';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { motion, AnimatePresence } from 'framer-motion';
import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp, query, getDocs, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const steps = [
    { id: 1, label: 'Trip Details', icon: Calendar },
    { id: 2, label: 'Travelers', icon: Users },
    { id: 3, label: 'Review & Pay', icon: CheckCircle },
];

// Document types by nationality
const DOC_TYPES_BY_NATIONALITY = {
    india: [
        { key: 'aadhaar', label: 'Aadhaar Card', sides: ['Front', 'Back'] },
        { key: 'pan', label: 'PAN Card', sides: ['Front'] },
        { key: 'passport', label: 'Passport', sides: ['Front'] },
        { key: 'driving_license', label: 'Driving License', sides: ['Front', 'Back'] },
        { key: 'voter_id', label: 'Voter ID', sides: ['Front', 'Back'] },
    ],
    usa: [
        { key: 'passport', label: 'Passport', sides: ['Front'] },
        { key: 'driving_license', label: "Driver's License", sides: ['Front', 'Back'] },
        { key: 'ssn', label: 'SSN Card', sides: ['Front'] },
    ],
    uk: [
        { key: 'passport', label: 'Passport', sides: ['Front'] },
        { key: 'driving_license', label: 'Driving Licence', sides: ['Front', 'Back'] },
        { key: 'national_id', label: 'National ID Card', sides: ['Front', 'Back'] },
    ],
    other: [
        { key: 'passport', label: 'Passport', sides: ['Front'] },
        { key: 'national_id', label: 'National ID', sides: ['Front', 'Back'] },
        { key: 'driving_license', label: 'Driving License', sides: ['Front', 'Back'] },
    ]
};

const RELATION_OPTIONS = ['Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Colleague', 'Guardian', 'Other'];

const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];

const NATIONALITY_OPTIONS = [
    { value: 'india', label: '🇮🇳 India' },
    { value: 'usa', label: '🇺🇸 USA' },
    { value: 'uk', label: '🇬🇧 UK' },
    { value: 'other', label: '🌍 Other' },
];

const createEmptyTraveler = () => ({
    firstName: '',
    middleName: '',
    lastName: '',
    dob: '',
    gender: '',
    nationality: 'india',
    contactNumbers: [''],
    selectedDocType: '',
    docFiles: {},       // { 'aadhaar_Front': File, 'aadhaar_Back': File }
    docPreviews: {},    // { 'aadhaar_Front': 'blob:...' }
    emergencyContacts: [{
        firstName: '',
        middleName: '',
        lastName: '',
        relation: '',
        contactNumber: '',
        email: ''
    }],
});

// =========== Sub-components ===========

const InputField = ({ label, required, error, children }) => (
    <div>
        <label className="block text-xs text-slate-400 mb-1.5 font-medium">
            {label} {required && <span className="text-red-400">*</span>}
        </label>
        {children}
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
);

const TravelerCard = ({ traveler, index, onChange, expandedTraveler, setExpandedTraveler }) => {
    const isExpanded = expandedTraveler === index;
    const nationality = traveler.nationality || 'india';
    const docTypes = DOC_TYPES_BY_NATIONALITY[nationality] || DOC_TYPES_BY_NATIONALITY.other;

    const update = (field, value) => onChange(index, field, value);

    const addContactNumber = () => {
        if (traveler.contactNumbers.length >= 5) return;
        update('contactNumbers', [...traveler.contactNumbers, '']);
    };

    const removeContactNumber = (cIdx) => {
        if (traveler.contactNumbers.length <= 1) return;
        update('contactNumbers', traveler.contactNumbers.filter((_, i) => i !== cIdx));
    };

    const updateContactNumber = (cIdx, value) => {
        const updated = [...traveler.contactNumbers];
        updated[cIdx] = value;
        update('contactNumbers', updated);
    };

    const handleDocSelect = (docKey) => {
        update('selectedDocType', traveler.selectedDocType === docKey ? '' : docKey);
    };

    const handleDocFileChange = (fileKey, file) => {
        if (!file) return;
        const preview = URL.createObjectURL(file);
        update('docFiles', { ...traveler.docFiles, [fileKey]: file });
        update('docPreviews', { ...traveler.docPreviews, [fileKey]: preview });
    };

    const removeDocFile = (fileKey) => {
        const newFiles = { ...traveler.docFiles };
        const newPreviews = { ...traveler.docPreviews };
        if (newPreviews[fileKey]) URL.revokeObjectURL(newPreviews[fileKey]);
        delete newFiles[fileKey];
        delete newPreviews[fileKey];
        update('docFiles', newFiles);
        update('docPreviews', newPreviews);
    };

    // Emergency contacts
    const addEmergencyContact = () => {
        if (traveler.emergencyContacts.length >= 5) return;
        update('emergencyContacts', [...traveler.emergencyContacts, {
            firstName: '', middleName: '', lastName: '', relation: '', contactNumber: '', email: ''
        }]);
    };

    const removeEmergencyContact = (eIdx) => {
        update('emergencyContacts', traveler.emergencyContacts.filter((_, i) => i !== eIdx));
    };

    const updateEmergencyContact = (eIdx, field, value) => {
        const updated = [...traveler.emergencyContacts];
        updated[eIdx] = { ...updated[eIdx], [field]: value };
        update('emergencyContacts', updated);
    };

    const selectedDoc = docTypes.find(d => d.key === traveler.selectedDocType);

    return (
        <div className="border border-white/[0.08] rounded-2xl overflow-hidden bg-white/[0.02] transition-all">
            {/* Header - always visible */}
            <button
                type="button"
                onClick={() => setExpandedTraveler(isExpanded ? null : index)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">
                        {index + 1}
                    </div>
                    <div className="text-left">
                        <p className="font-bold text-sm">
                            {traveler.firstName
                                ? `${traveler.firstName} ${traveler.middleName || ''} ${traveler.lastName}`.trim()
                                : `Traveler ${index + 1}`}
                        </p>
                        {traveler.gender && <p className="text-xs text-slate-500">{traveler.gender} {traveler.dob && `• ${traveler.dob}`}</p>}
                    </div>
                </div>
                {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
            </button>

            {/* Expanded Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5 space-y-6 border-t border-white/[0.06] pt-5">
                            {/* === Personal Details === */}
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Personal Details</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <InputField label="First Name" required>
                                        <input value={traveler.firstName} onChange={e => update('firstName', e.target.value)} placeholder="First name" className="input-dark" />
                                    </InputField>
                                    <InputField label="Middle Name">
                                        <input value={traveler.middleName} onChange={e => update('middleName', e.target.value)} placeholder="Middle name" className="input-dark" />
                                    </InputField>
                                    <InputField label="Last Name" required>
                                        <input value={traveler.lastName} onChange={e => update('lastName', e.target.value)} placeholder="Last name" className="input-dark" />
                                    </InputField>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                                    <InputField label="Date of Birth" required>
                                        <input type="date" value={traveler.dob} onChange={e => update('dob', e.target.value)} className="input-dark" />
                                    </InputField>
                                    <InputField label="Gender" required>
                                        <select value={traveler.gender} onChange={e => update('gender', e.target.value)} className="input-dark appearance-none">
                                            <option value="" className="bg-slate-900">Select</option>
                                            {GENDER_OPTIONS.map(g => <option key={g} value={g} className="bg-slate-900">{g}</option>)}
                                        </select>
                                    </InputField>
                                    <InputField label="Nationality" required>
                                        <select value={traveler.nationality} onChange={e => update('nationality', e.target.value)} className="input-dark appearance-none">
                                            {NATIONALITY_OPTIONS.map(n => <option key={n.value} value={n.value} className="bg-slate-900">{n.label}</option>)}
                                        </select>
                                    </InputField>
                                </div>
                            </div>

                            {/* === Contact Numbers === */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Numbers</p>
                                    {traveler.contactNumbers.length < 5 && (
                                        <button type="button" onClick={addContactNumber} className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1">
                                            <Plus size={12} /> Add Number
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    {traveler.contactNumbers.map((num, cIdx) => (
                                        <div key={cIdx} className="flex items-center gap-2">
                                            <div className="flex-1 phone-input-dark">
                                                <PhoneInput
                                                    country={'in'}
                                                    value={num}
                                                    onChange={val => updateContactNumber(cIdx, val)}
                                                    inputStyle={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.875rem', borderRadius: '0.75rem', height: '2.75rem', paddingLeft: '48px' }}
                                                    buttonStyle={{ background: 'transparent', border: 'none', paddingLeft: '8px' }}
                                                    dropdownStyle={{ background: '#1e293b', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                                                />
                                            </div>
                                            {traveler.contactNumbers.length > 1 && (
                                                <button type="button" onClick={() => removeContactNumber(cIdx)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-600 mt-1">Max 5 contact numbers</p>
                            </div>

                            {/* === Document Upload === */}
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                                    ID Document <span className="text-slate-600 font-normal normal-case">(Optional)</span>
                                </p>

                                {/* Doc type selector */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {docTypes.map(dt => (
                                        <button
                                            key={dt.key}
                                            type="button"
                                            onClick={() => handleDocSelect(dt.key)}
                                            className={`text-xs px-3 py-2 rounded-lg border transition-all font-medium ${traveler.selectedDocType === dt.key
                                                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                                                    : 'border-white/10 text-slate-400 hover:bg-white/5'
                                                }`}
                                        >
                                            {dt.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Upload boxes for selected doc */}
                                {selectedDoc && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {selectedDoc.sides.map(side => {
                                            const fileKey = `${selectedDoc.key}_${side}`;
                                            const preview = traveler.docPreviews?.[fileKey];
                                            return (
                                                <div key={fileKey} className="relative">
                                                    <p className="text-xs text-slate-500 mb-1.5">{selectedDoc.label} — {side}</p>
                                                    {preview ? (
                                                        <div className="relative rounded-xl overflow-hidden border border-white/10 bg-white/[0.03] h-36">
                                                            <img src={preview} alt={`${side}`} className="w-full h-full object-contain p-2" />
                                                            <button
                                                                type="button"
                                                                onClick={() => removeDocFile(fileKey)}
                                                                className="absolute top-2 right-2 w-7 h-7 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center text-white transition-colors"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <label className="flex flex-col items-center justify-center h-36 rounded-xl border-2 border-dashed border-white/10 hover:border-blue-500/30 bg-white/[0.02] cursor-pointer transition-colors group">
                                                            <Upload size={22} className="text-slate-500 group-hover:text-blue-400 mb-2 transition-colors" />
                                                            <span className="text-xs text-slate-500 group-hover:text-slate-300 transition-colors">Click to upload</span>
                                                            <span className="text-[10px] text-slate-600 mt-0.5">JPG, PNG, PDF</span>
                                                            <input
                                                                type="file"
                                                                accept="image/*,.pdf"
                                                                className="hidden"
                                                                onChange={e => handleDocFileChange(fileKey, e.target.files[0])}
                                                            />
                                                        </label>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* === Emergency Contacts === */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        Emergency Contacts <span className="text-slate-600 font-normal normal-case">(Optional)</span>
                                    </p>
                                    {traveler.emergencyContacts.length < 5 && (
                                        <button type="button" onClick={addEmergencyContact} className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1">
                                            <Plus size={12} /> Add Contact
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    {traveler.emergencyContacts.map((ec, eIdx) => (
                                        <div key={eIdx} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 relative">
                                            {traveler.emergencyContacts.length > 1 && (
                                                <button type="button" onClick={() => removeEmergencyContact(eIdx)} className="absolute top-3 right-3 text-red-400 hover:bg-red-400/10 p-1.5 rounded-lg transition-colors">
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Emergency Contact {eIdx + 1}</p>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                <input value={ec.firstName} onChange={e => updateEmergencyContact(eIdx, 'firstName', e.target.value)} placeholder="First name" className="input-dark text-sm" />
                                                <input value={ec.middleName} onChange={e => updateEmergencyContact(eIdx, 'middleName', e.target.value)} placeholder="Middle name" className="input-dark text-sm" />
                                                <input value={ec.lastName} onChange={e => updateEmergencyContact(eIdx, 'lastName', e.target.value)} placeholder="Last name" className="input-dark text-sm" />
                                                <select value={ec.relation} onChange={e => updateEmergencyContact(eIdx, 'relation', e.target.value)} className="input-dark text-sm appearance-none">
                                                    <option value="" className="bg-slate-900">Relation</option>
                                                    {RELATION_OPTIONS.map(r => <option key={r} value={r} className="bg-slate-900">{r}</option>)}
                                                </select>
                                                <div className="phone-input-dark">
                                                    <PhoneInput
                                                        country={'in'}
                                                        value={ec.contactNumber}
                                                        onChange={val => updateEmergencyContact(eIdx, 'contactNumber', val)}
                                                        inputStyle={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.8rem', borderRadius: '0.75rem', height: '2.75rem', paddingLeft: '48px' }}
                                                        buttonStyle={{ background: 'transparent', border: 'none', paddingLeft: '8px' }}
                                                        dropdownStyle={{ background: '#1e293b', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                                                    />
                                                </div>
                                                <input value={ec.email} onChange={e => updateEmergencyContact(eIdx, 'email', e.target.value)} placeholder="Email (optional)" type="email" className="input-dark text-sm" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-600 mt-1">Max 5 emergency contacts per traveler</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


// =========== Main Component ===========

const BookingPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [pkg, setPkg] = useState(null);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [expandedTraveler, setExpandedTraveler] = useState(0);

    // Bundle State
    const [suggestedHotels, setSuggestedHotels] = useState([]);
    const [selectedHotel, setSelectedHotel] = useState(null);

    const [bookingData, setBookingData] = useState({
        date: '',
        travelers: 2,
        name: '',
        email: '',
        phone: '',
        specialRequests: '',
        travelersList: [],
    });

    const [validationErrors, setValidationErrors] = useState({});

    // Sync travelersList with travelers count
    useEffect(() => {
        setBookingData(prev => {
            const count = Number(prev.travelers) || 1;
            const currentList = prev.travelersList || [];
            if (currentList.length === count) return prev;
            const newList = Array(count).fill(null).map((_, i) =>
                currentList[i] || createEmptyTraveler()
            );
            return { ...prev, travelersList: newList };
        });
    }, [bookingData.travelers]);

    // Fetch package + hotels
    useEffect(() => {
        const fetchPackageAndHotels = async () => {
            try {
                let packageData = null;
                const docRef = doc(db, 'packages', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    packageData = { id: docSnap.id, ...docSnap.data() };
                } else {
                    packageData = getPackageById(id);
                }
                if (!packageData) { navigate('/'); return; }
                setPkg(packageData);
                setLoading(false);

                if (packageData.location) {
                    const q = query(collection(db, 'hotels'));
                    const hotelSnaps = await getDocs(q);
                    const hotels = hotelSnaps.docs.map(h => ({ id: h.id, ...h.data() }));
                    const relevant = hotels.filter(h =>
                        h.location?.toLowerCase().includes(packageData.location?.split(' ')[0].toLowerCase()) ||
                        packageData.title.toLowerCase().includes(h.location?.split(' ')[0].toLowerCase())
                    );
                    setSuggestedHotels(relevant.slice(0, 2));
                }

                if (currentUser) {
                    setBookingData(prev => ({
                        ...prev,
                        email: currentUser.email || '',
                        name: currentUser.name || currentUser.displayName || '',
                        phone: currentUser.phone || ''
                    }));
                }
            } catch (err) {
                console.error("Error:", err);
                navigate('/');
            }
        };
        fetchPackageAndHotels();
    }, [id, navigate, currentUser]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setBookingData(prev => ({ ...prev, [name]: value }));
        if (validationErrors[name]) setValidationErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleDateChange = (date) => {
        if (!date) { setBookingData(prev => ({ ...prev, date: '' })); return; }
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset * 60 * 1000));
        setBookingData(prev => ({ ...prev, date: localDate.toISOString().split('T')[0] }));
        if (validationErrors.date) setValidationErrors(prev => ({ ...prev, date: '' }));
    };

    const handlePhoneChange = (value) => {
        setBookingData(prev => ({ ...prev, phone: value }));
        if (validationErrors.phone) setValidationErrors(prev => ({ ...prev, phone: '' }));
    };

    const handleTravelerChange = (index, field, value) => {
        setBookingData(prev => {
            const newList = [...prev.travelersList];
            newList[index] = { ...newList[index], [field]: value };
            return { ...prev, travelersList: newList };
        });
    };

    const toggleHotelSelection = (hotel) => {
        if (selectedHotel?.id === hotel.id) {
            setSelectedHotel(null);
        } else {
            const defaultRoom = hotel.rooms?.[0];
            if (defaultRoom) {
                setSelectedHotel({
                    id: hotel.id, name: hotel.name, roomName: defaultRoom.name,
                    originalPrice: Number(defaultRoom.price), roomId: defaultRoom.id, image: hotel.image
                });
            }
        }
    };

    const validateStep = (stepNum) => {
        const errors = {};
        if (stepNum === 1) {
            if (!bookingData.date) errors.date = 'Please select a travel date';
            if (!bookingData.travelers || bookingData.travelers < 1) errors.travelers = 'At least 1 traveler required';
            if (!bookingData.name.trim()) errors.name = 'Name is required';
            if (!bookingData.email.trim()) errors.email = 'Email is required';
            else if (!/\S+@\S+\.\S+/.test(bookingData.email)) errors.email = 'Enter a valid email';
            if (!bookingData.phone || bookingData.phone.length < 6) errors.phone = 'Phone number is required';
        }
        if (stepNum === 2) {
            // Validate each traveler has at least first name and last name
            const tErrors = [];
            bookingData.travelersList.forEach((t, idx) => {
                if (!t.firstName.trim()) tErrors.push(`Traveler ${idx + 1}: First name required`);
                if (!t.lastName.trim()) tErrors.push(`Traveler ${idx + 1}: Last name required`);
            });
            if (tErrors.length > 0) errors.travelers = tErrors.join(', ');
        }
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const nextStep = () => {
        if (validateStep(step)) {
            setStep(prev => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
    const prevStep = () => {
        setStep(prev => prev - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Price Calculations
    const tourTotal = pkg ? pkg.price * Number(bookingData.travelers) : 0;
    let hotelTotal = 0, bundleDiscount = 0;
    if (selectedHotel) {
        hotelTotal = selectedHotel.originalPrice;
        bundleDiscount = hotelTotal * 0.15;
    }
    const finalTotal = tourTotal + (hotelTotal - bundleDiscount);

    const uploadDocFiles = async (bookingId) => {
        const uploadedDocs = [];
        for (let tIdx = 0; tIdx < bookingData.travelersList.length; tIdx++) {
            const traveler = bookingData.travelersList[tIdx];
            if (!traveler.docFiles || Object.keys(traveler.docFiles).length === 0) continue;
            for (const [fileKey, file] of Object.entries(traveler.docFiles)) {
                try {
                    const storageRef = ref(storage, `bookings/${bookingId}/traveler_${tIdx}/${fileKey}_${file.name}`);
                    await uploadBytes(storageRef, file);
                    const url = await getDownloadURL(storageRef);
                    uploadedDocs.push({ travelerIndex: tIdx, docKey: fileKey, url, fileName: file.name });
                } catch (err) {
                    console.error(`Failed to upload ${fileKey}:`, err);
                }
            }
        }
        return uploadedDocs;
    };

    const handleConfirm = async () => {
        if (!currentUser) return;
        setSubmitting(true);
        setError('');

        try {
            const cleanTravelersList = bookingData.travelersList.map(t => ({
                firstName: t.firstName, middleName: t.middleName, lastName: t.lastName,
                dob: t.dob, gender: t.gender, nationality: t.nationality,
                contactNumbers: t.contactNumbers.filter(n => n),
                selectedDocType: t.selectedDocType,
                emergencyContacts: t.emergencyContacts.filter(ec => ec.firstName || ec.contactNumber).map(ec => ({
                    firstName: ec.firstName, middleName: ec.middleName, lastName: ec.lastName,
                    relation: ec.relation, contactNumber: ec.contactNumber, email: ec.email
                }))
            }));

            const bookingRef = await addDoc(collection(db, 'bookings'), {
                userId: currentUser.uid,
                packageId: pkg.id,
                packageTitle: pkg.title,
                bookingDate: bookingData.date,
                travelers: Number(bookingData.travelers),
                contactName: bookingData.name,
                contactEmail: bookingData.email,
                contactPhone: bookingData.phone,
                specialRequests: bookingData.specialRequests || '',
                travelersList: cleanTravelersList,
                totalPrice: finalTotal,
                tourAmount: tourTotal,
                hotelAmount: hotelTotal - bundleDiscount,
                status: 'confirmed',
                bookingStatus: 'confirmed',
                paymentStatus: 'paid',
                createdAt: serverTimestamp(),
                bundledHotelId: selectedHotel?.id || null,
                bundledHotelName: selectedHotel?.name || null
            });

            // Upload document files
            const uploadedDocs = await uploadDocFiles(bookingRef.id);
            if (uploadedDocs.length > 0) {
                // We'd update the booking doc, but for simplicity store in a sub-collection or just log
                await addDoc(collection(db, 'bookings', bookingRef.id, 'documents'), {
                    docs: uploadedDocs,
                    createdAt: serverTimestamp()
                });
            }

            if (selectedHotel) {
                await addDoc(collection(db, 'hotel_bookings'), {
                    hotelId: selectedHotel.id, hotelName: selectedHotel.name,
                    roomId: selectedHotel.roomId, roomName: selectedHotel.roomName,
                    userId: currentUser.uid, customerName: bookingData.name,
                    customerEmail: bookingData.email, customerPhone: bookingData.phone,
                    checkIn: bookingData.date, checkOut: bookingData.date,
                    pricePerNight: selectedHotel.originalPrice,
                    totalAmount: hotelTotal - bundleDiscount,
                    paymentStatus: 'Paid (Bundle)', bookingStatus: 'Confirmed',
                    bundledWithTour: bookingRef.id, createdAt: serverTimestamp()
                });
                await addDoc(collection(db, 'hotel_finance'), {
                    bookingId: 'BUNDLE_' + bookingRef.id, hotelId: selectedHotel.id,
                    grossAmount: hotelTotal - bundleDiscount,
                    iyCommission: (hotelTotal - bundleDiscount) * 0.15,
                    hotelPayout: (hotelTotal - bundleDiscount) * 0.85,
                    createdAt: serverTimestamp(), note: 'Bundle Booking'
                });
            }

            navigate('/booking-success', {
                state: {
                    bookingId: bookingRef.id, packageTitle: pkg.title,
                    totalAmount: finalTotal, amountPaid: finalTotal, date: bookingData.date
                }
            });
        } catch (error) {
            console.error(error);
            setError(error.message);
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <Loader className="animate-spin text-blue-500 mx-auto" size={40} />
                    <p className="text-slate-400 mt-4">Loading booking details...</p>
                </div>
            </div>
        );
    }

    if (!pkg) return null;

    return (
        <div className="min-h-screen bg-black pt-24 pb-12 px-4 relative overflow-hidden text-white">
            {/* Global styles for input-dark */}
            <style>{`
                .input-dark {
                    width: 100%;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 0.75rem;
                    padding: 0.625rem 0.875rem;
                    color: white;
                    font-size: 0.875rem;
                    outline: none;
                    transition: all 0.2s;
                }
                .input-dark:focus {
                    border-color: rgba(59,130,246,0.5);
                    box-shadow: 0 0 0 2px rgba(59,130,246,0.1);
                }
                .input-dark::placeholder {
                    color: rgba(148,163,184,0.5);
                }
            `}</style>

            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px] pointer-events-none" />

            <div className="max-w-4xl mx-auto relative z-10">

                {/* Step Progress */}
                <div className="mb-10">
                    <div className="flex items-center justify-between max-w-md mx-auto">
                        {steps.map((s, idx) => {
                            const Icon = s.icon;
                            const isActive = step === s.id;
                            const isCompleted = step > s.id;
                            return (
                                <React.Fragment key={s.id}>
                                    <div className="flex flex-col items-center gap-2">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isCompleted ? 'bg-green-500 border-green-500 text-white' :
                                                isActive ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/30' :
                                                    'bg-white/5 border-white/20 text-white/40'
                                            }`}>
                                            {isCompleted ? <CheckCircle size={20} /> : <Icon size={20} />}
                                        </div>
                                        <span className={`text-xs font-bold tracking-wide ${isActive ? 'text-blue-400' : isCompleted ? 'text-green-400' : 'text-white/30'
                                            }`}>{s.label}</span>
                                    </div>
                                    {idx < steps.length - 1 && (
                                        <div className={`flex-1 h-0.5 mx-3 mb-6 rounded-full transition-all duration-300 ${step > s.id ? 'bg-green-500' : 'bg-white/10'}`} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                {/* Main Card */}
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-6 md:p-10"
                >
                    {/* Package Header */}
                    <div className="flex items-start gap-4 mb-8 pb-6 border-b border-white/10">
                        {pkg.image && <img src={pkg.image} alt={pkg.title} className="w-20 h-20 rounded-2xl object-cover border border-white/10 hidden md:block" />}
                        <div className="flex-1">
                            <h1 className="text-2xl md:text-3xl font-bold">{pkg.title}</h1>
                            <div className="flex items-center gap-4 mt-2 text-slate-400 text-sm">
                                {pkg.location && <span className="flex items-center gap-1"><MapPin size={14} />{pkg.location}</span>}
                                {pkg.duration && <span className="flex items-center gap-1"><Calendar size={14} />{pkg.duration}</span>}
                            </div>
                        </div>
                        <div className="text-right hidden md:block">
                            <p className="text-sm text-slate-400">From</p>
                            <p className="text-2xl font-bold text-blue-400">₹{pkg.price?.toLocaleString()}</p>
                            <p className="text-xs text-slate-500">per person</p>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-300 text-sm">{error}</div>
                    )}

                    {/* ============ STEP 1: Trip Details + Contact ============ */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Calendar className="text-blue-400" size={22} />
                                Trip Details & Contact
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2 font-medium">Travel Date *</label>
                                    <DatePicker
                                        selected={bookingData.date ? new Date(bookingData.date) : null}
                                        onChange={handleDateChange}
                                        minDate={new Date()}
                                        placeholderText="Select a date"
                                        className={`w-full bg-white/5 border rounded-xl p-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${validationErrors.date ? 'border-red-500/50' : 'border-white/10'}`}
                                    />
                                    {validationErrors.date && <p className="text-red-400 text-xs mt-1">{validationErrors.date}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2 font-medium">Number of Travelers *</label>
                                    <div className="flex items-center gap-3">
                                        <button type="button" onClick={() => setBookingData(prev => ({ ...prev, travelers: Math.max(1, Number(prev.travelers) - 1) }))} className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors text-xl font-bold">−</button>
                                        <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3.5 text-center text-white text-xl font-bold">{bookingData.travelers}</div>
                                        <button type="button" onClick={() => setBookingData(prev => ({ ...prev, travelers: Number(prev.travelers) + 1 }))} className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors text-xl font-bold">+</button>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Details */}
                            <div className="pt-4 border-t border-white/10">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <User className="text-purple-400" size={20} /> Lead Contact
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm text-slate-400 mb-2 font-medium">Full Name *</label>
                                        <input name="name" value={bookingData.name} onChange={handleInputChange} placeholder="Your full name" className={`w-full bg-white/5 border rounded-xl p-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${validationErrors.name ? 'border-red-500/50' : 'border-white/10'}`} />
                                        {validationErrors.name && <p className="text-red-400 text-xs mt-1">{validationErrors.name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-2 font-medium">Email *</label>
                                        <input name="email" type="email" value={bookingData.email} onChange={handleInputChange} placeholder="your@email.com" className={`w-full bg-white/5 border rounded-xl p-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${validationErrors.email ? 'border-red-500/50' : 'border-white/10'}`} />
                                        {validationErrors.email && <p className="text-red-400 text-xs mt-1">{validationErrors.email}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-2 font-medium">Phone *</label>
                                        <div className="phone-input-dark">
                                            <PhoneInput
                                                country={'in'} value={bookingData.phone} onChange={handlePhoneChange} enableSearch
                                                inputStyle={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: validationErrors.phone ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '1rem', borderRadius: '0.75rem', height: '3.25rem', paddingLeft: '48px' }}
                                                buttonStyle={{ background: 'transparent', border: 'none', paddingLeft: '8px' }}
                                                dropdownStyle={{ background: '#1e293b', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                                            />
                                        </div>
                                        {validationErrors.phone && <p className="text-red-400 text-xs mt-1">{validationErrors.phone}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Special Requests */}
                            <div>
                                <label className="block text-sm text-slate-400 mb-2 font-medium">Special Requests</label>
                                <textarea name="specialRequests" value={bookingData.specialRequests} onChange={handleInputChange} placeholder="Dietary requirements, accessibility needs, special occasions..." rows="3" className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none" />
                            </div>

                            {/* Price Preview */}
                            <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 flex items-center justify-between">
                                <span className="text-slate-300 text-sm">Trip cost for {bookingData.travelers} traveler(s)</span>
                                <span className="text-xl font-bold text-blue-400">₹{tourTotal.toLocaleString()}</span>
                            </div>

                            {/* Bundle */}
                            {bookingData.date && suggestedHotels.length > 0 && (
                                <div className="mt-4 pt-6 border-t border-white/10">
                                    <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-400 mb-4 flex items-center gap-2">
                                        <Gift className="text-amber-300" size={20} /> Unlock Bundle Savings?
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {suggestedHotels.map(h => (
                                            <div key={h.id} onClick={() => toggleHotelSelection(h)} className={`cursor-pointer rounded-xl border p-4 transition-all relative overflow-hidden ${selectedHotel?.id === h.id ? 'border-amber-400 bg-amber-400/10' : 'border-white/10 hover:bg-white/5'}`}>
                                                {selectedHotel?.id === h.id && <div className="absolute top-0 right-0 bg-amber-400 text-black text-xs font-bold px-2 py-1 rounded-bl-lg">SELECTED</div>}
                                                <div className="flex gap-4">
                                                    <img src={h.image} className="w-16 h-16 rounded-lg object-cover" alt={h.name} />
                                                    <div>
                                                        <h4 className="font-bold text-sm">{h.name}</h4>
                                                        <p className="text-xs text-slate-400 mb-1">{h.location}</p>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-bold">₹{Math.round(Number(h.rooms?.[0]?.price || 3000) * 0.85)}</span>
                                                            <span className="text-xs text-slate-500 line-through">₹{h.rooms?.[0]?.price}</span>
                                                            <span className="text-[10px] text-amber-300 font-bold border border-amber-300/30 px-1 rounded">SAVE 15%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end pt-4">
                                <button onClick={nextStep} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-[1.02] shadow-lg shadow-blue-600/20">
                                    Next: Traveler Details <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ============ STEP 2: Traveler Details ============ */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Users className="text-blue-400" size={22} />
                                    Traveler Details
                                </h2>
                                <span className="text-xs text-slate-500 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                                    {bookingData.travelers} traveler(s)
                                </span>
                            </div>

                            <p className="text-sm text-slate-400 -mt-3">
                                Please provide details for each traveler. Click on a traveler to expand their form.
                            </p>

                            {validationErrors.travelers && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-300 text-sm">
                                    {validationErrors.travelers}
                                </div>
                            )}

                            <div className="space-y-3">
                                {bookingData.travelersList.map((traveler, index) => (
                                    <TravelerCard
                                        key={index}
                                        traveler={traveler}
                                        index={index}
                                        onChange={handleTravelerChange}
                                        expandedTraveler={expandedTraveler}
                                        setExpandedTraveler={setExpandedTraveler}
                                    />
                                ))}
                            </div>

                            <div className="flex justify-between pt-4">
                                <button onClick={prevStep} className="text-slate-400 hover:text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors hover:bg-white/5">
                                    <ArrowLeft size={18} /> Back
                                </button>
                                <button onClick={nextStep} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-[1.02] shadow-lg shadow-blue-600/20">
                                    Next: Review <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ============ STEP 3: Review & Pay ============ */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <FileText className="text-blue-400" size={22} />
                                Review Your Booking
                            </h2>

                            {/* Trip Summary */}
                            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 space-y-4">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Trip Summary</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><MapPin size={18} className="text-blue-400" /></div><div><p className="text-xs text-slate-500">Package</p><p className="font-bold text-sm">{pkg.title}</p></div></div>
                                    <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center"><Calendar size={18} className="text-purple-400" /></div><div><p className="text-xs text-slate-500">Date</p><p className="font-bold text-sm">{new Date(bookingData.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div></div>
                                    <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><Users size={18} className="text-green-400" /></div><div><p className="text-xs text-slate-500">Travelers</p><p className="font-bold text-sm">{bookingData.travelers} person(s)</p></div></div>
                                </div>
                            </div>

                            {/* Contact & Travelers Summary */}
                            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 space-y-3">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Contact & Travelers</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                    <div><span className="text-slate-500">Lead:</span> <span className="font-medium">{bookingData.name}</span></div>
                                    <div><span className="text-slate-500">Email:</span> <span className="font-medium">{bookingData.email}</span></div>
                                    <div><span className="text-slate-500">Phone:</span> <span className="font-medium">+{bookingData.phone}</span></div>
                                </div>
                                <div className="pt-2 border-t border-white/5 space-y-1">
                                    {bookingData.travelersList.map((t, i) => (
                                        <p key={i} className="text-xs text-slate-400">
                                            <span className="text-slate-500">Traveler {i + 1}:</span>{' '}
                                            {`${t.firstName} ${t.middleName || ''} ${t.lastName}`.trim() || 'N/A'}
                                            {t.gender && ` • ${t.gender}`}
                                            {t.dob && ` • DOB: ${t.dob}`}
                                            {t.selectedDocType && ` • Doc: ${t.selectedDocType}`}
                                        </p>
                                    ))}
                                </div>
                                {bookingData.specialRequests && (
                                    <div className="pt-2 border-t border-white/5 text-sm">
                                        <span className="text-slate-500">Special Requests:</span>
                                        <p className="text-slate-300 mt-1">{bookingData.specialRequests}</p>
                                    </div>
                                )}
                            </div>

                            {/* Price Breakdown */}
                            <div className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-white/10 rounded-2xl p-5 space-y-3">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Price Breakdown</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm"><span className="text-slate-400">Tour Package ({bookingData.travelers} × ₹{pkg.price?.toLocaleString()})</span><span className="font-medium">₹{tourTotal.toLocaleString()}</span></div>
                                    {selectedHotel && (
                                        <>
                                            <div className="flex justify-between text-sm"><span className="text-slate-400">Hotel: {selectedHotel.name}</span><span className="font-medium">₹{hotelTotal.toLocaleString()}</span></div>
                                            <div className="flex justify-between text-sm text-green-400"><span>Bundle Discount (15%)</span><span>-₹{bundleDiscount.toLocaleString()}</span></div>
                                        </>
                                    )}
                                    <div className="border-t border-white/10 pt-3 mt-3 flex justify-between items-center">
                                        <span className="font-bold text-lg">Total</span>
                                        <span className="font-bold text-2xl text-blue-400">₹{finalTotal.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Trust */}
                            <div className="flex flex-wrap items-center justify-center gap-6 py-2 text-xs text-slate-500">
                                <span className="flex items-center gap-1"><Shield size={14} className="text-green-500" /> Secure Booking</span>
                                <span className="flex items-center gap-1"><Star size={14} className="text-amber-400" /> Trusted by 1000+ travelers</span>
                                <span className="flex items-center gap-1"><CheckCircle size={14} className="text-blue-400" /> Instant Confirmation</span>
                            </div>

                            <div className="flex justify-between pt-4">
                                <button onClick={prevStep} className="text-slate-400 hover:text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors hover:bg-white/5">
                                    <ArrowLeft size={18} /> Back
                                </button>
                                <button onClick={handleConfirm} disabled={submitting} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-10 py-4 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-[1.02] shadow-xl shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
                                    {submitting ? <><Loader size={20} className="animate-spin" /> Processing...</> : <>Confirm & Pay ₹{finalTotal.toLocaleString()}</>}
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default BookingPage;
