import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyAXuM1unbenq4UqpXBtRfXeeRTdszBFUTA";
const genAI = new GoogleGenerativeAI(API_KEY);

async function checkSpecificModels() {
    const models = [
        "gemini-1.5-flash-001",
        "gemini-1.5-flash-002",
        "gemini-1.5-flash-8b",
        "gemini-1.5-pro-001",
        "gemini-1.5-pro-002",
        "gemini-2.0-flash-exp"
    ];

    console.log("Testing specific model versions...");

    for (const modelName of models) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            await model.generateContent("Hello");
            console.log(`✅ SUCCESS: ${modelName} is working!`);
            // If we find one, we can stop or list all working ones
        } catch (error) {
            console.log(`❌ FAILED: ${modelName} - ${error.message.split('[')[0]}`); // Print short error
        }
    }
}

checkSpecificModels();
