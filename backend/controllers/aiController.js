/**
 * AI Doctor Medical Brain
 * Intelligently interacts with Groq AI for health guidance.
 */
import dotenv from "dotenv";
import axios from "axios";
dotenv.config();

export const chatWithAiDoctor = async (req, res) => {
  try {
    const { message, messages, userProfile } = req.body;
    const chatHistory = messages || (message ? [{ role: "user", content: message }] : []);

    if (!chatHistory.length) {
      return res.status(400).json({ error: "Invalid request." });
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      return res.status(500).json({ reply: "API Key Error." });
    }

    // Construct Profile Context
    const profileContext = userProfile 
      ? `USER PROFILE: Age: ${userProfile.age}, Gender: ${userProfile.gender}, Weight: ${userProfile.weight}kg. \n`
      : "";

    const systemPrompt = {
      role: "system",
      content: "You are an AI healthcare assistant. " + profileContext +
               "\n--- STRICTURES ---\n" +
               "1. Suggest 1-3 OTC medicines for symptoms.\n" +
               "2. MEDICINE NAME must be SHORT (1-3 words max). DO NOT include descriptions in the name.\n" +
               "3. COMPULSORY: GENERATE A WELLNESS PLAN (Diet, Exercise, Yoga) at the end.\n" +
               "--- FINAL TAG FORMAT (STRICT) ---\n" +
               "SPECIALTY: <Type>\n" +
               "MEDICINES: [Medicine Name | Brief Clinical Reason, ...]\n" +
               "###WELLNESS_PLAN###\n" +
               "{ \"diet\": [...], \"exercise\": [...], \"yoga\": [...] }"
    };

    const apiMessages = [systemPrompt, ...chatHistory.map(m => ({ role: m.role, content: m.content }))];

    let response;
    try {
      response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
        model: "llama-3.1-8b-instant",
        messages: apiMessages,
        temperature: 0.1 // Lowered for stricter formatting
      }, {
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 20000 // 20s timeout to prevent hanging connections
      });
    } catch (e) {
      if (e.response) {
        console.error("GROQ_ERROR:", e.response.data);
        throw new Error(`Groq API returned ${e.response.status}`);
      } else if (e.code === 'ECONNABORTED') {
        console.error("GROQ_TIMEOUT: Taking too long to respond.");
        throw new Error("Groq API Timeout");
      } else {
        console.error("GROQ_NETWORK_ERROR:", e.message);
        throw new Error("Network error reaching Groq API");
      }
    }

    const replyContent = response.data.choices[0]?.message?.content || "";
    console.log("--- RAW AI RESPONSE ---");
    console.log(replyContent);
    console.log("------------------------");

    let suggestion = null;
    let medicines = [];
    let wellnessPlan = null;
    let cleanReply = replyContent;

    // 1. Wellness Plan Parsing (Robust JSON search)
    const wellnessMarkers = ["###WELLNESS_PLAN###", "WELLNESS PLAN:", "Wellness Plan:"];
    let planIndex = -1;
    for (const marker of wellnessMarkers) {
      const idx = cleanReply.indexOf(marker);
      if (idx !== -1) {
        planIndex = idx;
        break;
      }
    }

    if (planIndex !== -1) {
      const remainingText = cleanReply.substring(planIndex);
      const jsonMatch = remainingText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          wellnessPlan = JSON.parse(jsonMatch[0]);
          // Clean the reply by removing everything from the marker onwards
          cleanReply = cleanReply.substring(0, planIndex).trim();
        } catch (e) {
          console.error("Wellness Plan JSON Parse Error:", e.message);
        }
      }
    }

    // 2. Specialty Extraction (More flexible pattern)
    const specialtyRegex = /(?:SPECIALTY|Specialty|Suggest):\s*([A-Za-z\s\/]+)(?:\n|$)/i;
    const specMatch = cleanReply.match(specialtyRegex);
    if (specMatch) {
      suggestion = specMatch[1].trim();
      cleanReply = cleanReply.replace(specMatch[0], "").trim();
    }

    // 3. Medicine Parsing (Greedy "Hunt")
    // Match common formats: [Med | Reason], Med | Reason, Medicine: Name - Reason
    const medPatterns = [
      /\[?([A-Za-z\s\d\-]+)\s*\|\s*([^\]\n]+)\]?/g,
      /(?:MEDICINES|Medicines):\s*(.+)/gi
    ];

    let foundMeds = [];
    // Try structured format first [Name | Reason]
    let match;
    const structuredPattern = /\[?([A-Za-z\s\d\-]+)\s*\|\s*([^\]\n]+)\]?/g;
    while ((match = structuredPattern.exec(replyContent)) !== null) {
      let name = match[1].replace(/[*#\[\]\(\)]/g, "").replace(/^\d+[\.\)]\s*/, "").trim();
      let desc = match[2].replace(/[*#\[\]\(\)]/g, "").trim();

      if (name.length > 2 && name.toLowerCase() !== "medicine name" && name.toLowerCase() !== "specialty") {
        foundMeds.push({ name, description: desc });
      }
    }

    // If no medicines found via structured pattern, look for comma separated list or other markers
    if (foundMeds.length === 0) {
      const listMatch = replyContent.match(/(?:MEDICINES|Medicines):\s*([\s\S]+?)(?:\n\n|\n###|$)/i);
      if (listMatch) {
        const lines = listMatch[1].split(/[,\n]/);
        lines.forEach(line => {
          const parts = line.split(/[|\-:]/);
          if (parts[0]) {
            let name = parts[0].replace(/[*#\[\]\(\)]/g, "").replace(/^\d+[\.\)]\s*/, "").trim();
            let desc = parts[1] ? parts[1].trim() : "Follow package instructions.";
            if (name.length > 2 && name.length < 30) {
              foundMeds.push({ name, description: desc });
            }
          }
        });
      }
    }
    medicines = foundMeds;

    // 4. Final Cleanup of the conversational reply
    cleanReply = cleanReply
      .replace(/SPECIALTY:.*$/gim, "")
      .replace(/MEDICINES:.*$/gim, "")
      .replace(/\[\s*\|\s*.*\]/g, "")
      .replace(/###WELLNESS_PLAN###/g, "")
      .replace(/\r/g, "")
      .trim();

    // Ensure we don't return an empty reply if the AI put everything in tags
    if (!cleanReply || cleanReply.length < 5) {
      cleanReply = "I have reviewed your symptoms and prepared some recommendations below.";
    }

    return res.status(200).json({ 
      reply: cleanReply,
      suggestion, 
      medicines, 
      wellnessPlan,
      disclaimer: "AI guidance is for informational purposes. Please consult a physical doctor if symptoms persist."
    });

  } catch (error) {
    console.error("AI Doctor Error:", error);
    const errorMsg = error.response?.data?.error?.message || error.message || "Unknown Error";
    const errorStatus = error.response?.status || 500;
    
    return res.status(errorStatus).json({ 
      reply: `I encountered a technical issue: ${errorMsg}`,
      debug: {
        status: errorStatus,
        details: error.response?.data || error.message,
        keyPresent: !!process.env.GROQ_API_KEY,
        keyStart: process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.substring(0, 7) : "MISSING"
      }
    });
  }
};

export const checkAiStatus = async (req, res) => {
  const key = process.env.GROQ_API_KEY;
  res.json({
    status: "online",
    keyLoaded: !!key,
    keyPrefix: key ? key.substring(0, 10) + "..." : "NONE",
    model: "llama-3.1-8b-instant",
    timestamp: new Date().toISOString()
  });
};
