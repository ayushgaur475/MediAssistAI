import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;

async function testGroq() {
    console.log("Testing Groq API...");
    console.log("Key length:", GROQ_API_KEY?.length);
    console.log("Key starts with:", GROQ_API_KEY?.substring(0, 4));

    if (!GROQ_API_KEY) {
        console.error("ERROR: No GROQ_API_KEY found in .env");
        return;
    }

    try {
        const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: "Hello" }],
            temperature: 0.1
        }, {
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            }
        });
        console.log("SUCCESS! Groq responded.");
        console.log("Reply:", response.data.choices[0].message.content);
    } catch (e) {
        if (e.response) {
            console.error("GROQ API ERROR:", e.response.status, e.response.data);
        } else {
            console.error("NETWORK/OTHER ERROR:", e.message);
        }
    }
}

testGroq();
