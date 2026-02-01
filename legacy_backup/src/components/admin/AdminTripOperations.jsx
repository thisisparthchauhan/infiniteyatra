import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Truck, User, Download, Send, Phone, AlertCircle, CheckCircle } from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AdminTripOperations = () => {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOperations = async () => {
            try {
                // Fetch all departures
                const depSnapshot = await getDocs(collection(db, 'departures'));

                const loadedTrips = await Promise.all(depSnapshot.docs.map(async (depDoc) => {
                    const depData = depDoc.data();

                    // Determine Package Title
                    // If stored in departure, use it. Else fetch from packages collection?
                    // For performance, we'll try to use what's available or fallback to ID
                    let packageTitle = depData.packageTitle || "Trip " + depDoc.id.slice(0, 4);

                    // If no title but has packageId, try to fetch (or rely on admin to put title in departure)

                    return {
                        id: depDoc.id,
                        packageId: depData.packageId,
                        package: packageTitle,
                        date: depData.date, // 'date' field from schema
                        travelers: depData.bookedSeats || 0,
                        maxSeats: depData.maxSeats || 12,
                        pickup_time: depData.pickupTime || '06:00 AM', // operational field
                        pickup_loc: depData.pickupLocation || 'Dehradun', // operational field
                        vehicle: depData.vehicle || null,
                        driver: depData.driverName || null,
                        driver_phone: depData.driverPhone || '',
                        status: depData.status || 'scheduled', // scheduled, in_transit, completed
                        whatsapp_sent: depData.whatsappSent || false
                    };
                }));

                // Sort by date (descending)
                loadedTrips.sort((a, b) => new Date(b.date) - new Date(a.date));

                setTrips(loadedTrips);
            } catch (error) {
                console.error("Error fetching operations:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOperations();
    }, []);

    const handleAssign = async (trip) => {
        const vehicle = prompt("Enter Vehicle Number (e.g. UK-07-AB-1234):", trip.vehicle || "");
        if (vehicle === null) return; // Cancelled

        const driverName = prompt("Enter Driver Name:", trip.driver || "");
        if (driverName === null) return;

        const driverPhone = prompt("Enter Driver Phone:", trip.driver_phone || "");
        if (driverPhone === null) return;

        // Optimistic UI Update
        const updatedTrips = trips.map(t => t.id === trip.id ? { ...t, vehicle, driver: driverName, driver_phone: driverPhone } : t);
        setTrips(updatedTrips);

        try {
            // Update Firestore 'departures' doc directly
            await updateDoc(doc(db, 'departures', trip.id), {
                vehicle: vehicle,
                driverName: driverName,
                driverPhone: driverPhone,
                status: 'scheduled', // Ensure status is at least scheduled
                updatedAt: new Date()
            });

        } catch (error) {
            console.error("Error updating vehicle:", error);
            alert("Failed to save assignment in database.");
        }
    };

    const handleWhatsApp = async (trip) => {
        if (!confirm("Confirm sending WhatsApp to all travelers?")) return;

        // Optimistic Update
        setTrips(trips.map(t => t.id === trip.id ? { ...t, whatsapp_sent: true } : t));

        try {
            await updateDoc(doc(db, 'departures', trip.id), {
                whatsappSent: true,
                updatedAt: new Date()
            });

            const message = `Manage your Trip: ${trip.package}\nDate: ${trip.date}\nVehicle: ${trip.vehicle}\nDriver: ${trip.driver}`;
            const link = `https://wa.me/?text=${encodeURIComponent(message)}`;
            window.open(link, '_blank');

        } catch (error) {
            console.error("Error sending WhatsApp:", error);
        }
    };

    const handleDownloadManifest = async (trip) => {
        try {
            if (!trip.packageId || !trip.date) {
                alert("Missing package or date info for this trip.");
                return;
            }

            // Fetch Bookings
            // Note: trip.date is YYYY-MM-DD string? Ensure format matches bookingDate in bookings
            const q = query(
                collection(db, 'bookings'),
                where('packageId', '==', trip.packageId),
                where('bookingDate', '==', trip.date),
                where('status', '==', 'confirmed') // Only confirmed bookings
            );

            const snapshot = await getDocs(q);
            const bookings = snapshot.docs.map(d => d.data());

            if (bookings.length === 0) {
                alert("No confirmed bookings found for this trip.");
                return;
            }

            // Generate PDF
            const doc = new jsPDF();

            // Header
            doc.setFontSize(18);
            doc.text("INFINITE YATRA - TRIP MANIFEST", 14, 20);

            doc.setFontSize(10);
            doc.text(`Package: ${trip.package}`, 14, 30);
            doc.text(`Date: ${new Date(trip.date).toDateString()}`, 14, 35);
            doc.text(`Vehicle: ${trip.vehicle || 'Pending'}`, 14, 40);
            doc.text(`Driver: ${trip.driver || 'Pending'} (${trip.driver_phone || 'N/A'})`, 14, 45);

            // Access travelers list from bookings
            const passengers = [];
            bookings.forEach(b => {
                if (b.travelersList && Array.isArray(b.travelersList)) {
                    b.travelersList.forEach(t => {
                        passengers.push([
                            `${t.firstName} ${t.lastName}`,
                            t.age + ' / ' + (t.gender?.[0]?.toUpperCase() || '-'),
                            b.contactPhone,
                            b.specialRequests || '-',
                            'Not Assigned' // Seat Number placeholder
                        ]);
                    });
                }
            });

            autoTable(doc, {
                startY: 55,
                head: [['Passenger Name', 'Age/Gen', 'Primary Contact', 'Notes', 'Seat']],
                body: passengers,
                theme: 'grid',
                headStyles: { fillColor: [37, 99, 235] }, // Blue header
            });

            doc.save(`Manifest_${trip.package.split(' ')[0]}_${trip.date}.pdf`);

        } catch (error) {
            console.error("Manifest Error:", error);
            alert("Failed to generate manifest");
        }
    };

    if (loading) return <div className="text-center p-8 text-slate-400">Loading Operations...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white/5 p-6 rounded-2xl border border-white/10">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Truck className="text-blue-400" /> Trip Operations
                    </h3>
                    <p className="text-slate-400 text-sm">Manage Live Departures</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium border border-white/10 flex items-center gap-2 cursor-not-allowed opacity-50" title="Coming soon">
                        <Download size={16} /> Daily Manifest (All)
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {trips.length === 0 ? (
                    <div className="text-center p-8 text-slate-500">No active departures found.</div>
                ) : trips.map((trip) => (
                    <div key={trip.id} className="glass-card p-6 rounded-2xl border border-white/10 relative overflow-hidden group">
                        {/* Status Strip */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${trip.status === 'in_transit' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>

                        <div className="flex flex-col lg:flex-row justify-between gap-6 pl-4">
                            {/* Trip Info */}
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${trip.status === 'scheduled' || trip.status === 'in_transit' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                        }`}>
                                        {trip.status.replace('_', ' ')}
                                    </span>
                                    <span className="text-slate-500 text-xs">ID: {trip.id}</span>
                                </div>
                                <h4 className="text-lg font-bold text-white">{trip.package}</h4>
                                <div className="flex items-center gap-4 mt-2 text-sm text-slate-300">
                                    <div className="flex items-center gap-1.5">
                                        <Clock size={14} className="text-blue-400" /> {trip.pickup_time}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <MapPin size={14} className="text-purple-400" /> {trip.pickup_loc}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <User size={14} className="text-orange-400" /> {trip.travelers} Travelers
                                    </div>
                                </div>
                            </div>

                            {/* Logistics */}
                            <div className="flex-1 border-l border-white/5 pl-0 lg:pl-6">
                                {trip.vehicle ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-500 uppercase">Vehicle</span>
                                            <span className="text-sm font-medium text-white">{trip.vehicle}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-500 uppercase">Driver</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-white">{trip.driver}</span>
                                                <a href={`tel:${trip.driver_phone}`} className="p-1 bg-green-500/10 text-green-400 rounded hover:bg-green-500/20"><Phone size={12} /></a>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center p-4 bg-red-500/5 rounded-xl border border-red-500/10 border-dashed">
                                        <AlertCircle className="text-red-400 mb-1" size={20} />
                                        <p className="text-red-400 text-xs font-medium">Vehicle Pending</p>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2 min-w-[140px]">
                                <button
                                    onClick={() => handleAssign(trip)}
                                    className="w-full py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-medium border border-white/10 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Truck size={14} /> {trip.vehicle ? 'Re-Assign' : 'Assign Vehicle'}
                                </button>
                                <button
                                    onClick={() => handleDownloadManifest(trip)}
                                    className="w-full py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-medium border border-white/10 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Download size={14} /> Manifest
                                </button>
                                <button
                                    onClick={() => handleWhatsApp(trip)}
                                    className={`w-full py-2 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-2 ${trip.whatsapp_sent
                                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                        : 'bg-blue-600 hover:bg-blue-500 text-white border-transparent'
                                        }`}
                                >
                                    {trip.whatsapp_sent ? <CheckCircle size={14} /> : <Send size={14} />}
                                    {trip.whatsapp_sent ? 'Sent' : 'Send WhatsApp'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminTripOperations;
