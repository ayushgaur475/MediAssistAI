import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;

async function testGroq() {
  console.log("Testing Groq connectivity with Axios...");
  console.log("Using API Key:", GROQ_API_KEY ? (GROQ_API_KEY.substring(0, 10) + "...") : "MISSING");
  
  try {
    const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: "Hello" }],
      max_tokens: 5
    }, {
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      }
    });
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.error("HTTP Error:", error.response.status, JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Error:", error.message);
    }
  }
}

testGroq();
