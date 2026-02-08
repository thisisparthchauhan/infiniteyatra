import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { Star, MapPin, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RecommendationEngine = ({ currentId, type = 'hotel', location, budget, tags = [] }) => {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAndScore = async () => {
            try {
                // Fetch potential candidates
                // In production, use backend Algolia/ElasticSearch. Here: Client-side scoring.
                const collectionName = type === 'hotel' ? 'hotels' : 'packages';
                const querySnapshot = await getDocs(collection(db, collectionName));

                const items = querySnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(item => item.id !== currentId); // Exclude current

                // Scoring Algorithm
                const scoredItems = items.map(item => {
                    let score = 0;

                    // 1. Location Match (Heavy Weight)
                    if (location && item.location && item.location.includes(location.split(',')[0])) {
                        score += 50;
                    }

                    // 2. Budget Awareness (+/- 20%)
                    const itemPrice = item.price || (item.rooms ? item.rooms[0]?.price : 0);
                    if (budget && itemPrice) {
                        const diff = Math.abs(itemPrice - budget);
                        const percentDiff = diff / budget;
                        if (percentDiff < 0.2) score += 30;
                        else if (percentDiff < 0.4) score += 15;
                    }

                    // 3. Tag/Context Match
                    const itemTags = [...(item.tags || []), ...(item.highlights || [])];
                    if (tags.length > 0) {
                        const matchCount = tags.filter(t =>
                            itemTags.some(it => it.toLowerCase().includes(t.toLowerCase()))
                        ).length;
                        score += (matchCount * 10);
                    }

                    // 4. Popularity (Artificial boost for now)
                    if (item.rating > 4.5) score += 10;

                    return { ...item, score };
                });

                // Top 3
                const top3 = scoredItems.sort((a, b) => b.score - a.score).slice(0, 3);
                setRecommendations(top3);

            } catch (err) {
                console.error("AI Recommendation Error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAndScore();
    }, [currentId, type, location, budget]);

    if (loading || recommendations.length === 0) return null;

    return (
        <div className="py-12 border-t border-white/10">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <TrendingUp className="text-blue-500" />
                {type === 'hotel' ? 'Other Stays You Might Like' : 'Recommended Adventures'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recommendations.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => navigate(`/${type === 'hotel' ? 'hotels' : 'packages'}/${item.id}`)}
                        className="bg-white/5 border border-white/10 rounded-xl overflow-hidden cursor-pointer hover:border-blue-500/50 transition-all group"
                    >
                        <div className="aspect-video relative overflow-hidden">
                            <img src={item.image || item.images?.[0]} alt={item.name || item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            {item.score > 60 && (
                                <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg">
                                    TOP MATCH
                                </div>
                            )}
                        </div>
                        <div className="p-4">
                            <h4 className="font-bold text-white mb-1 line-clamp-1">{item.name || item.title}</h4>
                            <p className="text-xs text-slate-400 flex items-center gap-1 mb-2">
                                <MapPin size={12} /> {item.location}
                            </p>
                            <div className="flex justify-between items-center">
                                <span className="text-blue-400 font-bold">₹{item.price || item.rooms?.[0]?.price}</span>
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                    <Star size={10} className="text-yellow-500 fill-yellow-500" /> {item.rating || 4.5}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecommendationEngine;
