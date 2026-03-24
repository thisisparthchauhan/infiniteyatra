import Groq from 'groq-sdk';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

const groq = new Groq({ 
    apiKey: import.meta.env.VITE_GROQ_API_KEY, 
    dangerouslyAllowBrowser: true 
});
// Fetch active hotels matching the destination city
const fetchIYHotels = async (destination) => {
    try {
        const destLower = destination.toLowerCase();
        // Fallback to fetching all and filtering if complex query fails
        const snapshot = await getDocs(collection(db, 'hotels'));
        const allHotels = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return allHotels.filter(hotel =>
            hotel.isVisible !== false &&
            (hotel.city?.toLowerCase().includes(destLower) ||
                hotel.location?.toLowerCase().includes(destLower))
        );
    } catch (error) {
        console.error("Error fetching IY Hotels:", error);
        return [];
    }
};

// Fetch active transport fleet
const fetchIYTransport = async () => {
    try {
        const snapshot = await getDocs(query(collection(db, 'transport_vehicles'), where('isActive', '==', true)));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching IY Transport:", error);
        return [];
    }
};

const buildPrompt = (formData, iyHotels, iyTransport) => {
    const hotelContext = iyHotels.length > 0
        ? `IY PARTNER HOTELS IN ${formData.destination.toUpperCase()}:\n` +
        iyHotels.map(h => `- ${h.name}: ₹${h.price || h.startingPrice}/night, Rating: ${h.rating || 'N/A'}, City: ${h.city}.`).join('\n')
        : `No IY partner hotels found in ${formData.destination} yet.`;

    const transportContext = iyTransport.length > 0
        ? `IY TRANSPORT FLEET AVAILABLE:\n` +
        iyTransport.slice(0, 8).map(t => `- ${t.name || t.vehicleType}: ₹${t.pricePerKm || t.price}/km`).join('\n')
        : `No IY transport vehicles currently active.`;

    return `You are the AI Trip Planner for Infinite Yatra, a premium Indian travel company. Create a detailed, personalized travel itinerary.

TRIP DETAILS:
- Destination: ${formData.destination}
- Duration: ${formData.duration} days
- Dates: ${formData.startDate} to ${formData.endDate}
- Travellers: ${formData.adults} adults, ${formData.children} children
- Travel Type: ${formData.travelType}
- Travel Pace: ${formData.pace}
- Budget Category: ${formData.budget}
- Accommodation: ${formData.accommodation}
- Transport Preference: ${formData.transport}
- Special Interests: ${Array.isArray(formData.interests) ? formData.interests.join(', ') : formData.interests}
- Special Requests: ${formData.specialRequests || 'None'}

${hotelContext}

${transportContext}

INSTRUCTIONS:
1. Generate a complete day-by-day itinerary in valid JSON format only. No markdown, no explanation outside JSON.
2. For hotels, PRIORITIZE recommending IY partner hotels if available for this destination. Mark them with "iy_partner": true and include their actual price. If you suggest a generic hotel, set "iy_partner": false.
3. For transport, recommend IY fleet options where applicable. Mark with "iy_transport": true.
4. Include a realistic budget breakdown in INR (₹).
5. Ensure the schedule matches the requested "Pace".

RESPOND WITH THIS EXACT JSON STRUCTURE:
{
  "tripTitle": "string",
  "destination": "${formData.destination}",
  "duration": ${formData.duration},
  "totalBudgetEstimate": {
    "min": number,
    "max": number,
    "breakdown": {
      "accommodation": number,
      "transport": number,
      "food": number,
      "activities": number,
      "miscellaneous": number
    }
  },
  "days": [
    {
      "day": 1,
      "title": "string",
      "activities": [
          {
             "time": "string (e.g. 9:00 AM)",
             "period": "morning | afternoon | evening",
             "title": "string",
             "description": "string",
             "duration": "string"
          }
      ],
      "accommodation": {
        "name": "string",
        "pricePerNight": number,
        "iy_partner": boolean,
        "iy_hotel_id": "string or null"
      },
      "transport": {
        "description": "string",
        "estimatedCost": number,
        "iy_transport": boolean
      },
      "meals": {
        "breakfast": "string",
        "lunch": "string",
        "dinner": "string"
      },
      "dayBudget": number,
      "proTip": "string"
    }
  ],
  "packingList": ["string"],
  "bestTimeToVisit": "string"
}`;
};

export const generatePlanWithGemini = async (formData) => {
    try {
        console.log("Fetching IY data for:", formData.destination);
        const [iyHotels, iyTransport] = await Promise.all([
            fetchIYHotels(formData.destination),
            fetchIYTransport()
        ]);

        console.log(`Found ${iyHotels.length} IY hotels and ${iyTransport.length} IY vehicles.`);
        const prompt = buildPrompt(formData, iyHotels, iyTransport);

        console.log("Calling Groq API...");
        const response = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama3-8b-8192",
            temperature: 0.7,
            response_format: { type: "json_object" }
        });

        const text = response.choices[0]?.message?.content || "";

        // Clean JSON (remove any markdown fences if present)
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            return JSON.parse(cleaned);
        } catch (parseError) {
            console.error("Failed to parse AI output:", cleaned);
            throw new Error("AI generated an invalid format. Please try again.");
        }
    } catch (error) {
        console.error('Groq / AI error:', error);
        throw new Error("Failed to generate plan securely. Please try again. " + (error.message || ""));
    }
};
