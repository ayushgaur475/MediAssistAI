import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, AlertTriangle, Wind, Heart, Home as HomeIcon, MessageSquare, MapPin, FlaskConical } from "lucide-react";

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

  const navLinks = [
    { name: "Home", path: "/", icon: <HomeIcon size={20} /> },
    { name: "AI Doctor", path: "/ai-doctor", icon: <MessageSquare size={20} /> },
    { name: "Map", path: "/map", icon: <MapPin size={20} /> },
    { name: "Lab Tests", path: "/lab-tests", icon: <FlaskConical size={20} /> }
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-[1000]">
        <div className="w-full glass p-4 px-8 flex justify-between items-center border-b border-white/10 shadow-sm backdrop-blur-md">
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

          {/* DESKTOP LINKS */}
          <div className="hidden md:flex bg-white/5 p-1 rounded-xl border border-white/5">
            {navLinks.map((item) => (
              <Link 
                key={item.name} 
                to={item.path}
                className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                  location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
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

            {/* COMPANION LOUNGE */}
            <Link 
              to="/companion-lounge"
              className="flex items-center gap-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-purple-500/20 transition-all group"
            >
              <Heart size={16} className="group-hover:scale-110 transition-transform" />
              <span className="hidden xs:inline">Companion Lounge</span>
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
          </div>
        </div>
      </nav>

      {/* MOBILE BOTTOM NAVIGATION (App-like feel) */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-[var(--bg-card)] border-t border-[var(--border-subtle)] pb-2 pt-2 px-2 flex justify-around items-center z-[1000] pb-safe shadow-[0_-5px_15px_rgba(0,0,0,0.1)]">
        {navLinks.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link 
              key={item.name} 
              to={item.path}
              className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all ${
                isActive ? "text-cyan-400 scale-105" : "text-gray-500 hover:text-cyan-400"
              }`}
            >
              <div className={`mb-1 transition-all ${isActive ? "glow-cyan" : ""}`}>
                {item.icon}
              </div>
              <span className="text-[8px] font-black uppercase tracking-wider text-center">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </>
  );
}
