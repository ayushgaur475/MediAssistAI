import axios from 'axios';

async function testEndpoint() {
  console.log("Testing AI Doctor Endpoint...");
  try {
    const response = await axios.post("http://localhost:5000/api/ai-doctor/chat", {
      messages: [{ role: "user", content: "I have a headache" }]
    });
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.error("HTTP Error:", error.response.status, error.response.data);
    } else {
      console.error("Error:", error.message);
    }
  }
}

testEndpoint();
