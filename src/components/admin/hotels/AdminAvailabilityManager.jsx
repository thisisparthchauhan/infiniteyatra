import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, doc, getDoc, setDoc, updateDoc, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../../../firebase';
import { ChevronLeft, ChevronRight, Calendar, Lock, CheckCircle2, Loader2, Save, Ban } from 'lucide-react';

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const AdminAvailabilityManager = () => {
    const [hotels, setHotels] = useState([]);
    const [selectedHotel, setSelectedHotel] = useState('');
    const [selectedRoom, setSelectedRoom] = useState('');
    const [rooms, setRooms] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [dates, setDates] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [blockMode, setBlockMode] = useState(false);
    const [blockStart, setBlockStart] = useState(null);
    const [blockEnd, setBlockEnd] = useState(null);

    // Load hotels
    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'hotels'), (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setHotels(data);
            if (data.length > 0 && !selectedHotel) {
                setSelectedHotel(data[0].id);
            }
        });
        return () => unsub();
    }, []);

    // Load rooms when hotel changes
    useEffect(() => {
        if (!selectedHotel) return;
        const hotel = hotels.find(h => h.id === selectedHotel);
        if (hotel?.rooms?.length > 0) {
            setRooms(hotel.rooms);
            setSelectedRoom(hotel.rooms[0].name);
        } else {
            setRooms([]);
            setSelectedRoom('Standard Room');
        }
    }, [selectedHotel, hotels]);

    // Load availability data
    useEffect(() => {
        if (!selectedHotel || !selectedRoom) return;
        setLoading(true);

        const monthStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
        const docId = `${selectedHotel}_${selectedRoom.replace(/\s+/g, '_')}_${monthStr}`;

        const unsub = onSnapshot(doc(db, 'hotel_availability', docId), (snap) => {
            if (snap.exists()) {
                setDates(snap.data().dates || {});
            } else {
                setDates({});
            }
            setLoading(false);
        });

        return () => unsub();
    }, [selectedHotel, selectedRoom, currentMonth]);

    const getMonthDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDay = (firstDay.getDay() + 6) % 7; // Monday = 0
        const totalDays = lastDay.getDate();

        const days = [];
        for (let i = 0; i < startDay; i++) days.push(null);
        for (let d = 1; d <= totalDays; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            days.push({ day: d, dateStr, status: dates[dateStr] || 'available' });
        }
        return days;
    };

    const toggleDate = (dateStr, currentStatus) => {
        if (currentStatus === 'booked') return; // can't modify booked dates

        if (blockMode) {
            if (!blockStart) {
                setBlockStart(dateStr);
            } else if (!blockEnd) {
                setBlockEnd(dateStr);
                // Block the range
                const start = new Date(blockStart < dateStr ? blockStart : dateStr);
                const end = new Date(blockStart < dateStr ? dateStr : blockStart);
                const newDates = { ...dates };
                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    const ds = d.toISOString().split('T')[0];
                    if (newDates[ds] !== 'booked') {
                        newDates[ds] = 'blocked';
                    }
                }
                setDates(newDates);
                setBlockStart(null);
                setBlockEnd(null);
                setBlockMode(false);
            }
            return;
        }

        const newDates = { ...dates };
        if (currentStatus === 'blocked') {
            delete newDates[dateStr]; // back to available (default)
        } else {
            newDates[dateStr] = 'blocked';
        }
        setDates(newDates);
    };

    const handleSave = async () => {
        if (!selectedHotel || !selectedRoom) return;
        setSaving(true);
        setSaved(false);

        const monthStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
        const docId = `${selectedHotel}_${selectedRoom.replace(/\s+/g, '_')}_${monthStr}`;
        const hotel = hotels.find(h => h.id === selectedHotel);

        try {
            await setDoc(doc(db, 'hotel_availability', docId), {
                hotelId: selectedHotel,
                hotelName: hotel?.name || '',
                roomType: selectedRoom,
                month: monthStr,
                dates: dates,
                updatedAt: serverTimestamp()
            }, { merge: true });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('Save error:', err);
            alert('Failed to save availability');
        } finally {
            setSaving(false);
        }
    };

    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

    const monthLabel = currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    const days = getMonthDays();

    const STATUS_STYLES = {
        available: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30 cursor-pointer',
        blocked: 'bg-zinc-700/50 text-zinc-500 border-zinc-600/50 hover:bg-zinc-600/50 cursor-pointer',
        booked: 'bg-orange-500/20 text-orange-300 border-orange-500/30 cursor-not-allowed'
    };

    const today = new Date().toISOString().split('T')[0];

    // Stats
    const allDays = days.filter(Boolean);
    const blockedCount = allDays.filter(d => d.status === 'blocked').length;
    const bookedCount = allDays.filter(d => d.status === 'booked').length;
    const availableCount = allDays.length - blockedCount - bookedCount;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Calendar className="text-purple-400" /> Availability Manager
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Set room availability and block dates</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${saved ? 'bg-green-600 text-white' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/20'} disabled:opacity-50`}
                >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <><CheckCircle2 size={16} /> Saved!</> : <><Save size={16} /> Save Availability</>}
                </button>
            </div>

            {/* Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-sm text-slate-400 mb-2 block">Select Hotel</label>
                    <select
                        value={selectedHotel}
                        onChange={e => setSelectedHotel(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    >
                        {hotels.map(h => (
                            <option key={h.id} value={h.id}>{h.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-sm text-slate-400 mb-2 block">Select Room</label>
                    <select
                        value={selectedRoom}
                        onChange={e => setSelectedRoom(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    >
                        {rooms.length > 0 ? rooms.map(r => (
                            <option key={r.name} value={r.name}>{r.name}</option>
                        )) : (
                            <option value="Standard Room">Standard Room</option>
                        )}
                    </select>
                </div>
            </div>

            {/* Calendar */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                {/* Month navigation */}
                <div className="flex items-center justify-between mb-6">
                    <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                        <ChevronLeft size={20} className="text-white" />
                    </button>
                    <h3 className="text-lg font-bold text-white">{monthLabel}</h3>
                    <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                        <ChevronRight size={20} className="text-white" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 size={24} className="animate-spin text-purple-400" />
                    </div>
                ) : (
                    <>
                        {/* Day headers */}
                        <div className="grid grid-cols-7 gap-2 mb-2">
                            {DAYS.map(d => (
                                <div key={d} className="text-center text-xs font-bold text-slate-500 py-1">{d}</div>
                            ))}
                        </div>

                        {/* Day cells */}
                        <div className="grid grid-cols-7 gap-2">
                            {days.map((d, i) => (
                                d ? (
                                    <button
                                        key={d.dateStr}
                                        onClick={() => toggleDate(d.dateStr, d.status)}
                                        disabled={d.status === 'booked'}
                                        className={`relative p-3 rounded-xl border text-sm font-medium transition-all ${STATUS_STYLES[d.status]} ${d.dateStr === today ? 'ring-2 ring-blue-500/50' : ''} ${blockMode && blockStart === d.dateStr ? 'ring-2 ring-yellow-400' : ''}`}
                                    >
                                        {d.day}
                                        {d.status === 'booked' && <Lock size={10} className="absolute top-1 right-1 text-orange-400" />}
                                    </button>
                                ) : (
                                    <div key={`empty-${i}`} className="p-3" />
                                )
                            ))}
                        </div>
                    </>
                )}

                {/* Legend + Block Range */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10 flex-wrap gap-4">
                    <div className="flex gap-6 text-xs">
                        <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-emerald-500/40 border border-emerald-500/40" /> Available ({availableCount})</span>
                        <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-orange-500/40 border border-orange-500/40" /> Booked ({bookedCount})</span>
                        <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-zinc-600/60 border border-zinc-500/40" /> Blocked ({blockedCount})</span>
                    </div>
                    <button
                        onClick={() => { setBlockMode(!blockMode); setBlockStart(null); setBlockEnd(null); }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${blockMode ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'}`}
                    >
                        <Ban size={14} /> {blockMode ? 'Click 2 dates to block range...' : 'Block Range'}
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-400">{availableCount}</p>
                    <p className="text-xs text-slate-500">Available</p>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-orange-400">{bookedCount}</p>
                    <p className="text-xs text-slate-500">Booked</p>
                </div>
                <div className="bg-zinc-500/10 border border-zinc-500/20 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-zinc-400">{blockedCount}</p>
                    <p className="text-xs text-slate-500">Blocked</p>
                </div>
            </div>
        </div>
    );
};

export default AdminAvailabilityManager;
