import React, { useState } from 'react';
import { X, Plus, Trash2, Save, Upload, Image as ImageIcon, ChevronDown, ChevronUp, BedDouble, Info, CheckCircle2, XCircle } from 'lucide-react';
import { uploadMultipleToCloudinary, uploadToCloudinary } from '../../../services/cloudinary';
import PricingSimulator from './PricingSimulator';

const AdminHotelForm = ({ initialData, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        // 1. Basic Information
        name: '',
        location: '', // City/State
        address: '', // Nearby landmark/Full address
        category: '3 Star', // Star Category
        price: '', // Starting Price
        costPrice: '',
        tokenPrice: '',
        discount: '',
        isVisible: true,
        hotelType: [], // Tags: Luxury, Budget, etc.

        // 2. Images
        image: '', // Thumbnail
        images: [], // Gallery

        // 3. Room Types
        rooms: [],
        // Structure: { id, name, occupancy, price, costPrice, count, description, images: [] }

        // 4. Highlights
        highlights: [],

        // 5. Amenities (Split)
        inclusions: [],
        exclusions: [],

        // 6. Good To Know
        goodToKnow: [],

        // 7. Who Is This For
        whoIsThisFor: [],

        // 8. Things To Carry (Optional)
        thingsToCarry: [],

        // 9. FAQs
        faqs: [],

        // 10. Policies
        policies: {
            cancellation: '',
            refund: '',
            child: '',
            pet: ''
        },

        ...initialData,
        // Ensure arrays are initialized if editing old data
        hotelType: initialData?.hotelType || [],
        rooms: initialData?.rooms || [],
        highlights: initialData?.highlights || [],
        inclusions: initialData?.inclusions || [],
        exclusions: initialData?.exclusions || [],
        goodToKnow: initialData?.goodToKnow || [],
        whoIsThisFor: initialData?.whoIsThisFor || [],
        thingsToCarry: initialData?.thingsToCarry || [],
        faqs: initialData?.faqs || [],
        policies: { ...initialData?.policies }
    });

    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [activeSection, setActiveSection] = useState('basic'); // For scrolling/nav if needed (optional)

    // --- GENERIC HANDLERS ---
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: { ...prev[parent], [child]: value }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleListChange = (field, index, value) => {
        const newList = [...formData[field]];
        newList[index] = value;
        setFormData(prev => ({ ...prev, [field]: newList }));
    };

    const addListItem = (field) => {
        setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
    };

    const removeListItem = (field, index) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }));
    };

    // --- IMAGE HANDLERS ---
    const handleThumbnailUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const url = await uploadToCloudinary(file);
            setFormData(prev => ({ ...prev, image: url }));
        } catch (err) {
            console.error(err);
            alert("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleGalleryUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        setUploading(true);
        try {
            const urls = await uploadMultipleToCloudinary(files);
            setFormData(prev => ({ ...prev, images: [...prev.images, ...urls] }));
        } catch (err) {
            console.error(err);
            alert("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    // --- ROOM MANAGEMENT ---
    const addRoom = () => {
        setFormData(prev => ({
            ...prev,
            rooms: [
                ...prev.rooms,
                { id: Date.now(), name: '', occupancy: 2, price: '', costPrice: '', count: 1, description: '', images: [] }
            ]
        }));
    };

    const updateRoom = (index, field, value) => {
        const newRooms = [...formData.rooms];
        newRooms[index] = { ...newRooms[index], [field]: value };
        setFormData(prev => ({ ...prev, rooms: newRooms }));
    };

    const removeRoom = (index) => {
        if (!window.confirm("Delete this room type?")) return;
        setFormData(prev => ({
            ...prev,
            rooms: prev.rooms.filter((_, i) => i !== index)
        }));
    };

    // --- SUBMISSION ---
    const handleSubmit = (e) => {
        e.preventDefault();
        // Clean data
        const cleaned = {
            ...formData,
            price: Number(formData.price),
            costPrice: Number(formData.costPrice),
            tokenPrice: Number(formData.tokenPrice),
            rooms: formData.rooms.map(r => ({
                ...r,
                price: Number(r.price),
                costPrice: Number(r.costPrice),
                occupancy: Number(r.occupancy),
                count: Number(r.count)
            })),
            // Filter empty strings
            highlights: formData.highlights.filter(s => s.trim()),
            inclusions: formData.inclusions.filter(s => s.trim()),
            exclusions: formData.exclusions.filter(s => s.trim()),
            goodToKnow: formData.goodToKnow.filter(s => s.trim()),
            whoIsThisFor: formData.whoIsThisFor.filter(s => s.trim()),
            thingsToCarry: formData.thingsToCarry.filter(s => s.trim()),
            faqs: formData.faqs.filter(f => f.question.trim() && f.answer.trim())
        };
        onSave(cleaned);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0f172a] w-full max-w-5xl h-[95vh] rounded-2xl border border-white/10 shadow-2xl flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            {initialData ? 'Edit Hotel' : 'New Hotel Property'}
                        </h2>
                        <p className="text-slate-400 text-sm">Detailed inventory management</p>
                    </div>
                    <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="text-slate-400 hover:text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">

                    {/* SECTION 1: BASIC INFO */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2">
                            <Info size={18} /> Basic Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            <div className="col-span-2">
                                <label className="label">Hotel Name *</label>
                                <input name="name" value={formData.name} onChange={handleChange} className="input-field" required />
                            </div>
                            <div>
                                <label className="label">Category *</label>
                                <select name="category" value={formData.category} onChange={handleChange} className="input-field">
                                    <option value="3 Star">3 Star</option>
                                    <option value="4 Star">4 Star</option>
                                    <option value="5 Star">5 Star</option>
                                    <option value="Luxury">Luxury</option>
                                    <option value="Boutique">Boutique</option>
                                    <option value="Resort">Resort</option>
                                    <option value="Homestay">Homestay</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">City / Location *</label>
                                <input name="location" value={formData.location} onChange={handleChange} className="input-field" required />
                            </div>
                            <div className="col-span-2">
                                <label className="label">Full Address / Landmark</label>
                                <input name="address" value={formData.address} onChange={handleChange} className="input-field" />
                            </div>

                            {/* PRICING & VISIBILITY */}
                            <div>
                                <label className="label">Starting Price (₹) *</label>
                                <input type="number" name="price" value={formData.price} onChange={handleChange} className="input-field" required />
                            </div>
                            <div>
                                <label className="label">Cost Price (₹) *</label>
                                <input type="number" name="costPrice" value={formData.costPrice} onChange={handleChange} className="input-field border-purple-500/30 focus:border-purple-500" placeholder="For calculation" />
                            </div>
                            <div>
                                <label className="label">Advance Token (₹)</label>
                                <input type="number" name="tokenPrice" value={formData.tokenPrice} onChange={handleChange} className="input-field" />
                            </div>

                            <div className="col-span-full">
                                <label className="label">Hotel Type Tags</label>
                                <div className="flex flex-wrap gap-2">
                                    {['Luxury', 'Budget', 'Trek Stay', 'Spiritual', 'Business', 'Honeymoon', 'Family', 'Couple Friendly'].map(tag => (
                                        <button
                                            type="button"
                                            key={tag}
                                            onClick={() => {
                                                const current = formData.hotelType || [];
                                                const create = current.includes(tag)
                                                    ? current.filter(t => t !== tag)
                                                    : [...current, tag];
                                                setFormData(prev => ({ ...prev, hotelType: create }));
                                            }}
                                            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${formData.hotelType.includes(tag)
                                                ? 'bg-blue-600 border-blue-600 text-white'
                                                : 'bg-white/5 border-white/10 text-slate-400'
                                                }`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="col-span-full">
                                <label className="flex items-center gap-3 cursor-pointer p-3 bg-white/5 rounded-xl border border-white/10 w-fit">
                                    <input type="checkbox" name="isVisible" checked={formData.isVisible} onChange={handleChange} className="w-5 h-5 accent-green-500" />
                                    <span className="font-medium text-white">Publicly Visible on Website</span>
                                </label>
                            </div>
                        </div>
                    </section>

                    <hr className="border-white/10" />

                    {/* SECTION 2: IMAGES */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2">
                            <ImageIcon size={18} /> Gallery
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {/* Thumbnail */}
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-sm font-bold text-slate-300 mb-2">Main Thumbnail</label>
                                {formData.image ? (
                                    <div className="relative group aspect-[4/5] rounded-xl overflow-hidden border-2 border-green-500/50">
                                        <img src={formData.image} className="w-full h-full object-cover" />
                                        <button onClick={() => setFormData(p => ({ ...p, image: '' }))} className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>
                                        <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-[10px] text-white font-bold">COVER</div>
                                    </div>
                                ) : (
                                    <label className="aspect-[4/5] flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-xl hover:bg-white/5 cursor-pointer transition-colors">
                                        <Upload className="mb-2 text-slate-500" />
                                        <span className="text-xs text-slate-500">Upload Cover</span>
                                        <input type="file" className="hidden" onChange={handleThumbnailUpload} />
                                    </label>
                                )}
                            </div>

                            {/* Gallery Grid */}
                            {formData.images.map((url, idx) => (
                                <div key={idx} className="relative group aspect-[4/5] rounded-xl overflow-hidden border border-white/10">
                                    <img src={url} className="w-full h-full object-cover" />
                                    <button onClick={() => setFormData(p => ({ ...p, images: p.images.filter((_, i) => i !== idx) }))} className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>
                                </div>
                            ))}

                            <label className="aspect-[4/5] flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-xl hover:bg-white/5 cursor-pointer transition-colors">
                                <Upload className="mb-2 text-slate-500" />
                                <span className="text-xs text-slate-500 text-center px-2">Add Gallery Images</span>
                                <input type="file" multiple className="hidden" onChange={handleGalleryUpload} />
                            </label>
                        </div>
                    </section>

                    <hr className="border-white/10" />

                    {/* SECTION 3: ROOM TYPES */}
                    <section className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2">
                                <BedDouble size={18} /> Room Types
                            </h3>
                            <button onClick={addRoom} className="px-3 py-1.5 bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                                <Plus size={16} /> Add Room Type
                            </button>
                        </div>

                        <div className="space-y-4">
                            {formData.rooms.map((room, idx) => (
                                <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-5 relative">
                                    <button onClick={() => removeRoom(idx)} className="absolute top-4 right-4 text-slate-500 hover:text-red-500"><Trash2 size={18} /></button>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                        <div className="md:col-span-2">
                                            <label className="label">Room Name</label>
                                            <input value={room.name} onChange={e => updateRoom(idx, 'name', e.target.value)} className="input-field" placeholder="e.g. Deluxe Room with Balcony" />
                                        </div>
                                        <div>
                                            <label className="label">Max Occupancy</label>
                                            <input type="number" value={room.occupancy} onChange={e => updateRoom(idx, 'occupancy', e.target.value)} className="input-field" />
                                        </div>
                                        <div>
                                            <label className="label">Inventory Count</label>
                                            <input type="number" value={room.count} onChange={e => updateRoom(idx, 'count', e.target.value)} className="input-field" />
                                        </div>
                                        <div>
                                            <label className="label">Base Price (₹)</label>
                                            <input type="number" value={room.price} onChange={e => updateRoom(idx, 'price', e.target.value)} className="input-field" />
                                        </div>
                                        <div>
                                            <label className="label">Cost Price (₹)</label>
                                            <input type="number" value={room.costPrice} onChange={e => updateRoom(idx, 'costPrice', e.target.value)} className="input-field border-purple-500/30" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="label">Room Description</label>
                                        <textarea value={room.description} onChange={e => updateRoom(idx, 'description', e.target.value)} className="input-field h-20 resize-none" placeholder="Amenities specific to this room..." />
                                    </div>

                                    {/* Dynamic Pricing Tools */}
                                    <PricingSimulator
                                        basePrice={room.price}
                                        costPrice={room.costPrice}
                                        inventory={room.count}
                                        hotelId={initialData?.id}
                                        roomId={room.id} // Ensure room has ID if new?
                                    />
                                </div>
                            ))}
                            {formData.rooms.length === 0 && (
                                <div className="text-center py-8 border border-dashed border-white/10 rounded-xl text-slate-500">
                                    No room types added yet.
                                </div>
                            )}
                        </div>
                    </section>

                    <hr className="border-white/10" />

                    {/* SECTION 4 & 5: LISTS (Highlights, Amenities) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Highlights */}
                        <ListSection
                            title="Hotel Highlights"
                            data={formData.highlights}
                            onChange={(idx, val) => handleListChange('highlights', idx, val)}
                            onAdd={() => addListItem('highlights')}
                            onRemove={(idx) => removeListItem('highlights', idx)}
                            placeholder="e.g. Mountain View"
                        />

                        {/* Who is this for */}
                        <ListSection
                            title="Who is this for?"
                            data={formData.whoIsThisFor}
                            onChange={(idx, val) => handleListChange('whoIsThisFor', idx, val)}
                            onAdd={() => addListItem('whoIsThisFor')}
                            onRemove={(idx) => removeListItem('whoIsThisFor', idx)}
                            placeholder="e.g. Couples, Trekkers"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Inclusions */}
                        <ListSection
                            title="Included Amenities"
                            data={formData.inclusions}
                            onChange={(idx, val) => handleListChange('inclusions', idx, val)}
                            onAdd={() => addListItem('inclusions')}
                            onRemove={(idx) => removeListItem('inclusions', idx)}
                            placeholder="e.g. Breakfast, WiFi"
                            icon={<CheckCircle2 className="text-green-500" size={16} />}
                        />

                        {/* Exclusions */}
                        <ListSection
                            title="Not Included / Extra"
                            data={formData.exclusions}
                            onChange={(idx, val) => handleListChange('exclusions', idx, val)}
                            onAdd={() => addListItem('exclusions')}
                            onRemove={(idx) => removeListItem('exclusions', idx)}
                            placeholder="e.g. Lunch, Laundry"
                            icon={<XCircle className="text-red-500" size={16} />}
                        />
                    </div>

                    {/* SECTION 6: Good to Know & Things to Carry */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <ListSection
                            title="Good To Know"
                            data={formData.goodToKnow}
                            onChange={(idx, val) => handleListChange('goodToKnow', idx, val)}
                            onAdd={() => addListItem('goodToKnow')}
                            onRemove={(idx) => removeListItem('goodToKnow', idx)}
                            placeholder="e.g. Check-in 12PM"
                        />
                        <ListSection
                            title="Things To Carry"
                            data={formData.thingsToCarry}
                            onChange={(idx, val) => handleListChange('thingsToCarry', idx, val)}
                            onAdd={() => addListItem('thingsToCarry')}
                            onRemove={(idx) => removeListItem('thingsToCarry', idx)}
                            placeholder="e.g. Valid ID Proof"
                        />
                    </div>

                    <hr className="border-white/10" />

                    {/* SECTION 9: FAQs */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-bold text-blue-400">FAQs</h3>
                        <div className="space-y-4">
                            {formData.faqs.map((faq, idx) => (
                                <div key={idx} className="flex gap-4 items-start bg-white/5 p-4 rounded-xl border border-white/10">
                                    <div className="flex-1 space-y-2">
                                        <input
                                            value={faq.question}
                                            onChange={e => {
                                                const newFaqs = [...formData.faqs];
                                                newFaqs[idx].question = e.target.value;
                                                setFormData(p => ({ ...p, faqs: newFaqs }));
                                            }}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white font-bold placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                                            placeholder="Question"
                                        />
                                        <textarea
                                            value={faq.answer}
                                            onChange={e => {
                                                const newFaqs = [...formData.faqs];
                                                newFaqs[idx].answer = e.target.value;
                                                setFormData(p => ({ ...p, faqs: newFaqs }));
                                            }}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-slate-300 text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500 resize-none"
                                            placeholder="Answer"
                                            rows={2}
                                        />
                                    </div>
                                    <button onClick={() => setFormData(p => ({ ...p, faqs: p.faqs.filter((_, i) => i !== idx) }))} className="text-slate-500 hover:text-red-500 mt-2"><Trash2 size={18} /></button>
                                </div>
                            ))}
                            <button onClick={() => setFormData(p => ({ ...p, faqs: [...p.faqs, { question: '', answer: '' }] }))} className="text-sm text-blue-400 hover:text-white flex items-center gap-2">
                                <Plus size={16} /> Add FAQ
                            </button>
                        </div>
                    </section>

                    {/* SECTION 10: POLICIES */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-bold text-blue-400">Hotel Policies</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="label">Cancellation Policy</label>
                                <textarea name="policies.cancellation" value={formData.policies.cancellation} onChange={handleChange} className="input-field h-24 resize-none" />
                            </div>
                            <div>
                                <label className="label">Refund Policy</label>
                                <textarea name="policies.refund" value={formData.policies.refund} onChange={handleChange} className="input-field h-24 resize-none" />
                            </div>
                            <div>
                                <label className="label">Child Policy</label>
                                <textarea name="policies.child" value={formData.policies.child} onChange={handleChange} className="input-field h-24 resize-none" />
                            </div>
                            <div>
                                <label className="label">Pet Policy</label>
                                <textarea name="policies.pet" value={formData.policies.pet} onChange={handleChange} className="input-field h-24 resize-none" />
                            </div>
                        </div>
                    </section>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 bg-black/50 backdrop-blur-md flex justify-end gap-4 rounded-b-2xl">
                    <button onClick={onCancel} className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={uploading} className="px-8 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2">
                        {uploading ? 'Uploading...' : <><Save size={18} /> Save Hotel</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Helper Component for List Sections
const ListSection = ({ title, data, onChange, onAdd, onRemove, placeholder, icon }) => (
    <div className="space-y-3">
        <label className="block text-sm font-bold text-slate-300 flex items-center gap-2">
            {icon} {title}
        </label>
        {data.map((item, idx) => (
            <div key={idx} className="flex gap-2">
                <input
                    value={item}
                    onChange={e => onChange(idx, e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder={placeholder}
                />
                <button onClick={() => onRemove(idx)} className="text-slate-600 hover:text-red-500 transition-colors"><X size={16} /></button>
            </div>
        ))}
        <button onClick={onAdd} className="text-xs text-slate-500 hover:text-blue-400 font-bold flex items-center gap-1 transition-colors">
            <Plus size={12} /> Add Item
        </button>
    </div>
);

// CSS Utility Wrapper
const styles = `
.label {
    display: block;
    font-size: 0.875rem;
    color: #94a3b8; /* slate-400 */
    margin-bottom: 0.5rem;
    font-weight: 500;
}
.input-field {
    width: 100%;
    background-color: rgba(0,0,0,0.4);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 0.75rem;
    padding: 0.75rem 1rem;
    color: white;
    outline: none;
    transition: all 0.2s;
}
.input-field:focus {
    border-color: #3b82f6; /* blue-500 */
    box-shadow: 0 0 0 1px #3b82f6;
}
`;

export default AdminHotelForm;
