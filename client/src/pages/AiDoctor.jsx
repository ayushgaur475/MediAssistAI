import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Sparkles, AlertCircle, ChevronLeft, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AiDoctor() {
  const [messages, setMessages] = useState([
    { 
      role: "assistant", 
      content: "Hello! I am your Medi.Assist AI Doctor. How are you feeling today? Tell me your symptoms, and I'll guide you." 
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/ai-doctor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input })
      });
      const data = await response.json();
      
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: data.reply,
        suggestion: data.suggestion // Optional specialist suggestion
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "I'm having trouble connecting to my medical database. Please check your connection." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-96px)] bg-[var(--bg-main)] p-4 md:p-8 font-['Outfit'] transition-colors duration-300">
      <div className="max-w-4xl mx-auto h-[80vh] flex flex-col glass-card rounded-[3rem] overflow-hidden shadow-2xl relative border border-white/5">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-gradient-to-tr from-cyan-400 to-purple-500 rounded-2xl flex items-center justify-center text-white shadow-lg animate-pulse-glow">
                <Bot size={28} />
             </div>
             <div>
                <h2 className="text-xl font-black uppercase tracking-tighter">AI <span className="text-neon">Doctor</span></h2>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                   <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Active Diagnosis Mode</span>
                </div>
             </div>
          </div>
          <button 
            onClick={() => navigate("/")}
            className="p-3 rounded-xl hover:bg-white/10 transition-all text-[var(--text-muted)]"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide"
        >
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[80%] flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  msg.role === "user" ? "bg-cyan-500/20 text-cyan-400" : "bg-purple-500/20 text-purple-400"
                }`}>
                  {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className="space-y-3">
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user" 
                    ? "bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/20 text-white rounded-tr-none" 
                    : "bg-white/5 border border-white/10 text-[var(--text-main)] rounded-tl-none"
                  }`}>
                    {msg.content}
                  </div>
                  
                  {/* Specialized Suggestion Card */}
                  {msg.suggestion && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="glass-card p-4 rounded-2xl border-l-4 border-cyan-400 flex items-center justify-between gap-4"
                    >
                      <div>
                        <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1">Recommended Specialist</p>
                        <p className="text-sm font-bold">{msg.suggestion}</p>
                      </div>
                      <button 
                        onClick={() => navigate(`/map?city=My Location&speciality=${msg.suggestion}`)}
                        className="bg-cyan-400 text-black p-2 rounded-xl hover:scale-110 transition-transform shadow-lg"
                      >
                        <MapPin size={16} />
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none flex gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>

        {/* Disclaimer Area */}
        <div className="px-6 py-2 bg-red-500/5 flex items-center gap-2">
           <AlertCircle size={12} className="text-red-500" />
           <p className="text-[9px] font-medium text-red-500/70 uppercase tracking-tighter">
             Medi.Assist AI is for guidance only. In case of serious chest pain or breathing issues, use the <b>SOS EMERGENCY</b> button immediately.
           </p>
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white/5 border-t border-white/5">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Describe your symptoms... (e.g. Sharp back pain since morning)"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 pr-16 text-sm outline-none focus:border-cyan-400 transition-all text-white placeholder:text-gray-500"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button 
              onClick={handleSend}
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-xl flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Background Blobs */}
      <div className="fixed top-1/4 -right-20 w-96 h-96 bg-purple-500/5 rounded-full blur-[100px] -z-10" />
      <div className="fixed bottom-1/4 -left-20 w-96 h-96 bg-cyan-500/5 rounded-full blur-[100px] -z-10" />
    </div>
  );
}
