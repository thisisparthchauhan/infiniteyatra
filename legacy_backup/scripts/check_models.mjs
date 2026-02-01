import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyAXuM1unbenq4UqpXBtRfXeeRTdszBFUTA";
const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
    try {
        console.log("Fetching available models...");
        // For some reason listModels is not directly exposed on the client in some versions, 
        // but let's try to just use a known model and see if it works in a simple script.
        // If listModels is not available, we will try to generate content with a few candidates.

        const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro", "gemini-1.0-pro"];

        for (const modelName of models) {
            console.log(`\nTesting model: ${modelName}`);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hello, are you working?");
                const response = await result.response;
                console.log(`✅ SUCCESS: ${modelName} is working!`);
                console.log(`Response: ${response.text()}`);
            } catch (error) {
                console.log(`❌ FAILED: ${modelName}`);
                console.log(`Error: ${error.message}`);
            }
        }

    } catch (error) {
        console.error("Global Error:", error);
    }
}

listModels();
