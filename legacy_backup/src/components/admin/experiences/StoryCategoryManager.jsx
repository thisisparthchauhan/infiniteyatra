import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Plus, Trash2, Tag, Save, X, Loader } from 'lucide-react';

const StoryCategoryManager = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newCategory, setNewCategory] = useState({ label: '', emoji: '' });
    const [isAdding, setIsAdding] = useState(false);

    // Default categories to seed if empty
    const DEFAULT_CATEGORIES = [
        { id: 'trek', label: 'Trek', emoji: '🏔' },
        { id: 'spiritual', label: 'Spiritual', emoji: '🛕' },
        { id: 'solo', label: 'Solo', emoji: '🧍' },
        { id: 'friends', label: 'With Friends', emoji: '🫂' },
        { id: 'difficult', label: 'Difficult', emoji: '🌧' },
        { id: 'life-changing', label: 'Life-changing', emoji: '🌅' },
        { id: 'self-discovery', label: 'Self-discovery', emoji: '🧠' },
        { id: 'safety', label: 'Safety lesson', emoji: '🛡' }
    ];

    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, 'settings', 'storyCategories'), (docSnap) => {
            if (docSnap.exists()) {
                setCategories(docSnap.data().categories || []);
            } else {
                // If document represents a fresh start, seed it logic could go here, 
                // but for now we just show empty or handle it on add.
                // Optionally seed it automatically:
                seedDefaultCategories();
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const seedDefaultCategories = async () => {
        try {
            await setDoc(doc(db, 'settings', 'storyCategories'), {
                categories: DEFAULT_CATEGORIES
            });
        } catch (error) {
            console.error("Error seeding categories:", error);
        }
    };

    const handleAddCategory = async () => {
        if (!newCategory.label) return;

        const categoryToAdd = {
            id: newCategory.label.toLowerCase().replace(/\s+/g, '-'),
            label: newCategory.label,
            emoji: newCategory.emoji || '🏷️'
        };

        // Check for duplicates
        if (categories.some(c => c.id === categoryToAdd.id)) {
            alert('Category already exists!');
            return;
        }

        try {
            const updatedCategories = [...categories, categoryToAdd];
            await setDoc(doc(db, 'settings', 'storyCategories'), {
                categories: updatedCategories
            });
            setNewCategory({ label: '', emoji: '' });
            setIsAdding(false);
        } catch (error) {
            console.error("Error adding category:", error);
            alert("Failed to add category");
        }
    };

    const handleDeleteCategory = async (catId) => {
        if (!window.confirm("Are you sure? This will remove the category from the creation list.")) return;

        try {
            const updatedCategories = categories.filter(c => c.id !== catId);
            await setDoc(doc(db, 'settings', 'storyCategories'), {
                categories: updatedCategories
            });
        } catch (error) {
            console.error("Error deleting category:", error);
            alert("Failed to delete category");
        }
    };

    return (
        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Tag size={20} className="text-blue-400" /> Story Categories
                    </h3>
                    <p className="text-slate-400 text-sm">Manage tags available for travel stories</p>
                </div>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 rounded-lg text-sm font-bold transition-colors border border-blue-600/20"
                    >
                        <Plus size={16} /> Add Category
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10 animate-in fade-in slide-in-from-top-2">
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Category Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Solo Travel"
                                value={newCategory.label}
                                onChange={(e) => setNewCategory({ ...newCategory, label: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
                            />
                        </div>
                        <div className="w-full sm:w-32">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Emoji (Opt)</label>
                            <input
                                type="text"
                                placeholder="e.g. 🎒"
                                value={newCategory.emoji}
                                onChange={(e) => setNewCategory({ ...newCategory, emoji: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500 text-center"
                            />
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button
                                onClick={handleAddCategory}
                                disabled={!newCategory.label}
                                className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add
                            </button>
                            <button
                                onClick={() => setIsAdding(false)}
                                className="px-4 py-2 bg-white/10 text-white rounded-lg font-bold hover:bg-white/20"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-8">
                    <Loader className="animate-spin text-slate-500" />
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {categories.map((cat) => (
                        <div
                            key={cat.id}
                            className="group flex items-center justify-between px-4 py-3 bg-white/5 border border-white/5 rounded-xl hover:border-white/10 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-xl">{cat.emoji}</span>
                                <span className="font-medium text-slate-200">{cat.label}</span>
                            </div>
                            <button
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                    {categories.length === 0 && (
                        <div className="col-span-full text-center py-8 text-slate-500 italic">
                            No categories found. Click "Add Category" to start.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default StoryCategoryManager;
