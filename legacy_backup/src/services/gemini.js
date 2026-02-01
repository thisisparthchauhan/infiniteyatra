import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the API with the key from environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI = null;
if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
}

export const generateItinerary = async (formData) => {
    if (!genAI) {
        throw new Error("Gemini API Key is missing. Please add VITE_GEMINI_API_KEY to your .env file.");
    }

    // We use gemini-1.5-flash as it is the fastest and most cost-effective model for this use case.
    // If this fails, it is likely an API key permission issue.
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
    });

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
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up the response if it contains markdown code blocks
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Error generating itinerary:", error);

        // Provide specific, actionable error messages
        if (error.message.includes("404")) {
            throw new Error("Google API Error: Model not found. Please ensure the 'Google Generative AI API' is enabled in your Google Cloud Console.");
        } else if (error.message.includes("403") || error.message.includes("API key")) {
            throw new Error("Google API Error: Invalid API Key. Please check your key permissions.");
        } else {
            throw new Error(`AI Generation Failed: ${error.message}`);
        }
    }
};
