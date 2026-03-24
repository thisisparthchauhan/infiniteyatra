import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const LinkedVehicleCard = ({ vehicle, routeHint, packageName }) => {
  const navigate = useNavigate();
  const [checkDate, setCheckDate] = useState('');
  const [availability, setAvailability] = useState(null); // null | 'available' | 'booked'
  const [checking, setChecking] = useState(false);

  const vehicleImage = vehicle.images?.[0] || 
    `https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400`;

  const checkAvailability = async (date) => {
    if (!date) return;
    setChecking(true);
    
    try {
      // Check transportation_bookings for this vehicle on this date
      const bookingsSnap = await getDocs(query(
        collection(db, 'transportation_bookings'),
        where('vehicleId', '==', vehicle.id),
        where('status', 'in', ['confirmed', 'pending'])
      ));
      
      const bookings = bookingsSnap.docs.map(d => d.data());
      const selectedDate = new Date(date);
      // Strip time from selected date for accurate comparison
      selectedDate.setHours(0, 0, 0, 0);
      
      const isBooked = bookings.some(booking => {
        const start = new Date(booking.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(booking.endDate);
        end.setHours(23, 59, 59, 999);
        return selectedDate >= start && selectedDate <= end;
      });
      
      setAvailability(isBooked ? 'booked' : 'available');
    } catch (err) {
      console.error(err);
    } finally {
      setChecking(false);
    }
  };

  const handleDateChange = (e) => {
    setCheckDate(e.target.value);
    setAvailability(null);
    if (e.target.value) checkAvailability(e.target.value);
  };

  const buildWhatsAppMessage = () => {
    const base = packageName
      ? `Hi! I'm interested in booking a *${vehicle.vehicleType}* for the *${packageName}* package.`
      : `Hi! I'm interested in booking a *${vehicle.vehicleType}*.`;
    
    const routePart = routeHint ? `\nRoute: ${routeHint}` : '';
    const datePart = checkDate ? `\nDate: ${checkDate}` : '';
    
    return `${base}${routePart}${datePart}\n\nCapacity: ${vehicle.capacity} seats\nPlease share availability and pricing for this journey.`;
  };

  return (
    <div className="linked-vehicle-card">
      {/* Vehicle Image */}
      <div className="vehicle-card-image">
        <img src={vehicleImage} alt={vehicle.vehicleType} loading="lazy" />
        <div className="iy-fleet-badge">★ IY FLEET</div>
        {vehicle.category && (
          <div className="vehicle-category-tag">{vehicle.category}</div>
        )}
      </div>

      {/* Card Body */}
      <div className="vehicle-card-body">
        {/* Name + Capacity */}
        <div className="vehicle-card-header">
          <h3 className="vehicle-name">{vehicle.vehicleType}</h3>
          <span className="vehicle-capacity">👥 {vehicle.capacity} seats</span>
        </div>

        {/* Route hint */}
        {routeHint && (
          <p className="vehicle-route">
            📍 {routeHint}
          </p>
        )}

        {/* Pricing */}
        <div className="vehicle-pricing">
          {vehicle.pricePerDay && (
            <div className="price-item">
              <span className="price-val">₹{vehicle.pricePerDay?.toLocaleString('en-IN')}</span>
              <span className="price-lbl">/day</span>
            </div>
          )}
          {vehicle.pricePerKm && (
            <div className="price-item">
              <span className="price-val">₹{vehicle.pricePerKm}</span>
              <span className="price-lbl">/km</span>
            </div>
          )}
        </div>

        {/* Availability Checker */}
        <div className="availability-checker">
          <label className="avail-label">Check availability</label>
          <input
            type="date"
            value={checkDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={handleDateChange}
            className="avail-date-input"
          />
          {checking && (
            <span className="avail-status checking">Checking...</span>
          )}
          {!checking && availability === 'available' && (
            <span className="avail-status available">✓ Available on this date</span>
          )}
          {!checking && availability === 'booked' && (
            <span className="avail-status booked">✗ Not available — try another date</span>
          )}
        </div>

        {/* CTAs */}
        <div className="vehicle-card-actions">
          <a
            href={`https://wa.me/919265799325?text=${encodeURIComponent(buildWhatsAppMessage())}`}
            target="_blank"
            rel="noopener noreferrer"
            className="vehicle-whatsapp-btn"
          >
            💬 Book via WhatsApp
          </a>
          <button
            className="vehicle-details-btn"
            onClick={() => navigate(`/transportation/${vehicle.id}`)}
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default LinkedVehicleCard;
