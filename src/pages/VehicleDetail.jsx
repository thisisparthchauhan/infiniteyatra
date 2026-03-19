import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TransportationBookingDrawer from '../components/TransportationBookingDrawer';
import CarBookingDrawer from '../components/CarBookingDrawer';
import { motion } from 'framer-motion';
import { 
  ArrowRight, ShieldCheck, Map, Clock, 
  Users, Briefcase, Zap, Heart, Wind, 
  Target, Anchor, Coffee, Star, Car 
} from 'lucide-react';

const vehicleConfig = {
  cycles: {
    name: "Cycles",
    tagline: "Eco-friendly rides for short, scenic distances.",
    accent: "from-green-500 to-emerald-400",
    bgAccent: "bg-green-500/20",
    textAccent: "text-green-500",
    borderAccent: "group-hover:border-green-500/50",
    image: "https://images.unsplash.com/photo-1511994298241-608e28f14fde?auto=format&fit=crop&q=80&w=1920",
    price: "₹50 / hr",
    features: [
      { icon: Heart, title: "Eco-Friendly", desc: "Zero emissions, 100% healthy travel." },
      { icon: Map, title: "City Explorer", desc: "Perfect for narrow lanes & parks." },
      { icon: Clock, title: "Flexible Rent", desc: "Rent by the hour or the whole day." }
    ]
  },
  bikes: {
    name: "Bikes / Scooters",
    tagline: "Fast, flexible, and ready for the urban maze.",
    accent: "from-orange-500 to-amber-400",
    bgAccent: "bg-orange-500/20",
    textAccent: "text-orange-500",
    borderAccent: "group-hover:border-orange-500/50",
    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=1920",
    price: "₹150 / hr",
    features: [
      { icon: Zap, title: "Quick Commute", desc: "Beat the traffic effortlessly." },
      { icon: ShieldCheck, title: "Helmets Included", desc: "Safety gear provided with every ride." },
      { icon: Map, title: "Unlimited KM", desc: "Go as far as you want, no limits." }
    ]
  },
  cars: {
    name: "Cars",
    tagline: "Premium, sleek, and comfortable for any occasion.",
    accent: "from-blue-600 to-cyan-400",
    bgAccent: "bg-blue-600/20",
    textAccent: "text-blue-500",
    borderAccent: "group-hover:border-blue-500/50",
    image: "https://images.unsplash.com/photo-1503376710356-748c1f11f9ae?auto=format&fit=crop&q=80&w=1920",
    price: "₹800 / day",
    features: [
      { icon: Target, title: "Self-Drive Available", desc: "Take the wheel and drive your way." },
      { icon: Wind, title: "AC & Non-AC", desc: "Climate control for every budget." },
      { icon: Map, title: "GPS Included", desc: "Never lose your way with built-in nav." }
    ]
  },
  traveller: {
    name: "Tempo Traveller",
    tagline: "Spacious comfort for group and family journeys.",
    accent: "from-yellow-500 to-amber-400",
    bgAccent: "bg-yellow-500/20",
    textAccent: "text-yellow-500",
    borderAccent: "group-hover:border-yellow-500/50",
    image: "/assets/transport/red-van-nature.jpg",
    price: "₹25 / km",
    features: [
      { icon: Users, title: "8-20 Seater", desc: "Ample space for everyone and their luggage." },
      { icon: Wind, title: "AC Comfort", desc: "Individual AC vents for all passengers." },
      { icon: Briefcase, title: "Corporate Bookings", desc: "Ideal for team offsites and events." }
    ]
  },
  bus: {
    name: "Buses",
    tagline: "Safe, reliable, and affordable bulk transit.",
    accent: "from-teal-500 to-emerald-400",
    bgAccent: "bg-teal-500/20",
    textAccent: "text-teal-500",
    borderAccent: "group-hover:border-teal-500/50",
    image: "/assets/transport/bus.jpg",
    price: "₹45 / km",
    features: [
      { icon: Users, title: "Large Capacity", desc: "30-50 seater options available." },
      { icon: ShieldCheck, title: "Expert Drivers", desc: "Verified professionals for safe long hauls." },
      { icon: Coffee, title: "Pushback Seats", desc: "Reclining seats for maximum comfort." }
    ]
  },
  trains: {
    name: "Trains",
    tagline: "Classic, rhythmic long-distance rail journeys.",
    accent: "from-indigo-600 to-purple-500",
    bgAccent: "bg-indigo-600/20",
    textAccent: "text-indigo-400",
    borderAccent: "group-hover:border-indigo-500/50",
    image: "/assets/transport/jaden-william-qVeqpMrZQGk-unsplash.jpg",
    price: "₹300 / ticket",
    features: [
      { icon: Map, title: "Pan-India Routes", desc: "Extensive network connecting major cities." },
      { icon: Coffee, title: "Pantry Options", desc: "On-board catering on select trains." },
      { icon: Star, title: "Classes", desc: "Sleeper, 3AC, 2AC, and 1st Class options." }
    ]
  },
  flights: {
    name: "Flights",
    tagline: "Fast domestic & scenic charter flights to the clouds.",
    accent: "from-sky-500 to-cyan-400",
    bgAccent: "bg-sky-500/20",
    textAccent: "text-sky-400",
    borderAccent: "group-hover:border-sky-500/50",
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=1920",
    price: "₹2500 / trip",
    features: [
      { icon: Zap, title: "Fastest Travel", desc: "Minimize travel time across the country." },
      { icon: Briefcase, title: "Luggage Perks", desc: "Extra baggage options on select airlines." },
      { icon: Clock, title: "Zero Delays", desc: "Prioritized on-time performance." }
    ]
  },
  'jet-planes': {
    name: "Private Jets",
    tagline: "The ultimate luxury, privacy, and speed.",
    accent: "from-amber-600 to-yellow-400",
    bgAccent: "bg-amber-600/20",
    textAccent: "text-amber-500",
    borderAccent: "group-hover:border-amber-500/50",
    image: "https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&q=80&w=1920",
    price: "On Request",
    features: [
      { icon: Star, title: "VIP Treatment", desc: "Exclusive lounges and priority boarding." },
      { icon: Coffee, title: "Gourmet Meals", desc: "Personalized menus crafted by top chefs." },
      { icon: Clock, title: "Your Schedule", desc: "Fly exactly when you want, where you want." }
    ]
  },
  cruise: {
    name: "Cruises",
    tagline: "A floating resort for luxury sea journeys.",
    accent: "from-cyan-600 to-blue-400",
    bgAccent: "bg-cyan-600/20",
    textAccent: "text-cyan-400",
    borderAccent: "group-hover:border-cyan-500/50",
    image: "/assets/transport/cruise.jpg",
    price: "₹15,000 / trip",
    features: [
      { icon: Anchor, title: "All-Inclusive", desc: "Meals, stay, and entertainment covered." },
      { icon: Target, title: "Activities Excursions", desc: "Pools, casinos, and shore visits." },
      { icon: Star, title: "Luxury Cabins", desc: "Ocean-view staterooms and suites." }
    ]
  }
};

