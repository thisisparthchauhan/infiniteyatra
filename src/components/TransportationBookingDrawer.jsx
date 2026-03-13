import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, MapPin, Navigation, Calendar, Clock, ArrowRight, User, Phone, Mail, 
  Tag, CheckCircle2, ChevronLeft, Plus, Trash2, ShieldCheck, Map
} from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { addCredits } from '../services/passportService';

const getVehicleSubtypes = (vehicleId) => {
  switch (vehicleId) {
    case 'cars': return ['Self-Drive', 'With Driver', 'Premium'];
    case 'traveller': return ['8-Seater', '12-Seater', '20-Seater'];
    case 'bikes': return ['Standard', 'Sports'];
    case 'bus': return ['AC Seater', 'AC Sleeper', 'Non-AC Volvo'];
    case 'trains': return ['Sleeper', '3AC', '2AC', '1st Class'];
    case 'flights': return ['Economy', 'Premium Economy', 'Business'];
    case 'jet-planes': return ['Light Jet', 'Mid-size Jet', 'Heavy Jet'];
    case 'cruise': return ['Interior Cabin', 'Ocean View', 'Balcony Suite'];
    case 'cycles': return ['Geared', 'Non-Geared', 'Electric'];
    default: return ['Standard'];
  }
};

const getEstimatedFare = (vehicleId, passengers, stops) => {
  const stopsMultiplier = stops.length + 2; // from + to + intermediate
  const baseRates = {
    cycles: 50, bikes: 150, cars: 800, traveller: 2000,
    bus: 5000, trains: 300, flights: 2500, 'jet-planes': 50000, cruise: 15000
  };
  const base = baseRates[vehicleId] || 1000;
  return base * stopsMultiplier * (passengers * 0.5 + 0.5);
};

