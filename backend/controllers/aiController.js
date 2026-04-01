/**
 * AI Doctor Medical Brain
 * Handles symptom-to-specialist mapping and general guidance.
 */

const MEDICAL_KNOWLEDGE = {
  "chest pain": { specialist: "Cardiologist", advice: "Please sit down and rest. If the pain radiates to your arm or jaw, use the SOS button immediately." },
  "headache": { specialist: "Neurologist", advice: "Rest in a quiet, dark room. Stay hydrated. If it's the 'worst headache of your life', seek emergency care." },
  "stomach": { specialist: "Gastroenterologist", advice: "Avoid solid food for a few hours. Sip clear fluids. Avoid spicy or oily food." },
  "back pain": { specialist: "Orthopedic", advice: "Apply a cold pack. Avoid heavy lifting. Try gentle stretching if not too painful." },
  "fever": { specialist: "General Physician", advice: "Monitor your temperature. Stay hydrated with electrolytes. Get plenty of rest." },
  "rash": { specialist: "Dermatologist", advice: "Avoid scratching. Keep the area clean and dry. Note if you've used any new products recently." },
  "vision": { specialist: "Eye Specialist", advice: "Avoid rubbing your eyes. Reduce screen time. If vision loss is sudden, see a doctor immediately." },
  "tooth": { specialist: "Dentist", advice: "Rinse with warm salt water. Avoid very hot or cold food. See a dentist soon." },
  "anxiety": { specialist: "Psychiatrist", advice: "Practice deep breathing (4-7-8 technique). I recommend trying our brand new [Zen.Zone](/zen-zone) for an instant mental reset." },
  "cough": { specialist: "ENT Specialist", advice: "Gargle with warm salt water. Use a humidifier. Stay hydrated." }
};

export const chatWithAiDoctor = async (req, res) => {
  try {
    const { message } = req.body;
    const msg = message.toLowerCase();

    let reply = "I understand you're feeling unwell. Let me help you. Can you tell me more about where it hurts or any other symptoms?";
    let suggestion = null;

    // Direct Mapping Logic
    for (const [key, data] of Object.entries(MEDICAL_KNOWLEDGE)) {
      if (msg.includes(key)) {
        reply = `It sounds like you're experiencing ${key}. ${data.advice} I recommend consulting a specialist for a proper diagnosis.`;
        suggestion = data.specialist;
        break;
      }
    }

    // Contextual Guidance if no direct match
    if (!suggestion) {
      if (msg.includes("medicine") || msg.includes("drug")) {
        reply = "I cannot prescribe specific medications without a physical examination. However, I can suggest a General Physician who can help you after a check-up.";
        suggestion = "General Physician";
      } else if (msg.includes("help") || msg.includes("doctor")) {
        reply = "I can definitely help you find the right doctor. What are your symptoms? I can filter our map specifically for you.";
      }
    }

    return res.status(200).json({ 
      reply,
      suggestion,
      disclaimer: "Disclaimer: Medi.Assist AI is for guidance only and not a substitute for professional medical advice."
    });

  } catch (error) {
    console.error("AI Doctor Error:", error);
    return res.status(500).json({ error: "Internal Medical Brain Error" });
  }
};
