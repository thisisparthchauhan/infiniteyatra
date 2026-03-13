import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, MapPin, X, AlertTriangle, Car, Bike, Check } from 'lucide-react';
import { getCities, addCity, updateCity, deleteCity, getVehicles, updateVehicle } from '../../../services/transportService';

const AVAILABLE_TYPES = [
    { id: 'cycle', label: 'Cycle' },
    { id: 'ebicycle', label: 'E-Bicycle' },
    { id: 'bike', label: 'Bike' },
    { id: 'car', label: 'Car' },
    { id: 'traveller', label: 'Traveller' }
];

const AdminTransportCities = () => {
    const [cities, setCities] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);

    const [formData, setFormData] = useState(getInitialFormData());

    function getInitialFormData() {
        return {
            id: null,
            cityName: '',
            stateName: '',
            countryName: 'India',
            isActive: true,
            vehicleTypes: []
        };
    }

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [citiesData, vehiclesData] = await Promise.all([
                getCities().catch(() => []),
                getVehicles().catch(() => [])
            ]);
            setCities(citiesData);
            setVehicles(vehiclesData);
        } catch (error) {
            console.error('Error fetching data:', error);
            setCities([]);
            setVehicles([]);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (city = null) => {
        if (city) {
            setFormData(city);
            setEditMode(true);
        } else {
            setFormData(getInitialFormData());
            setEditMode(false);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => setIsModalOpen(false);

    const handleVehicleTypeToggle = (typeId) => {
        setFormData(prev => {
            if (prev.vehicleTypes.includes(typeId)) {
                return { ...prev, vehicleTypes: prev.vehicleTypes.filter(t => t !== typeId) };
            } else {
                return { ...prev, vehicleTypes: [...prev.vehicleTypes, typeId] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editMode) {
                await updateCity(formData.id, formData);
            } else {
                await addCity(formData);
            }
            handleCloseModal();
            fetchData();
        } catch (error) {
            console.error('Error saving city:', error);
            alert('Failed to save city');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this city?')) {
            try {
                await deleteCity(id);
                fetchData();
            } catch (error) {
                console.error('Error deleting city:', error);
                alert('Failed to delete city');
            }
        }
    };

    const handleToggleActive = async (city) => {
        const newStatus = !city.isActive;
        const cityVehicles = vehicles.filter(v => v.city === city.cityName);

        if (!newStatus && cityVehicles.length > 0) {
            // Trying to set to inactive
            const confirmMsg = `Disabling this city will hide ${cityVehicles.length} vehicles from users. Continue?`;
            if (!window.confirm(confirmMsg)) return;

            try {
                // Update city
                await updateCity(city.id, { isActive: false });

                // Update all vehicles in this city to be hidden (isVisible = false)
                const updatePromises = cityVehicles.map(v => updateVehicle(v.id, { isVisible: false }));
                await Promise.all(updatePromises);

                fetchData();
            } catch (error) {
                console.error("Error disabling city and hiding vehicles:", error);
                alert("Failed to update status.");
            }
        } else {
            // Just toggling to active, or closing a city with no vehicles
            try {
                await updateCity(city.id, { isActive: newStatus });
                setCities(cities.map(c => c.id === city.id ? { ...c, isActive: newStatus } : c));
            } catch (error) {
                console.error("Error toggling city status:", error);
                alert("Failed to update status.");
            }
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
    );

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <MapPin className="text-blue-500" />
                        Manage Transport Cities
                    </h2>
                    <p className="text-slate-400">Add or edit cities where transport is available.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-medium transition-all shadow-lg"
                >
                    <Plus size={18} /> Add New City
                </button>
            </div>

            {/* City Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {cities.length === 0 ? (
                    <div className="col-span-1 border border-slate-800 border-dashed rounded-2xl p-8 text-center bg-slate-900/50">
                        <p className="text-slate-500 mb-4">No cities configured yet.</p>
                        <button onClick={() => handleOpenModal()} className="text-blue-400 font-medium hover:text-blue-300">
                            + Add your first city
                        </button>
                    </div>
                ) : (
                    cities.map(city => {
                        const cityVehiclesCount = vehicles.filter(v => v.city === city.cityName && v.isActive).length;

                        return (
                            <motion.div
                                key={city.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`bg-[#0a0a0a] border rounded-2xl overflow-hidden shadow-xl transition-all relative ${city.isActive ? 'border-slate-800' : 'border-slate-800/50 opacity-80'}`}
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-purple-600 opacity-50"></div>

                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                                                {city.cityName}
                                            </h3>
                                            <p className="text-sm text-slate-400 font-medium">
                                                {city.stateName}, {city.countryName}
                                            </p>
                                        </div>
                                        {/* Actions */}
                                        <div className="flex items-center gap-1.5 bg-slate-900 rounded-lg p-1 border border-slate-800">
                                            <button onClick={() => handleOpenModal(city)} className="text-blue-400 hover:bg-slate-800 p-1.5 rounded transition-colors"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDelete(city.id)} className="text-red-400 hover:bg-slate-800 p-1.5 rounded transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Active Vehicles</p>
                                            <div className="text-2xl font-black text-white flex items-center gap-2">
                                                <Car size={20} className="text-slate-600" />
                                                {cityVehiclesCount}
                                            </div>
                                        </div>
                                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-center">
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">City Status</p>
                                            <label className="flex items-center gap-2 cursor-pointer w-fit">
                                                <button
                                                    onClick={() => handleToggleActive(city)}
                                                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${city.isActive ? 'bg-green-500' : 'bg-slate-600'}`}
                                                >
                                                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${city.isActive ? 'translate-x-5' : 'translate-x-1'}`} />
                                                </button>
                                                <span className={`text-sm font-semibold ${city.isActive ? 'text-green-400' : 'text-slate-500'}`}>
                                                    {city.isActive ? 'Active' : 'Hidden'}
                                                </span>
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Available Vehicle Types</p>
                                        <div className="flex flex-wrap gap-2">
                                            {AVAILABLE_TYPES.map(type => {
                                                const isAvailable = city.vehicleTypes.includes(type.id);
                                                return isAvailable ? (
                                                    <span key={type.id} className="inline-flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2.5 py-1 rounded-full text-xs font-medium">
                                                        <Check size={12} /> {type.label}
                                                    </span>
                                                ) : (
                                                    <span key={type.id} className="inline-flex items-center gap-1 bg-slate-900 border border-slate-800 text-slate-600 px-2.5 py-1 rounded-full text-xs font-medium">
                                                        {type.label}
                                                    </span>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center md:p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[#0a0a0a] md:border border-slate-800 w-full h-full md:h-auto md:max-h-[90vh] md:rounded-3xl max-w-2xl overflow-hidden shadow-2xl flex flex-col"
                        >
                            <div className="flex justify-between items-center px-8 py-5 border-b border-slate-800 bg-[#111] shrink-0">
                                <h3 className="text-2xl font-bold text-white">{editMode ? 'Edit City' : 'Add New City'}</h3>
                                <button onClick={handleCloseModal} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"><X size={24} /></button>
                            </div>

                            <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                                <form id="cityForm" onSubmit={handleSubmit} className="space-y-6">

                                    <div className="grid grid-cols-1 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-1.5">City Name</label>
                                            <input
                                                type="text" required placeholder="e.g. Goa"
                                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                                value={formData.cityName} onChange={e => setFormData({ ...formData, cityName: e.target.value })}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-1.5">State</label>
                                                <input
                                                    type="text" required placeholder="e.g. Goa"
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                                    value={formData.stateName} onChange={e => setFormData({ ...formData, stateName: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Country</label>
                                                <input
                                                    type="text" required
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                                    value={formData.countryName} onChange={e => setFormData({ ...formData, countryName: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4">Supported Vehicle Types</h4>
                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                            {AVAILABLE_TYPES.map(type => {
                                                const isSelected = formData.vehicleTypes.includes(type.id);
                                                return (
                                                    <label
                                                        key={type.id}
                                                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${isSelected ? 'bg-blue-900/20 border-blue-500' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}`}
                                                    >
                                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'bg-transparent border-slate-500'}`}>
                                                            {isSelected && <Check size={14} className="text-white" />}
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            className="hidden"
                                                            checked={isSelected}
                                                            onChange={() => handleVehicleTypeToggle(type.id)}
                                                        />
                                                        <span className="text-sm font-medium text-white">{type.label}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-800">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.isActive ? 'bg-green-500' : 'bg-slate-700'}`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                            <div>
                                                <span className="text-sm text-white font-medium block">City is Active</span>
                                                <span className="text-xs text-slate-500">Unchecking will hide this city from the frontend.</span>
                                            </div>
                                        </label>
                                    </div>

                                </form>
                            </div>

                            {/* Footer */}
                            <div className="px-8 py-5 border-t border-slate-800 bg-[#111] flex justify-end gap-4 shrink-0 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)] z-10">
                                <button type="button" onClick={handleCloseModal} className="px-6 py-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white font-bold transition-colors">Cancel</button>
                                <button type="submit" form="cityForm" className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-500/30">
                                    {editMode ? 'Save Changes' : 'Create City'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminTransportCities;
