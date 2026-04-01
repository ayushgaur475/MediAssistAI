import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, AlertTriangle, Wind } from "lucide-react";

export default function Navbar() {
  const location = useLocation();
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark" || 
           (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return (
    <nav className="fixed top-0 left-0 w-full z-[1000] px-6 py-4">
      <div className="max-w-7xl mx-auto glass p-4 px-8 rounded-2xl flex justify-between items-center border border-white/10 shadow-2xl">
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2 group">
          <motion.div 
            whileHover={{ rotate: 180 }}
            className="w-8 h-8 bg-gradient-to-tr from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center font-black text-white text-xs"
          >
            M+
          </motion.div>
          <span className="text-xl font-black tracking-tighter">
            <span className="dark:text-white text-gray-900">Medi.</span>
            <span className="text-neon">Assist</span>
          </span>
        </Link>

        {/* LINKS */}
        <div className="hidden md:flex bg-white/5 p-1 rounded-xl border border-white/5">
          {[
            { name: "Home", path: "/" },
            { name: "AI Doctor", path: "/ai-doctor" },
            { name: "Map", path: "/map" }
          ].map((item) => (
            <Link 
              key={item.name} 
              to={item.path}
              className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                location.pathname === item.path || (item.path.startsWith('/map') && location.pathname === '/map')
                ? "bg-white/10 text-cyan-400 shadow-inner" 
                : "text-gray-500 hover:text-cyan-400"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* ZEN ZONE */}
          <Link 
            to="/zen-zone"
            className="flex items-center gap-2 bg-cyan-400/10 hover:bg-cyan-400/20 text-cyan-400 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-cyan-400/20 transition-all group"
          >
            <Wind size={16} />
            <span className="hidden xs:inline">Zen Zone</span>
          </Link>

          {/* EMERGENCY SOS */}
          <Link 
            to="/map?mode=emergency"
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-500/20 transition-all group relative overflow-hidden"
          >
            <span className="absolute inset-0 bg-red-500/5 animate-pulse" />
            <AlertTriangle size={16} className="relative z-10" />
            <span className="relative z-10 hidden xs:inline">SOS Emergency</span>
          </Link>

          {/* THEME TOGGLE */}
          <button 
            onClick={() => setIsDark(!isDark)}
            className="p-2.5 rounded-xl glass-card text-gray-500 hover:text-cyan-400 transition-all active:scale-90"
            aria-label="Toggle Theme"
          >
            <AnimatePresence mode="wait">
              {isDark ? (
                <motion.div
                  key="moon"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                >
                  <Moon size={18} />
                </motion.div>
              ) : (
                <motion.div
                  key="sun"
                  initial={{ opacity: 0, rotate: 90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: -90 }}
                >
                   <Sun size={18} />
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          <Link 
            to="/map" 
            className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-cyan-400 to-purple-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