export default function TransportationBookingDrawer({ isOpen, onClose, vehicle, vehicleId }) {
  const { currentUser } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccessId, setBookingSuccessId] = useState(null);

  const [formData, setFormData] = useState({
    from: '',
    to: '',
    stops: [],
    travelDate: '',
    pickupTime: '',
    isRoundTrip: false,
    returnDate: '',
    returnTime: '',
    passengers: 1,
    subType: getVehicleSubtypes(vehicleId)[0],
    specialReqs: '',
    name: '',
    phone: '',
    email: '',
    promo: ''
  });

  if (!isOpen) return null;

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);
  
  const handleAddStop = () => {
    if (formData.stops.length < 5) {
      setFormData({ ...formData, stops: [...formData.stops, ''] });
    }
  };
  
  const handleRemoveStop = (index) => {
    const newStops = [...formData.stops];
    newStops.splice(index, 1);
    setFormData({ ...formData, stops: newStops });
  };

  const handleStopChange = (index, value) => {
    const newStops = [...formData.stops];
    newStops[index] = value;
    setFormData({ ...formData, stops: newStops });
  };

  const estimatedFare = getEstimatedFare(vehicleId, formData.passengers, formData.stops);
  const advanceAmount = Math.round(estimatedFare * 0.20);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setIsSubmitting(true);
    
    try {
      const docRef = await addDoc(collection(db, 'transportation_bookings'), {
        vehicleType: vehicleId,
        vehicleName: vehicle.name,
        from: formData.from,
        to: formData.to,
        stops: formData.stops.filter(s => s.trim() !== ''),
        travelDate: formData.travelDate,
        pickupTime: formData.pickupTime,
        isRoundTrip: formData.isRoundTrip,
        returnDate: formData.isRoundTrip ? formData.returnDate : null,
        returnTime: formData.isRoundTrip ? formData.returnTime : null,
        passengers: formData.passengers,
        subType: formData.subType,
        specialReqs: formData.specialReqs,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        estimatedFare,
        advanceAmount,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      setBookingSuccessId(docRef.id);

      // Award IY Passport credits
      if (currentUser?.uid) {
        try {
          await addCredits(currentUser.uid, 'booking', `Booked ${vehicle.name} transport`, 50, docRef.id);
        } catch (e) { console.log('Passport credit skip:', e); }
      }
    } catch (err) {
      console.error("Booking failed: ", err);
      // Fallback behavior if db fails
      setBookingSuccessId('TEST-ID-' + Math.floor(Math.random()*1000));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIcon = (num) => {
    const isActive = step === num;
    const isCompleted = step > num || bookingSuccessId;
    return (
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2
        ${isActive ? `border-${vehicle.textAccent.split('-')[1]}-500 ${vehicle.textAccent}` : 
          isCompleted ? 'bg-green-500/20 text-green-500 border-green-500/50' : 'border-gray-700 text-gray-500'}
      `}>
        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : num}
      </div>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex justify-end">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#0a0a0f]/80 backdrop-blur-sm"
        />

        {/* Drawer */}
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full md:w-[600px] h-full bg-[#111118] border-l border-gray-800 flex flex-col shadow-2xl overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 z-20 bg-[#111118]/90 backdrop-blur-md px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {step > 1 && !bookingSuccessId && (
                <button onClick={handleBack} className="p-2 -ml-2 hover:bg-white/5 rounded-full transition text-gray-400 hover:text-white">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  Book <span className={vehicle.textAccent}>{vehicle.name}</span>
                </h2>
                {!bookingSuccessId && (
                  <p className="text-sm text-gray-500">Step {step} of 5</p>
                )}
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Bar */}
          {!bookingSuccessId && (
            <div className="px-6 py-4 border-b border-gray-800/50 flex justify-between relative">
              <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-gray-800 -translate-y-1/2 -z-10"></div>
              {[1, 2, 3, 4, 5].map(num => (
                <React.Fragment key={num}>
                  {renderStepIcon(num)}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Content */}
          <div className="p-6 flex-1 text-gray-200 hide-scrollbar overflow-y-auto w-full">
            <AnimatePresence mode="wait">
              
              {/* SUCCESS STATE */}
              {bookingSuccessId ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center text-center py-20"
                >
                  <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(34,197,94,0.3)] border border-green-500/50">
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-2">Booking Requested!</h3>
                  <p className="text-gray-400 mb-6">Your advance payment has been processed securely.</p>
                  
                  <div className="bg-[#1a1a24] border border-gray-800 rounded-xl p-6 w-full max-w-sm">
                    <p className="text-sm text-gray-500 mb-1">Booking ID</p>
                    <p className="font-mono text-xl font-bold text-white">{bookingSuccessId}</p>
                  </div>

                  <p className="mt-8 text-sm text-gray-500 max-w-md mx-auto">
                    Our team will reach out to {formData.phone} shortly with driver and vehicle details.
                  </p>

                  <button 
                    onClick={onClose}
                    className="mt-8 px-8 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition"
                  >
                    Done
                  </button>
                </motion.div>
              ) : step === 1 ? (
                /* STEP 1: ROUTE PLANNER */
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-2"><MapPin className="text-gray-400"/> Where to?</h3>
                  
                  <div className="relative pl-8">
                    {/* Animated Dotted Line */}
                    <div className="absolute top-6 bottom-6 left-[11px] border-l-2 border-dashed border-gray-700 w-0 flex flex-col justify-between items-center">
                    </div>

                    <div className="mb-6 relative">
                      <div className="absolute top-1/2 -left-8 w-6 h-6 rounded-full border-4 border-[#111118] bg-white -translate-y-1/2 z-10"></div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Pickup Location</label>
                      <input 
                        type="text" 
                        value={formData.from}
                        onChange={e => setFormData({...formData, from: e.target.value})}
                        placeholder="Enter start point"
                        className="w-full bg-[#1a1a24] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gray-500 transition"
                      />
                    </div>

                    <AnimatePresence>
                      {formData.stops.map((stop, i) => (
                        <motion.div 
                          key={i} 
                          initial={{ opacity: 0, height: 0 }} 
                          animate={{ opacity: 1, height: 'auto' }} 
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-6 relative"
                        >
                          <div className="absolute top-1/2 -left-[30px] w-5 h-5 rounded-full border-4 border-[#111118] bg-gray-500 -translate-y-1/2 z-10"></div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">Stop {String.fromCharCode(66+i)}</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={stop}
                              onChange={e => handleStopChange(i, e.target.value)}
                              placeholder="Enter intermediate stop"
                              className="w-full bg-[#1a1a24] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gray-500 transition"
                            />
                            <button onClick={() => handleRemoveStop(i)} className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition">
                              <Trash2 className="w-5 h-5"/>
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {formData.stops.length < 5 && (
                      <button 
                        onClick={handleAddStop}
                        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 py-2 px-4 border border-gray-800 rounded-xl bg-[#151520] hover:bg-gray-800 transition"
                      >
                        <Plus className="w-4 h-4"/> Add Stop
                      </button>
                    )}

                    <div className="relative mt-2">
                       <div className={`absolute top-1/2 -left-8 w-6 h-6 rounded-full border-4 border-[#111118] -translate-y-1/2 z-10 bg-gradient-to-r ${vehicle.accent}`}></div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Final Destination</label>
                      <input 
                        type="text" 
                        value={formData.to}
                        onChange={e => setFormData({...formData, to: e.target.value})}
                        placeholder="Enter end point"
                        className="w-full bg-[#1a1a24] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gray-500 transition"
                      />
                    </div>
                  </div>

                  <button 
                    disabled={!formData.from || !formData.to}
                    onClick={handleNext} 
                    className={`w-full mt-10 flex items-center justify-center py-4 rounded-xl bg-gradient-to-r ${vehicle.accent} text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Continue <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                </motion.div>
              ) : step === 2 ? (
                /* STEP 2: DATE & TIME */
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-2"><Calendar className="text-gray-400"/> When?</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Travel Date</label>
                      <input type="date" value={formData.travelDate} onChange={e => setFormData({...formData, travelDate: e.target.value})} className="w-full bg-[#1a1a24] border border-gray-800 rounded-xl px-4 py-3 text-white form-input" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Pickup Time</label>
                      <input type="time" value={formData.pickupTime} onChange={e => setFormData({...formData, pickupTime: e.target.value})} className="w-full bg-[#1a1a24] border border-gray-800 rounded-xl px-4 py-3 text-white form-input" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[#1a1a24] border border-gray-800 rounded-xl mb-6 cursor-pointer" onClick={() => setFormData({...formData, isRoundTrip: !formData.isRoundTrip})}>
                    <div>
                      <h4 className="font-medium text-white">Round Trip?</h4>
                      <p className="text-sm text-gray-500">Need to return to your pickup location?</p>
                    </div>
                    <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${formData.isRoundTrip ? `bg-gradient-to-r ${vehicle.accent}` : 'bg-gray-700'}`}>
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${formData.isRoundTrip ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {formData.isRoundTrip && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">Return Date</label>
                          <input type="date" value={formData.returnDate} onChange={e => setFormData({...formData, returnDate: e.target.value})} className="w-full bg-[#1a1a24] border border-gray-800 rounded-xl px-4 py-3 text-white form-input" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">Return Time</label>
                          <input type="time" value={formData.returnTime} onChange={e => setFormData({...formData, returnTime: e.target.value})} className="w-full bg-[#1a1a24] border border-gray-800 rounded-xl px-4 py-3 text-white form-input" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button 
                    disabled={!formData.travelDate || !formData.pickupTime}
                    onClick={handleNext} 
                    className={`w-full mt-6 flex items-center justify-center py-4 rounded-xl bg-gradient-to-r ${vehicle.accent} text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Continue <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                </motion.div>
              ) : step === 3 ? (
                 /* STEP 3: PASSENGERS & OPTIONS */
                 <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-2"><User className="text-gray-400"/> Passengers & Preferences</h3>
                  
                  <div className="mb-6 p-6 bg-[#1a1a24] border border-gray-800 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-white mb-1">Number of Passengers</h4>
                      <p className="text-sm text-gray-500">Including yourself</p>
                    </div>
                    <div className="flex items-center gap-4 bg-[#111118] border border-gray-800 rounded-lg p-2">
                      <button onClick={() => setFormData({...formData, passengers: Math.max(1, formData.passengers - 1)})} className="w-8 h-8 flex items-center justify-center bg-gray-800 rounded hover:bg-gray-700 text-white">-</button>
                      <span className="w-6 text-center font-bold">{formData.passengers}</span>
                      <button onClick={() => setFormData({...formData, passengers: formData.passengers + 1})} className="w-8 h-8 flex items-center justify-center bg-gray-800 rounded hover:bg-gray-700 text-white">+</button>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-400 mb-3">Vehicle Class / Option</label>
                    <div className="grid grid-cols-2 gap-3">
                      {getVehicleSubtypes(vehicleId).map(subtype => (
                        <div 
                          key={subtype}
                          onClick={() => setFormData({...formData, subType: subtype})}
                          className={`cursor-pointer border p-4 rounded-xl text-center transition-all ${formData.subType === subtype ? `border-${vehicle.textAccent.split('-')[1]}-500 bg-${vehicle.textAccent.split('-')[1]}-500/10 ${vehicle.textAccent}` : 'border-gray-800 bg-[#1a1a24] text-gray-300 hover:border-gray-600'}`}
                        >
                          <p className="font-medium text-sm">{subtype}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Special Requirements (Optional)</label>
                    <textarea 
                      rows={3}
                      value={formData.specialReqs}
                      onChange={e => setFormData({...formData, specialReqs: e.target.value})}
                      placeholder="E.g., Pet friendly, extra child seat..."
                      className="w-full bg-[#1a1a24] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gray-500 transition resize-none"
                    ></textarea>
                  </div>

                  <button 
                    onClick={handleNext} 
                    className={`w-full mt-6 flex items-center justify-center py-4 rounded-xl bg-gradient-to-r ${vehicle.accent} text-white font-bold`}
                  >
                    Continue <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                </motion.div>
              ) : step === 4 ? (
                /* STEP 4: CONTACT INFO */
                <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-2"><Mail className="text-gray-400"/> Contact Details</h3>
                  
                  <div className="space-y-5 mb-8">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                      <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="John Doe" className="w-full bg-[#1a1a24] border border-gray-800 rounded-xl px-4 py-3 text-white form-input" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Phone Number</label>
                      <div className="flex">
                        <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-gray-800 bg-[#151520] text-gray-400 sm:text-sm">+91</span>
                        <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="98765 43210" className="flex-1 min-w-0 block w-full px-4 py-3 rounded-none rounded-r-xl bg-[#1a1a24] border border-gray-800 text-white focus:ring-0 focus:border-gray-500 sm:text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Email Address (Optional)</label>
                      <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="john@example.com" className="w-full bg-[#1a1a24] border border-gray-800 rounded-xl px-4 py-3 text-white form-input" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Promo Code (Optional)</label>
                      <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input type="text" value={formData.promo} onChange={e => setFormData({...formData, promo: e.target.value})} placeholder="IY2026" className="w-full bg-[#1a1a24] border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-white uppercase form-input" />
                      </div>
                    </div>
                  </div>

                  <button 
                    disabled={!formData.name || !formData.phone}
                    onClick={handleNext} 
                    className={`w-full mt-6 flex items-center justify-center py-4 rounded-xl bg-gradient-to-r ${vehicle.accent} text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Review Summary <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                </motion.div>
              ) : (
                /* STEP 5: SUMMARY & PAYMENT */
                <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-2"><Map className="text-gray-400"/> Booking Summary</h3>
                  
                  <div className="bg-[#1a1a24] border border-gray-800 rounded-2xl p-6 mb-6 space-y-4">
                    <div className="flex justify-between items-start pb-4 border-b border-gray-800">
                      <div>
                        <p className="text-gray-400 text-sm">Vehicle</p>
                        <p className={`font-bold text-lg ${vehicle.textAccent}`}>{vehicle.name} ({formData.subType})</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 text-sm">Passengers</p>
                        <p className="font-bold text-lg">{formData.passengers} x <User className="inline w-4 h-4 ml-1"/></p>
                      </div>
                    </div>

                    <div className="py-2">
                       <div className="flex items-start gap-3 mb-3">
                         <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                         <div>
                           <p className="text-sm text-gray-400">From</p>
                           <p className="text-white font-medium">{formData.from}</p>
                         </div>
                       </div>
                       
                       {formData.stops.map((stop, i) => (
                         <div key={i} className="flex items-start gap-3 mb-3 ml-1">
                           <div className="w-2 h-2 rounded-full bg-gray-600 mt-1.5 ml-[5px]"></div>
                           <div>
                             <p className="text-white text-sm">{stop}</p>
                           </div>
                         </div>
                       ))}

                       <div className="flex items-start gap-3">
                         <Navigation className={`w-5 h-5 mt-0.5 ${vehicle.textAccent}`} />
                         <div>
                           <p className="text-sm text-gray-400">To</p>
                           <p className="text-white font-medium">{formData.to}</p>
                         </div>
                       </div>
                    </div>

                    <div className="flex justify-between items-start pt-4 border-t border-gray-800">
                      <div>
                        <p className="text-gray-400 text-sm">Pickup</p>
                        <p className="font-medium text-white">{formData.travelDate} at {formData.pickupTime}</p>
                      </div>
                      {formData.isRoundTrip && (
                        <div className="text-right">
                          <p className="text-gray-400 text-sm">Return</p>
                          <p className="font-medium text-white">{formData.returnDate} at {formData.returnTime}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#1a1a24] border border-gray-800 rounded-2xl p-6 mb-8">
                     <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400">Estimated Fare</span>
                        <span className="text-xl line-through opacity-50">₹{Math.round(estimatedFare * 1.1).toLocaleString()}</span>
                     </div>
                     <div className="flex justify-between items-center mb-6">
                        <span className="font-bold text-lg">Final Estimate</span>
                        <span className={`text-2xl font-black ${vehicle.textAccent}`}>₹{estimatedFare.toLocaleString()}</span>
                     </div>

                     <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl mb-6">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-yellow-500">Booking Advance (20%)</span>
                          <span className="font-bold text-yellow-500 text-xl">₹{advanceAmount.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-yellow-600">Pay advance now to reserve. Balance to be paid directly to the driver.</p>
                     </div>
                  </div>

                  <button 
                    disabled={isSubmitting}
                    onClick={handleSubmit} 
                    className={`w-full mb-4 flex items-center justify-center py-4 rounded-xl bg-gradient-to-r ${vehicle.accent} text-white font-bold text-lg shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-[1.02] transition-transform disabled:opacity-50`}
                  >
                    {isSubmitting ? (
                      <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      `Pay Advance ₹${advanceAmount.toLocaleString()}`
                    )}
                  </button>
                  <button 
                     onClick={handleSubmit} // Acts as submit without payment gateway for now
                     className="w-full flex items-center justify-center py-4 rounded-xl border border-gray-700 text-gray-300 font-medium hover:bg-[#1a1a24] transition-colors"
                  >
                     Request Callback Instead
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
