import OpenAI from "openai";

// Read key from .env manually since we can't use import.meta.env in node directly easily without setup
// We will just hardcode the key we read from the file for this test script
const API_KEY = "sk-efgh5678abcd1234efgh5678abcd1234efgh5678";

const openai = new OpenAI({
    apiKey: API_KEY,
});

async function checkOpenAI() {
    console.log("Testing OpenAI Key...");
    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: "Hello" }],
            model: "gpt-3.5-turbo",
        });
        console.log("✅ SUCCESS: OpenAI is working!");
        console.log(completion.choices[0].message.content);
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}`);
    }
}

checkOpenAI();
