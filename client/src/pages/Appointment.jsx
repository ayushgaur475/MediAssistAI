import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Clock, User, ChevronLeft } from "lucide-react";

export default function Appointment() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-96px)] flex items-center justify-center p-6 bg-[var(--bg-main)] font-['Outfit']">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass-card p-8 rounded-[2.5rem] relative overflow-hidden shadow-2xl"
      >
        {/* Glow Effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[50px] -mr-10 -mt-10" />
        
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[var(--text-muted)] hover:text-cyan-400 mb-8 transition-colors text-xs font-black uppercase tracking-widest"
        >
          <ChevronLeft size={16} /> Back
        </button>

        <h2 className="text-3xl font-black mb-2 tracking-tighter text-[var(--text-main)] uppercase">
          Book <span className="text-neon">Slot</span>
        </h2>
        <p className="text-[var(--text-muted)] text-sm mb-8 font-medium italic">Express booking for Hospital ID: {id}</p>
        
        <div className="space-y-4">
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400" size={18} />
            <input 
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm outline-none focus:border-cyan-400 transition-all text-white placeholder:text-gray-600" 
              placeholder="Your Full Name" 
            />
          </div>

          <div className="flex gap-4">
            <div className="relative flex-1 group">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" size={18} />
              <input 
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm outline-none focus:border-purple-400 transition-all text-white [color-scheme:dark]" 
                type="date" 
              />
            </div>
            <div className="relative flex-1 group">
              <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400" size={18} />
              <input 
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm outline-none focus:border-cyan-400 transition-all text-white [color-scheme:dark]" 
                type="time" 
              />
            </div>
          </div>

          <button className="w-full mt-6 bg-gradient-to-r from-cyan-400 to-purple-500 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-cyan-500/20">
            Confirm Booking
          </button>
        </div>

        <div className="mt-8 pt-8 border-t border-white/5 text-center">
          <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest">
            Powered by MediAsisst Smart Health Net
          </p>
        </div>
      </motion.div>
    </div>
  );
}
