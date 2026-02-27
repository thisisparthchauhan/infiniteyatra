import OpenAI from "openai";

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

let openai = null;
if (API_KEY) {
    openai = new OpenAI({
        apiKey: API_KEY,
        dangerouslyAllowBrowser: true // Required for client-side usage
    });
}

export const generateItinerary = async (formData) => {
    if (!openai) {
        throw new Error("OpenAI API Key is missing. Please add VITE_OPENAI_API_KEY to your .env file.");
    }

    const prompt = `
    Act as an expert travel planner. Create a detailed ${formData.days}-day itinerary for a trip to ${formData.destination}.
    
    Preferences:
    - Travelers: ${formData.travelers}
    - Budget Level: ${formData.budget}
    - Travel Style: ${formData.travelStyle.join(', ')}
    - Dates: ${formData.startDate} to ${formData.endDate}

    Return the response ONLY in valid JSON format with this exact structure (no markdown, no code blocks):
    {
        "destination": "${formData.destination}",
        "days": ${formData.days},
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
                "title": "Day Title",
                "activities": [
                    {
                        "time": "9:00 AM",
                        "period": "morning",
                        "title": "Activity Title",
                        "description": "Short description",
                        "duration": "2 hours"
                    },
                    {
                        "time": "2:00 PM",
                        "period": "afternoon",
                        "title": "Activity Title",
                        "description": "Short description",
                        "duration": "2 hours"
                    },
                    {
                        "time": "7:00 PM",
                        "period": "evening",
                        "title": "Activity Title",
                        "description": "Short description",
                        "duration": "2 hours"
                    }
                ]
            }
        ]
    }
    `;

    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: "You are a helpful travel assistant." }, { role: "user", content: prompt }],
            model: "gpt-4o", // Using the latest model for best results
            response_format: { type: "json_object" }
        });

        const jsonString = completion.choices[0].message.content;
        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Error generating itinerary:", error);

        if (error.status === 401) {
            throw new Error("OpenAI Error: Invalid API Key. Please check your key.");
        } else if (error.status === 429) {
            throw new Error("OpenAI Error: Rate limit exceeded or insufficient quota.");
        } else {
            throw new Error(`AI Generation Failed: ${error.message}`);
        }
    }
};
