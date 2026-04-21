import axios from 'axios';

async function testFullRequest() {
  console.log("Testing AI Doctor Endpoint with full request body...");
  const requestBody = {
    messages: [
      { role: "assistant", content: "Hello! I am your Medi.Assist AI Doctor. How are you feeling today? Tell me your symptoms, and I'll guide you." },
      { role: "user", content: "I have a sharp back pain since morning." }
    ],
    userProfile: null
  };

  try {
    const response = await axios.post("http://localhost:5000/api/ai-doctor/chat", requestBody);
    console.log("Status:", response.status);
    console.log("Response JSON:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.error("HTTP Error:", error.response.status, JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Error:", error.message);
    }
  }
}

testFullRequest();
