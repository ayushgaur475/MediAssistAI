import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, 
  Coffee, 
  BatteryCharging, 
  Stethoscope, 
  ShieldCheck, 
  Sparkles, 
  Wind, 
  MessageCircle, 
  Clock, 
  ChevronRight,
  Bell,
  CheckCircle2
} from "lucide-react";

const STEPS = [
  { id: 1, label: "Registration", status: "completed", time: "10:15 AM" },
  { id: 2, label: "Vitals Check", status: "completed", time: "10:30 AM" },
  { id: 3, label: "Doctor Consultation", status: "active", time: "In Progress" },
  { id: 4, label: "Observation", status: "pending", time: "Estimated 11:45 AM" },
  { id: 5, label: "Discharge Ready", status: "pending", time: "TBD" }
];

const AMENITIES = [
  { icon: Coffee, title: "Cafeteria", desc: "Level 1, Block A", distance: "2 min walk" },
  { icon: BatteryCharging, title: "Power Station", desc: "Near Reception", distance: "1 min walk" },
  { icon: ShieldCheck, title: "Quiet Zone", desc: "Level 3, Library", distance: "3 min walk" },
  { icon: Stethoscope, title: "Pharmacy", desc: "Ground Floor", distance: "Nearby" }
];

const MESSAGES = [
  "Stay strong! We are all in this together. ❤️",
  "Sending prayers for a speedy recovery for everyone here.",
  "Don't forget to take a deep breath and hydrate yourself too.",
  "Trust the doctors, they are doing their best. You are a great companion!",
  "A little progress every day adds up to big results."
];

