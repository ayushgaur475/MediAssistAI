import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Stethoscope, FlaskConical, ArrowRight, Zap, ShieldCheck, Activity } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [cityValue, setCityValue] = useState("");

  const heroImage = "/futuristic_medical_hero_1774980674791.png"; // Use the generated asset

  return (
    <div className="min-h-screen transition-colors duration-300 selection:bg-cyan-500/30">

      {/* --- HERO SECTION --- */}
      <section className="relative h-[95vh] flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt=""
            className="w-full h-full object-cover opacity-60 dark:opacity-40 scale-105 transition-opacity duration-700"
          />
          {/* Dynamic Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/40 to-[var(--bg-main)] dark:from-[#030712]/10 dark:via-[#030712]/60 dark:to-[var(--bg-main)] transition-colors duration-700" />

          {/* Animated Glow Blobs */}
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] animate-pulse-slow" />
          <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-purple-500/20 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter">
              <span className="text-[var(--text-main)]">Medi.</span>
              <span className="text-neon">Assist</span>
            </h1>
            <p className="text-[var(--text-muted)] text-lg md:text-xl max-w-2xl mx-auto mb-10 font-medium">
              Next-gen healthcare navigation for the digital era. Search, navigate, and book in <span className="text-cyan-400 font-bold">one click</span>.
            </p>
          </motion.div>

          {/* Glassmorphic Search Bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="glass p-2 rounded-[2.5rem] max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-2 group shadow-2xl"
          >
            <div className="flex-1 flex items-center gap-3 px-6 py-4 border-r border-[var(--border-subtle)] w-full md:w-auto">
              <MapPin className="text-cyan-400" size={20} />
              <input
                type="text"
                placeholder="Where are you? (City)"
                className="bg-transparent border-none outline-none w-full text-lg font-medium placeholder:text-gray-500 text-[var(--text-main)]"
                value={cityValue}
                onChange={(e) => setCityValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && navigate(`/map?city=${cityValue}&speciality=${searchValue}`)}
              />
            </div>
            <div className="flex-[1.5] flex items-center gap-3 px-6 py-4 w-full md:w-auto">
              <Search className="text-purple-400" size={20} />
              <input
                type="text"
                placeholder="What's wrong? (Symptoms or Specialist)"
                className="bg-transparent border-none outline-none w-full text-lg font-medium placeholder:text-gray-500 text-[var(--text-main)]"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && navigate(`/map?city=${cityValue}&speciality=${searchValue}`)}
              />
            </div>
            <button
              onClick={() => navigate(`/map?city=${cityValue}&speciality=${searchValue}`)}
              className="btn-premium w-full md:w-auto"
            >
              Explore Now
            </button>
          </motion.div>

          {/* Quick Tags */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {['Cardiologist', 'Dentist', 'Neurologist', 'Radiology'].map((tag) => (
              <span key={tag} className="px-4 py-1.5 rounded-full border border-[var(--border-subtle)] text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest hover:border-cyan-500/50 hover:text-[var(--text-main)] cursor-pointer transition-all bg-[var(--bg-card)]">
                # {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* --- FEATURE BENTO GRID --- */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* LARGE CARD: FIND DOCTORS */}
          <motion.div
            whileHover={{ y: -10 }}
            onClick={() => navigate("/map?mode=doctor")}
            className="md:col-span-2 glass-card p-10 rounded-[2.5rem] relative overflow-hidden group cursor-pointer"
          >
            <div className="absolute top-0 right-0 p-12 text-cyan-500/10 group-hover:text-cyan-500/20 transition-all">
              <Stethoscope size={200} />
            </div>
            <div className="relative z-10">
              <span className="px-4 py-1 bg-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-6 inline-block">Verified Database</span>
              <h3 className="text-4xl font-black mb-4">Find Elite <br /> Doctors Near You</h3>
              <p className="text-[var(--text-muted)] max-w-md mb-8 font-medium">Direct booking with confirmed slots. No more waiting lines, just precision care.</p>
              <div className="flex items-center gap-2 text-cyan-400 font-bold group-hover:gap-4 transition-all uppercase text-xs tracking-widest">
                Start Search <ArrowRight size={16} />
              </div>
            </div>
          </motion.div>

          {/* SMALL CARD: LAB TESTS */}
          <motion.div
            whileHover={{ y: -10 }}
            className="glass-card p-10 rounded-[2.5rem] flex flex-col justify-between group cursor-pointer relative"
            onClick={() => navigate("/labs")}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400 font-bold">
                <FlaskConical size={32} />
              </div>
              <ArrowRight className="text-[var(--text-muted)] group-hover:text-purple-400 transition-all" size={24} />
            </div>

            <div>
              <h3 className="text-2xl font-black mb-2 uppercase">Lab Tests</h3>
              <p className="text-[var(--text-muted)] text-sm mb-6 font-medium">Find pathology labs in your city instantly.</p>

              {/* Inline Search Box */}
              <div
                className="relative mt-2"
                onClick={(e) => e.stopPropagation()} // Prevent card navigation when clicking input
              >
                <input
                  type="text"
                  placeholder="Enter City..."
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-purple-500 transition-all text-[var(--text-main)] placeholder:text-gray-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      navigate(`/labs?city=${e.target.value}`);
                    }
                  }}
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400/50" size={14} />
              </div>
            </div>
          </motion.div>



          {/* STATS CARD (Full Width) */}
          <div className="md:col-span-3 glass-card p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-2xl flex items-center justify-center text-cyan-400">
                <Zap className="fill-cyan-400" size={24} />
              </div>
              <div>
                <h4 className="text-xl font-bold text-[var(--text-main)]">Platform Status</h4>
                <p className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-widest">Live System Telemetry</p>
              </div>
            </div>

            <div className="flex flex-1 justify-around w-full md:w-auto gap-8">
              <div className="text-center md:text-left">
                <p className="text-4xl font-black text-[var(--text-main)]">12k+</p>
                <p className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-widest">Medical Entities</p>
              </div>
              <div className="w-px h-12 bg-[var(--border-subtle)] hidden md:block" />
              <div className="text-center md:text-left">
                <p className="text-4xl font-black text-[var(--text-main)]">0.5s</p>
                <p className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-widest">Query Latency</p>
              </div>
              <div className="w-px h-12 bg-[var(--border-subtle)] hidden md:block" />
              <div className="text-center md:text-left">
                <p className="text-4xl font-black text-[var(--text-main)]">99.9%</p>
                <p className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-widest">Uptime Score</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* --- WHY US / TRUST SECTION --- */}
      <section className="bg-[var(--bg-card)] py-20 px-6 border-y border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-12 grayscale opacity-50 contrast-125 dark:contrast-100 transition-all">
          <div className="flex items-center gap-3"><ShieldCheck size={28} /> <span className="font-black tracking-widest text-sm uppercase">Secure Data</span></div>
          <div className="flex items-center gap-3"><Activity size={28} /> <span className="font-black tracking-widest text-sm uppercase">Verified Only</span></div>
          <div className="flex items-center gap-3"><Zap size={28} /> <span className="font-black tracking-widest text-sm uppercase">Instant Results</span></div>
        </div>
      </section>

      {/* --- FOOTER TICKET --- */}
      <footer className="py-10 text-center text-[var(--text-muted)] text-[10px] font-black uppercase tracking-[0.5em]">
        © 2026 MediAsisstAI Corp
      </footer>
    </div>
  );
}