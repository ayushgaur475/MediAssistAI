import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wind, Moon, Sun, Music, Volume2, ChevronLeft, Sparkles, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ZenZone() {
  const navigate = useNavigate();
  const [breathState, setBreathState] = useState("Inhale");
  const [timer, setTimer] = useState(0);
  const [vibe, setVibe] = useState("Midnight"); // Midnight, Sunset, Aurora
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef(null);

  // Lofi Audio Source (Royalty Free)
  const LOFI_URL = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3"; 

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.warn("Audio play blocked:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Breathing Cycle: 4s In, 4s Hold, 4s Out
  useEffect(() => {
    const cycle = setInterval(() => {
      setTimer(t => {
        const next = (t + 1) % 12;
        if (next < 4) setBreathState("Inhale");
        else if (next < 8) setBreathState("Hold");
        else setBreathState("Exhale");
        return next;
      });
    }, 1000);
    return () => clearInterval(cycle);
  }, []);

  const vibes = {
    Midnight: "from-gray-900 via-blue-900 to-black",
    Sunset: "from-orange-600 via-pink-600 to-purple-900",
    Aurora: "from-green-900 via-teal-900 to-black"
  };

  return (
    <div className={`min-h-[calc(100vh-96px)] w-screen overflow-hidden transition-all duration-[3000ms] ease-in-out bg-gradient-to-br ${vibes[vibe]} flex flex-col items-center justify-center font-['Outfit']`}>
      <audio ref={audioRef} src={LOFI_URL} loop />
      
      {/* Background Particles (Simulated with Blobs) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-400/10 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ x: [0, -100, 0], y: [0, -50, 0] }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]" 
        />
      </div>

      {/* Top Controls */}
      <div className="absolute top-10 left-10 right-10 flex justify-between items-center z-10">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-6 py-3 glass-card rounded-2xl text-white/70 hover:text-white transition-all hover:bg-white/10"
        >
          <ChevronLeft size={20} /> <span className="text-xs font-black uppercase tracking-widest">Exit Zen</span>
        </button>

        <div className="flex gap-3">
          {Object.keys(vibes).map(v => (
            <button 
              key={v}
              onClick={() => setVibe(v)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                vibe === v ? "bg-white text-black" : "glass-card text-white/50"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Main Breathing Circle */}
      <div className="relative flex flex-col items-center">
        <div className="text-center mb-12">
           <h1 className="text-4xl font-black text-white/90 tracking-tighter uppercase mb-2">Zen<span className="text-cyan-400">.Zone</span></h1>
           <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">AI Powered Mental Reset</p>
        </div>

        <div className="relative">
          {/* Outer Ring */}
          <motion.div 
            animate={{ 
              scale: breathState === "Inhale" ? 1.5 : breathState === "Exhale" ? 1 : 1.5,
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{ duration: 4, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full bg-cyan-400 blur-2xl"
          />

          {/* Core Circle */}
          <motion.div 
            animate={{ 
              scale: breathState === "Inhale" ? 1.4 : breathState === "Exhale" ? 1 : 1.4,
              borderWidth: breathState === "Hold" ? "8px" : "2px"
            }}
            transition={{ duration: 4, ease: "easeInOut" }}
            className="w-64 h-64 rounded-full border-2 border-white/20 glass-card flex flex-col items-center justify-center relative z-10 shadow-2xl backdrop-blur-3xl"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={breathState}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center"
              >
                <div className="text-cyan-400 mb-2">
                  {breathState === "Inhale" ? <Wind size={32} /> : breathState === "Hold" ? <Sparkles size={32} /> : <Heart size={32} />}
                </div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{breathState}</h2>
                <div className="mt-2 flex gap-1">
                   {[0,1,2,3].map(i => (
                     <div key={i} className={`w-1 h-1 rounded-full ${timer % 4 === i ? 'bg-cyan-400' : 'bg-white/10'}`} />
                   ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        <div className="mt-20 flex flex-col items-center gap-6">
           <p className="text-xs font-medium text-white/50 max-w-xs text-center leading-relaxed">
             Follow the visual cues to regulate your breathing. This simple exercise reduces cortisol levels and clears your mind.
           </p>
           
           <div className="flex items-center gap-8">
              <div className="flex flex-col items-center gap-2">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    isPlaying ? "bg-white text-black" : "glass-card text-white/50"
                  }`}
                >
                  <Music size={24} className={isPlaying ? "animate-spin-slow" : ""} />
                </button>
                <span className="text-[8px] font-black uppercase text-white/30 tracking-widest">Lo-fi Beats</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-3 glass-card px-4 py-3 rounded-2xl group">
                  <Volume2 size={24} className="text-white/50" />
                  <input 
                    type="range" 
                    min="0" max="1" step="0.01" 
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-24 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
                  />
                </div>
                <span className="text-[8px] font-black uppercase text-white/30 tracking-widest">Ambient Volume</span>
              </div>
           </div>
        </div>
      </div>

      {/* Interactive Bottom Accent */}
      <div className="absolute bottom-10 flex flex-col items-center gap-2 opacity-30">
         <Sparkles size={20} className="text-cyan-400 animate-pulse" />
         <span className="text-[9px] font-black uppercase text-white tracking-[0.5em]">Stress Free Zone</span>
      </div>
    </div>
  );
}