export default function CaretakerLounge() {
  const [activeTab, setActiveTab] = useState("tracking");
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathText, setBreathText] = useState("Inhale");
  const [notified, setNotified] = useState(false);

  // Simple Breathing logic for the Micro-Zen
  useEffect(() => {
    let interval;
    if (isBreathing) {
      interval = setInterval(() => {
        setBreathText(prev => prev === "Inhale" ? "Exhale" : "Inhale");
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isBreathing]);

  const handleRequestHelp = () => {
    setNotified(true);
    setTimeout(() => setNotified(false), 3000);
  };

  return (
    <div className="min-h-[calc(100vh-96px)] bg-[var(--bg-main)] p-4 md:p-8 font-['Outfit'] transition-colors duration-300 text-[var(--text-main)]">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">
              Companion <span className="text-neon">Lounge</span>
            </h1>
            <p className="text-[var(--text-muted)] font-medium max-w-lg">
              A dedicated space for caretakers. Stay updated on your loved one's journey while taking a moment for yourself.
            </p>
          </div>
          <button 
            onClick={handleRequestHelp}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-6 py-3 rounded-2xl border border-white/5 transition-all group overflow-hidden relative"
          >
            {notified ? (
              <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="flex items-center gap-2 text-green-400 font-bold uppercase text-xs">
                <CheckCircle2 size={18} /> Staff Notified
              </motion.div>
            ) : (
              <div className="flex items-center gap-2 group-hover:text-cyan-400 transition-colors">
                <Bell size={18} />
                <span className="text-xs font-black uppercase tracking-widest">Request Assistance</span>
              </div>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Tracking & Journey */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Patient Journey Card */}
            <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
               <div className="flex items-center gap-2 mb-8">
                  <div className="w-1.5 h-6 bg-cyan-400 rounded-full" />
                  <h2 className="text-xl font-black uppercase tracking-tighter">Live Journey Status</h2>
               </div>

               <div className="relative space-y-8">
                 {STEPS.map((step, i) => (
                   <div key={step.id} className="flex gap-6 relative">
                     {i !== STEPS.length - 1 && (
                       <div className={`absolute left-4 top-10 w-0.5 h-10 ${step.status === 'completed' ? 'bg-cyan-400' : 'bg-white/10'}`} />
                     )}
                     
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                       step.status === 'completed' ? 'bg-cyan-400 text-black shadow-[0_0_20px_rgba(34,211,238,0.4)]' :
                       step.status === 'active' ? 'bg-purple-500 animate-pulse-glow text-white' : 'bg-white/10 text-white/30'
                     }`}>
                       {step.status === 'completed' ? <CheckCircle2 size={16} /> : <span className="text-xs font-black">{step.id}</span>}
                     </div>

                     <div className="flex-1 flex justify-between items-center group">
                       <div>
                         <h3 className={`text-base font-bold ${step.status === 'pending' ? 'text-white/30' : 'text-white'}`}>{step.label}</h3>
                         <p className="text-xs text-[var(--text-muted)] font-medium mb-2">{step.status === 'active' ? 'Awaiting results from Lab A' : 'Stage verified by Duty Nurse'}</p>
                       </div>
                       <div className="flex flex-col items-end">
                          <span className={`text-[10px] font-black uppercase tracking-widest ${step.status === 'active' ? 'text-cyan-400' : 'text-[var(--text-muted)]'}`}>
                            {step.time}
                          </span>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>

               <div className="mt-10 p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center gap-4">
                  <div className="w-12 h-12 bg-cyan-400/10 rounded-2xl flex items-center justify-center text-cyan-400 shrink-0">
                    <Clock size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-tighter">Estimated Completion</p>
                    <p className="text-xs text-[var(--text-muted)]">Approximately 1 hour 20 minutes remaining</p>
                  </div>
               </div>
            </div>

            {/* Engagement Grid Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Health Trivia Card */}
                <div className="glass-card p-6 rounded-[2rem] border border-white/5 hover:border-cyan-400/20 transition-all group">
                   <div className="flex justify-between items-start mb-6">
                      <div className="p-3 bg-cyan-400/10 rounded-2xl text-cyan-400">
                        <Sparkles size={24} />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400 px-3 py-1 bg-cyan-400/10 rounded-full">New Daily Quiz</span>
                   </div>
                   <h3 className="text-lg font-black uppercase tracking-tighter mb-2">Health Mastery</h3>
                   <p className="text-xs text-[var(--text-muted)] font-medium mb-6">Test your knowledge while you wait and earn wellness points.</p>
                   <button className="w-full py-3 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">Start Quiz</button>
                </div>

                {/* Healing Wall Card */}
                <div className="glass-card p-6 rounded-[2rem] border border-white/5 hover:border-purple-400/20 transition-all group overflow-hidden">
                   <div className="flex justify-between items-start mb-6">
                      <div className="p-3 bg-purple-400/10 rounded-2xl text-purple-400">
                        <MessageCircle size={24} />
                      </div>
                   </div>
                   <h3 className="text-lg font-black uppercase tracking-tighter mb-4">Healing Wall</h3>
                   <div className="h-16 overflow-hidden relative">
                      <motion.div 
                        animate={{ y: [0, -80] }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="space-y-4"
                      >
                         {MESSAGES.map((m, i) => (
                           <div key={i} className="text-[10px] font-medium text-[var(--text-muted)] bg-white/5 p-3 rounded-xl border border-white/5">
                             {m}
                           </div>
                         ))}
                      </motion.div>
                   </div>
                   <button className="w-full mt-4 py-3 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-black uppercase tracking-widest transition-all">Leave a Message</button>
                </div>

            </div>
          </div>

          {/* Right Column: Wellness & Utilities */}
          <div className="space-y-8">
            
            {/* Micro-Zen Module */}
            <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-white/5 to-transparent flex flex-col items-center">
               <div className="flex flex-col items-center mb-8">
                  <div className="p-4 bg-cyan-400/10 rounded-full text-cyan-400 mb-4 animate-pulse">
                    <Wind size={32} />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tighter">Micro Wellness</h3>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1">Stress Regulation</p>
               </div>

               <div className="relative w-48 h-48 flex items-center justify-center mb-8">
                  <motion.div 
                    animate={{ 
                      scale: isBreathing ? (breathText === "Inhale" ? 1.4 : 1) : 1,
                      opacity: isBreathing ? [0.2, 0.5, 0.2] : 0.2
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 bg-cyan-400 rounded-full blur-3xl"
                  />
                  <div className="relative z-10 text-center">
                     <AnimatePresence mode="wait">
                       <motion.span 
                         key={breathText}
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, y: -10 }}
                         className="text-2xl font-black uppercase tracking-tighter block"
                       >
                         {isBreathing ? breathText : "Ready?"}
                       </motion.span>
                     </AnimatePresence>
                  </div>
               </div>

               <button 
                 onClick={() => setIsBreathing(!isBreathing)}
                 className={`w-full py-4 rounded-3xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl ${
                   isBreathing ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-cyan-400 text-black hover:scale-105'
                 }`}
               >
                 {isBreathing ? "Stop Practice" : "Start 1-Min Reset"}
               </button>
            </div>

            {/* Amenities Grid */}
            <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 h-fit">
               <div className="flex items-center gap-2 mb-8">
                  <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
                  <h2 className="text-xl font-black uppercase tracking-tighter">Hospital Guide</h2>
               </div>

               <div className="grid grid-cols-1 gap-4">
                  {AMENITIES.map((amenity, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/5 group">
                       <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-[var(--text-muted)] group-hover:text-purple-400 transition-colors">
                         <amenity.icon size={24} />
                       </div>
                       <div className="flex-1">
                          <h4 className="text-sm font-bold uppercase tracking-tight">{amenity.title}</h4>
                          <p className="text-[10px] text-[var(--text-muted)] font-medium">{amenity.desc}</p>
                       </div>
                       <span className="text-[8px] font-black uppercase tracking-widest text-purple-400/50">{amenity.distance}</span>
                    </div>
                  ))}
               </div>
               
               <button className="w-full mt-6 py-4 bg-white/5 hover:bg-white/10 rounded-2xl flex justify-center items-center gap-2 text-[10px] font-black uppercase tracking-widest group transition-all border border-white/5">
                  Interactive Floor Map <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
               </button>
            </div>

          </div>

        </div>

      </div>
      
      {/* Background Subtle Blobs */}
      <div className="fixed top-1/2 -left-32 w-96 h-96 bg-cyan-400/5 rounded-full blur-[120px] -z-10" />
      <div className="fixed -bottom-32 -right-32 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] -z-10" />
    </div>
  );
}