const vehicleImages = {
  cycles: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=1600',
  bikes: 'https://images.unsplash.com/photo-1558980394-0a06c4631733?w=1600',
  cars: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1600',
  traveller: '/assets/transport/red-van-nature.jpg',
  bus: '/assets/transport/bus.jpg',
  trains: '/assets/transport/jaden-william-qVeqpMrZQGk-unsplash.jpg',
  flights: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600',
  'jet-planes': 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=1600',
  cruise: '/assets/transport/cruise.jpg',
};

export default function VehicleDetail() {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCarDrawerOpen, setIsCarDrawerOpen] = useState(false);
  
  const vehicle = vehicleConfig[vehicleId];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [vehicleId]);

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white flex-col">
        <h1 className="text-4xl font-bold mb-4">Vehicle Not Found</h1>
        <button 
          onClick={() => navigate('/transportation')}
          className="px-6 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
        >
          Return to Transportation Hub
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white relative font-sans overflow-x-hidden pt-16">
      
      {/* 1. HERO SECTION */}
      <section 
        className="relative h-screen min-h-[600px] w-full flex items-center justify-center overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url('${vehicleImages[vehicleId] || vehicle.image}')`
        }}
      >
        {/* Background Overlay */}
        <div className="absolute inset-0 z-0"></div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto flex flex-col items-center">
           {/* Floating Badge */}
           <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className={`inline-flex items-center px-4 py-2 rounded-full mb-6 border border-white/10 backdrop-blur-md ${vehicle.bgAccent} shadow-lg`}
          >
            <span className={`w-2 h-2 rounded-full bg-current mr-2 animate-pulse ${vehicle.textAccent}`}></span>
            <span className="text-sm font-medium tracking-wide">Available Now ↓</span>
          </motion.div>

          {/* Shimmer / Glitch Text */}
          <h1 className="text-6xl md:text-8xl font-black mb-6 uppercase tracking-tighter relative group cursor-default">
            {/* Base Layer */}
            <span className={`bg-clip-text text-transparent bg-gradient-to-r ${vehicle.accent} relative z-10`}>
              {vehicle.name}
            </span>
            {/* Shimmer / Ghost Layer */}
            <span 
              className={`absolute top-0 left-0 -ml-[2px] mt-[1px] bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500 opacity-60 mix-blend-screen z-[-1] animate-[pulse_2s_infinite]`}
            >
              {vehicle.name}
            </span>
             {/* Glow Layer */}
             <span className={`absolute inset-0 bg-gradient-to-r ${vehicle.accent} blur-2xl opacity-30 z-[-2]`}></span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 max-w-2xl font-light">
            {vehicle.tagline}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        
        {/* 2. FEATURES SECTION */}
        <section className="mb-32 relative">
           <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose <span className={vehicle.textAccent}>{vehicle.name}</span>?</h2>
            <div className={`w-24 h-1 mx-auto bg-gradient-to-r ${vehicle.accent} rounded-full`}></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {vehicle.features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={idx}
                  whileHover={{ rotateX: 5, rotateY: -5, y: -5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  style={{ perspective: 1000 }}
                  className={`group bg-[#111119] p-8 rounded-2xl border border-gray-800 transition-all duration-300 ${vehicle.borderAccent} shadow-xl hover:shadow-2xl`}
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 bg-[#1a1a24] border border-gray-800 relative`}>
                     <div className={`absolute inset-0 bg-gradient-to-r ${vehicle.accent} opacity-0 group-hover:opacity-20 blur-md transition-opacity rounded-xl`}></div>
                     <Icon className={`w-7 h-7 ${vehicle.textAccent} relative z-10`} />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* 3. HOW IT WORKS */}
        <section className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
             <div className="w-16 h-1 mx-auto bg-gray-700 rounded-full"></div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative">
            {/* Connecting Line (Desktop) */}
            <div className={`hidden md:block absolute top-1/2 left-0 w-full h-[2px] bg-gradient-to-r ${vehicle.accent} opacity-20 -z-10 -translate-y-1/2`}></div>

            {[
              { step: "01", title: "Choose your route", desc: "Select pickup & drop-off locations." },
              { step: "02", title: "Pick specifics", desc: "Choose vehicle models & extra options." },
              { step: "03", title: "Confirm & Pay", desc: "Secure your ride with a small advance." }
            ].map((item, idx) => (
              <div key={idx} className="flex-1 bg-[#15151e]/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-800 border-t-white/5 relative w-full text-center">
                <div className={`absolute -top-6 left-1/2 -translate-x-1/2 flex items-center justify-center w-12 h-12 rounded-full bg-[#0a0a0f] border-2 border-gray-800 ${vehicle.textAccent} font-black text-xl`}>
                  {item.step}
                </div>
                <h4 className="text-lg font-bold text-white mb-2 mt-4">{item.title}</h4>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 4. PRICING & CTA DESKTOP */}
        <section className="bg-gradient-to-b from-[#111119] to-[#0a0a0f] rounded-3xl p-8 md:p-16 border border-gray-800 text-center mb-24 relative overflow-hidden">
           {/* Decorative bg element */}
           <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${vehicle.accent} opacity-10 blur-[100px] rounded-full`}></div>
           <div className={`absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr ${vehicle.accent} opacity-5 blur-[100px] rounded-full`}></div>

           <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to ride?</h2>
              <div className="flex items-center justify-center gap-4 mb-10">
                <span className="text-gray-400 text-lg">Starting from</span>
                <span className={`text-4xl md:text-5xl font-black ${vehicle.textAccent}`}>{vehicle.price}</span>
              </div>

              {/* With Driver button for Cars */}
              {vehicleId === 'cars' && (
                <button 
                  onClick={() => setIsCarDrawerOpen(true)}
                  className="hidden md:inline-flex items-center justify-center px-10 py-5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all duration-300 group mr-4 mb-4"
                >
                  <Car className="mr-3 w-6 h-6" /> Book Cars → With Driver
                  <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </button>
              )}

              <button 
                onClick={() => setIsDrawerOpen(true)}
                className={`hidden md:inline-flex items-center justify-center px-10 py-5 rounded-full bg-gradient-to-r ${vehicle.accent} text-white font-bold text-lg hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all duration-300 group`}
              >
                Book {vehicle.name}
                <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </button>
           </div>
        </section>

      </div>

      {/* 5. MOBILE STICKY BOOKING BUTTON */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-50 flex flex-col gap-2">
        {vehicleId === 'cars' && (
          <button 
            onClick={() => setIsCarDrawerOpen(true)}
            className="w-full flex items-center justify-between px-6 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg shadow-[0_10px_40px_rgba(0,0,0,0.5)] active:scale-95 transition-transform"
          >
             <span className="flex items-center gap-2"><Car className="w-5 h-5" /> With Driver</span>
             <ArrowRight className="w-6 h-6 animate-pulse" />
          </button>
        )}
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className={`w-full flex items-center justify-between px-6 py-4 rounded-xl bg-gradient-to-r ${vehicle.accent} text-white font-bold text-lg shadow-[0_10px_40px_rgba(0,0,0,0.5)] active:scale-95 transition-transform`}
        >
           <span>Book Now</span>
           <ArrowRight className="w-6 h-6 animate-pulse" />
        </button>
      </div>

      <TransportationBookingDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        vehicle={vehicle} 
        vehicleId={vehicleId} 
      />

      <CarBookingDrawer 
        isOpen={isCarDrawerOpen} 
        onClose={() => setIsCarDrawerOpen(false)} 
      />
    </div>
  );
}
