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

    let suggestion = null;
    let medicines = [];
    let wellnessPlan = null;
    let cleanReply = replyContent;

    // 1. Wellness Plan Parsing
    const planRegex = /###WELLNESS_PLAN###\s*({[\s\S]*})/i;
    const planMatch = cleanReply.match(planRegex);
    if (planMatch) {
      try {
        wellnessPlan = JSON.parse(planMatch[1]);
        cleanReply = cleanReply.replace(planMatch[0], "").trim();
      } catch (e) {}
    }

    // 2. Specialty & Tag Extraction (Greedy Fallbacks)
    const specialtyMatch = cleanReply.match(/(?:SPECIALTY:\s*|\()([A-Za-z\s\/]+)(?:\)|(?:\s*MEDICINES:))/i);
    if (specialtyMatch) {
      suggestion = specialtyMatch[1].trim();
      cleanReply = cleanReply.replace(specialtyMatch[0], "").trim();
    }

    // 3. Medicine Parsing (Greedy "Hunt" for [Name | Reason] patterns)
    // Matches patterns like [Med | Reason], (Med | Reason), or even just med | reason
    const medPattern = /\[?([A-Za-z\s\d\-]+)\s*\|\s*([^\]\)]+)\]?/g;
    let match;
    while ((match = medPattern.exec(replyContent)) !== null) {
      let name = match[1].replace(/[*#\[\]\(\)]/g, "").replace(/^\d+[\.\)]\s*/, "").trim();
      let desc = match[2].replace(/[*#\[\]\(\)]/g, "").trim();

      // Final validation: Ensure it's not a generic instruction
      if (name.length > 2 && name.toLowerCase() !== "medicine name") {
        medicines.push({ name, description: desc });
        // Remove the matched text from cleanReply so it doesn't show in the chat
        cleanReply = cleanReply.replace(match[0], "").trim();
      }
    }

    // Comprehensive Post-Clean
    cleanReply = cleanReply
      .replace(/SPECIALTY:.*$/gim, "")
      .replace(/MEDICINES:.*$/gim, "")
      .replace(/\[\s*\|\s*.*\]/g, "")
      .replace(/\s*\(.*\)\s*/g, (match) => (match.includes("Plan") || match.includes("|") ? "" : match))
      .trim();

    cleanReply = cleanReply.split("SPECIALTY:")[0].split("MEDICINES:")[0].split("###")[0].trim();

    return res.status(200).json({ 
      reply: cleanReply,
      suggestion, 
      medicines, 
      wellnessPlan,
      disclaimer: "AI for informational use only."
    });

  } catch (error) {
    console.error("AI Doctor Error:", error);
    return res.status(500).json({ reply: "I encountered a technical issue. Please try again." });
  }
};
