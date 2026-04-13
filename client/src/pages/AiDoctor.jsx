import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Send, Bot, User, Sparkles, AlertCircle, ChevronLeft, MapPin, 
  RefreshCcw, Pill, ShoppingCart, ExternalLink, Utensils, 
  Activity, CircleDot, Download, ChevronRight, UserPlus, X 
} from "lucide-react";

const QUICK_SUGGESTIONS = [
  { label: "I have a fever", value: "I have a fever and headache, what should I do?" },
  { label: "Sharp back pain", value: "I have a sharp back pain since morning." },
  { label: "Stomach ache", value: "My stomach hurts after eating." },
  { label: "Skin rash", value: "I have a red itchy rash on my arm." }
];

export default function AiDoctor() {
  const [messages, setMessages] = useState([
    { 
      role: "assistant", 
      content: "Hello! I am your Medi.Assist AI Doctor. How are you feeling today? Tell me your symptoms, and I'll guide you." 
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [userProfile, setUserProfile] = useState({
    age: "",
    gender: "",
    weight: "",
    height: ""
  });
  const [activePlanTabs, setActivePlanTabs] = useState({}); // Tracking active tab per message
  
  const scrollRef = useRef(null);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, loading]);

  const handleSend = async (customText) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage = { role: "user", content: textToSend };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/ai-doctor/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: newMessages,
          userProfile: userProfile.age ? userProfile : null 
        })
      });
      const data = await response.json();
      
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: data.reply,
        suggestion: data.suggestion,
        medicines: data.medicines || [],
        wellnessPlan: data.wellnessPlan || null,
        disclaimer: "This AI provides general health information only."
      }]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Unable to fetch response. Please try again." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (val) => {
    handleSend(val);
  };

  const openPharmacy = (name, platform) => {
    const baseUrl = platform === '1mg' 
      ? `https://www.1mg.com/search/all?name=${encodeURIComponent(name)}`
      : `https://pharmeasy.in/search/all?name=${encodeURIComponent(name)}`;
    window.open(baseUrl, '_blank');
  };

  const downloadPlan = (msg) => {
    if (!msg.wellnessPlan) return;
    const plan = msg.wellnessPlan;
    const content = `
MEDI.ASSIST AI - PERSONALIZED WELLNESS PLAN
------------------------------------------
DIET CHART:
${plan.diet.map(item => `- ${item}`).join('\n')}

EXERCISE PLAN:
${plan.exercise.map(item => `- ${item}`).join('\n')}

YOGA RECOMMENDATIONS:
${plan.yoga.map(item => `- ${item}`).join('\n')}

Disclaimer: This plan is AI-generated for general guidance. Consult a doctor before starting any new regime.
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MediAssist_Plan_${new Date().toLocaleDateString()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] p-2 md:p-4 font-['Outfit'] transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto h-[calc(100vh-40px)] flex flex-col glass-card rounded-[2rem] overflow-hidden shadow-2xl relative border border-gray-200 dark:border-white/10 backdrop-blur-xl bg-white/60 dark:bg-inherit transition-all">
        
        {/* Header (unchanged lines skipped for brevity in replace_file_content) */}
        <div className="p-6 border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 flex items-center justify-between transition-colors">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-gradient-to-tr from-cyan-400 to-purple-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                <Bot size={28} />
             </div>
             <div>
                <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Medi.Assist <span className="text-cyan-500 dark:text-cyan-400 font-black">AI</span></h2>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Medical Guidance Mode</span>
                </div>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowProfile(!showProfile)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all text-[10px] font-bold uppercase tracking-wider ${
                showProfile 
                ? "bg-cyan-500 text-white shadow-lg" 
                : "bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <UserPlus size={14} />
              {userProfile.age ? "Profile Set" : "Personalize AI"}
            </button>
            <button 
              onClick={() => setMessages([{ role: "assistant", content: "Hello! I am your Medi.Assist AI Doctor. How are you feeling today?" }])}
              className="p-2 rounded-xl hover:bg-white/10 transition-all text-gray-400 hover:text-white"
              title="Reset Chat"
            >
              <RefreshCcw size={18} />
            </button>
            <button 
              onClick={() => navigate("/")}
              className="p-2 rounded-xl hover:bg-white/10 transition-all text-gray-400 hover:text-white"
            >
              <ChevronLeft size={20} />
            </button>
          </div>
        </div>

        {/* Profile Form (Personalize AI) */}
        <AnimatePresence>
          {showProfile && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-cyan-500/5 border-b border-cyan-500/20 overflow-hidden"
            >
              <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                 {[
                   { label: "Age", key: "age", type: "number", placeholder: "e.g. 24" },
                   { label: "Gender", key: "gender", type: "text", placeholder: "M / F" },
                   { label: "Weight (kg)", key: "weight", type: "number", placeholder: "e.g. 70" },
                   { label: "Height (cm)", key: "height", type: "number", placeholder: "e.g. 175" }
                 ].map((field) => (
                   <div key={field.key} className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider px-1">{field.label}</label>
                      <input 
                        type={field.type}
                        placeholder={field.placeholder}
                        value={userProfile[field.key]}
                        onChange={(e) => setUserProfile({...userProfile, [field.key]: e.target.value})}
                        className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-cyan-500 transition-all text-gray-900 dark:text-white"
                      />
                   </div>
                 ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-white/10 scrollbar-track-transparent"
        >
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[85%] flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                  msg.role === "user" ? "bg-cyan-500 text-white" : "bg-purple-600 text-white"
                }`}>
                  {msg.role === "user" ? <User size={20} /> : <Bot size={20} />}
                </div>
                <div className={`flex flex-col gap-3 min-w-[300px] md:min-w-[500px] lg:min-w-[600px] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div className={`p-5 rounded-2xl text-sm md:text-base leading-relaxed shadow-sm w-full ${
                    msg.role === "user" 
                    ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-900 dark:text-white rounded-tr-none" 
                    : "bg-gray-100/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-100 rounded-tl-none font-light"
                  }`}>
                    {msg.content}
                  </div>
                  
                  {/* Specialized Suggestion Card */}
                  {msg.suggestion && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="glass-card p-4 rounded-2xl border-l-4 border-cyan-500 dark:border-cyan-400 flex items-center justify-between gap-6 w-full bg-white/40 dark:bg-white/5"
                    >
                      <div>
                        <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1 text-left">Recommended Specialist</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight">{msg.suggestion}</p>
                      </div>
                      <button 
                        onClick={() => navigate(`/map?mode=doctor&speciality=${msg.suggestion.toLowerCase()}`)}
                        className="bg-cyan-400 text-black px-4 py-2 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2 font-bold text-xs shrink-0"
                      >
                        <MapPin size={14} />
                        FIND NOW
                      </button>
                    </motion.div>
                  )}

                  {/* Medicine Suggestions Card */}
                  {msg.medicines && msg.medicines.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-full space-y-3"
                    >
                      <div className="flex items-center gap-2 px-2 text-cyan-400 font-bold uppercase text-[10px] tracking-[0.2em]">
                        <Pill size={14} />
                        Suggested Health Support
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {msg.medicines.map((med, k) => (
                          <div key={k} className="glass-card p-4 rounded-2xl border border-gray-200 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 dark:bg-white/5">
                            <div className="flex-1">
                              <h4 className="text-gray-900 dark:text-white font-bold text-sm flex items-center gap-2">
                                {med.name}
                                <span className="bg-cyan-500/20 text-cyan-400 text-[8px] px-2 py-0.5 rounded-full uppercase tracking-tighter">OTC</span>
                              </h4>
                              <p className="text-gray-600 dark:text-gray-400 text-[11px] mt-1 leading-relaxed">{med.description}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                               <button 
                                 onClick={() => openPharmacy(med.name, '1mg')}
                                 className="px-3 py-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[10px] text-gray-800 dark:text-white flex items-center gap-2 hover:bg-cyan-500/20 transition-all font-bold"
                               >
                                 <ShoppingCart size={12} className="text-cyan-400" /> 1mg
                               </button>
                               <button 
                                 onClick={() => openPharmacy(med.name, 'PharmEasy')}
                                 className="px-3 py-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[10px] text-gray-800 dark:text-white flex items-center gap-2 hover:bg-purple-500/20 transition-all font-bold"
                               >
                                 <ShoppingCart size={12} className="text-purple-400" /> PharmEasy
                               </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-start gap-2 bg-red-400/5 p-3 rounded-xl border border-red-400/10 text-[10px] text-red-300 leading-tight">
                         <AlertCircle size={14} className="shrink-0 mt-0.5" />
                         Medicines listed are for general information only. Consult a doctor before use and do not take if you have allergies or chronic conditions.
                      </div>
                    </motion.div>
                  )}

                  {/* Wellness Plan Card */}
                  {msg.wellnessPlan && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-full space-y-4"
                    >
                      <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2 text-purple-500 dark:text-purple-400 font-bold uppercase text-[10px] tracking-[0.2em]">
                          <Sparkles size={14} />
                          Personalized Wellness Plan
                        </div>
                        <button 
                          onClick={() => downloadPlan(msg)}
                          className="flex items-center gap-2 text-[10px] font-black text-white bg-purple-600 px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-all shadow-md shadow-purple-600/20"
                        >
                          <Download size={14} /> DOWNLOAD
                        </button>
                      </div>

                      <div className="glass-card rounded-[1.5rem] overflow-hidden border border-gray-200 dark:border-white/10 bg-white/40 dark:bg-white/5 flex flex-col">
                        {/* Tabs */}
                        <div className="flex items-center bg-gray-100/50 dark:bg-black/20 p-1">
                            {[
                              { id: 'diet', label: 'Diet', icon: Utensils, color: 'text-orange-500' },
                              { id: 'exercise', label: 'Exercise', icon: Activity, color: 'text-green-500' },
                              { id: 'yoga', label: 'Yoga', icon: CircleDot, color: 'text-blue-500' }
                            ].map((tab) => (
                              <button
                                key={tab.id}
                                onClick={() => setActivePlanTabs({...activePlanTabs, [i]: tab.id})}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${
                                  (activePlanTabs[i] || 'diet') === tab.id 
                                  ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm" 
                                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                }`}
                              >
                                <tab.icon size={14} className={tab.color} />
                                {tab.label}
                              </button>
                            ))}
                        </div>
                        
                        {/* Content */}
                        <div className="p-5 min-h-[140px]">
                           <motion.div
                             key={activePlanTabs[i] || 'diet'}
                             initial={{ opacity: 0, x: 10 }}
                             animate={{ opacity: 1, x: 0 }}
                             className="space-y-3"
                           >
                              {(msg.wellnessPlan[activePlanTabs[i] || 'diet'] || []).map((item, idx) => (
                                <div key={idx} className="flex items-start gap-3 group">
                                   <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 shrink-0 group-hover:scale-150 transition-all" />
                                   <p className="text-gray-700 dark:text-gray-300 text-xs md:text-sm leading-relaxed">{item}</p>
                                </div>
                              ))}
                           </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                 <Bot size={18} />
              </div>
              <div className="bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-2xl rounded-tl-none flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest ml-2">AI is thinking...</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Action Bar (Suggestions & Disclaimer) */}
        <div className="px-6 py-2 bg-black/5 dark:bg-black/20 border-t border-gray-200 dark:border-white/5">
           {messages.length === 1 && !loading && (
             <div className="flex flex-wrap gap-2 mb-3">
                {QUICK_SUGGESTIONS.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(s.value)}
                    className="px-4 py-2 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-cyan-500/20 hover:border-cyan-500/50 hover:text-cyan-500 dark:hover:text-cyan-400 transition-all font-semibold"
                  >
                    {s.label}
                  </button>
                ))}
             </div>
           )}
           <div className="flex items-center gap-2 opacity-60">
              <AlertCircle size={12} className="text-red-400" />
              <p className="text-[10px] font-medium text-red-100 uppercase tracking-tight">
                Disclaimer: AI provides general info only. Not a medical substitute.
              </p>
           </div>
        </div>

        {/* Input Area */}
        <div className="p-6 bg-gray-50/50 dark:bg-white/5 border-t border-gray-200 dark:border-white/5">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Describe your symptoms... (e.g. Sharp headache since morning)"
              className="w-full bg-gray-100/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-6 py-4 pr-16 text-sm md:text-base outline-none focus:border-cyan-500 dark:focus:border-cyan-400 focus:bg-white/[0.07] transition-all text-gray-900 dark:text-white placeholder:text-gray-500"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button 
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-xl flex items-center justify-center text-white hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-lg"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Background Decorative Elements */}
      <div className="fixed top-1/4 -right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="fixed bottom-1/4 -left-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] -z-10 animate-pulse [animation-delay:1s]" />
    </div>
  );
}
