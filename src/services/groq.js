import OpenAI from "openai";

const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

let groq = null;
if (API_KEY) {
    groq = new OpenAI({
        apiKey: API_KEY,
        baseURL: "https://api.groq.com/openai/v1",
        dangerouslyAllowBrowser: true // Required for client-side usage
    });
}

export const generateItinerary = async (formData) => {
    if (!groq) {
        throw new Error("Groq API Key is missing. Please add VITE_GROQ_API_KEY to your .env file.");
    }

    console.log("Groq Service received data:", formData); // Debug log

    // Calculate days
    let days = 5; // default
    let dateInfo = "";

    if (formData.isFlexible) {
        days = formData.flexibleDays;
        dateInfo = `Flexible trip in ${formData.flexibleMonth}`;
    } else if (formData.startDate && formData.endDate) {
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        const diffTime = Math.abs(end - start);
        days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        dateInfo = `${formData.startDate} to ${formData.endDate}`;
    }

    const prompt = `
    You are an elite travel curator who knows the world's hidden gems. 
    Create a unique, non-generic ${days}-day itinerary for ${formData.destination}.
    
    User Profile:
    - Travelers: ${formData.travelers} (${formData.groupType})
    - Accommodation Level: ${formData.budget} (Comfort, Premium, or Luxury)
    - Pace: ${formData.pace} (Ambitious or Relaxed)
    - Travel Style: ${formData.travelStyle.join(', ')}
    - Other Needs/Interests: ${formData.interests || "None"}
    - Dates: ${dateInfo}

    CRITICAL INSTRUCTIONS:
    1. NO GENERIC TITLES. Instead of "Visit Museum", use "Explore the Louvre's Hidden Wings".
    2. BE SPECIFIC. Name specific restaurants, specific dishes to try, and specific spots for sunset.
    3. AVOID CLICHES. Include at least one "hidden gem" or local secret per day.
    4. DESCRIPTIONS MUST BE ENGAGING. Write like a travel writer, not a robot.
    5. RESPECT THE PACE. If pace is "Relaxed", do not pack the day. If "Ambitious", maximize sightseeing.
    6. CATER TO GROUP TYPE. If "Family", include kid-friendly spots. If "Couple", include romantic spots.
    7. ACCOMMODATION: Suggest hotels matching the "${formData.budget}" level.

    Return the response ONLY in valid JSON format with this exact structure:
    {
        "destination": "${formData.destination}",
        "days": ${days},
        "travelers": "${formData.travelers}",
        "costBreakdown": {
            "daily": number,
            "total": number,
            "perPerson": number,
            "categories": {
                "accommodation": number,
                "food": number,
                "activities": number,
                "transport": number
            }
        },
        "dayPlans": [
            {
                "day": 1,
                "title": "Creative Day Title",
                "activities": [
                    {
                        "time": "9:00 AM",
                        "period": "morning",
                        "title": "Specific Activity Name",
                        "description": "Engaging, detailed description of what to do, see, and eat here.",
                        "duration": "2 hours"
                    },
                    {
                        "time": "2:00 PM",
                        "period": "afternoon",
                        "title": "Specific Activity Name",
                        "description": "Engaging, detailed description of what to do, see, and eat here.",
                        "duration": "2 hours"
                    },
                    {
                        "time": "7:00 PM",
                        "period": "evening",
                        "title": "Specific Activity Name",
                        "description": "Engaging, detailed description of what to do, see, and eat here.",
                        "duration": "2 hours"
                    }
                ]
            }
        ]
    }
    `;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are a world-class travel expert. You hate generic advice. You provide specific, actionable, and culturally rich travel plans." },
                { role: "user", content: prompt }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7, // Increase creativity
            response_format: { type: "json_object" }
        });

        const jsonString = completion.choices[0].message.content;
        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Error generating itinerary:", error);

        if (error.status === 401) {
            throw new Error("Groq Error: Invalid API Key. Please check your key.");
        } else if (error.status === 429) {
            throw new Error("Groq Error: Rate limit exceeded or insufficient quota.");
        } else {
            throw new Error(`AI Generation Failed: ${error.message}`);
        }
    }
};
