import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Search, Loader2, Navigation, X } from "lucide-react";

export default function SearchBar({
  city,
  setCity,
  speciality,
  setSpeciality,
  handleSearch,
  onLocationDetected, // called with (detectedCity, lat, lon) — lat/lon are the exact GPS coords
  // Optional autocomplete
  citySuggestions = [],
  onCityChange,
  specSuggestions = [],
  onSpecChange,
}) {
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");
  const [cityFocused, setCityFocused] = useState(false);
  const [specFocused, setSpecFocused] = useState(false);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocError("Geolocation not supported by your browser.");
      return;
    }

    setLocating(true);
    setLocError("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "User-Agent": "MediAsisstAI-App" } }
          );
          const data = await res.json();
          const detected =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            "Nearby";
          setCity(detected);
          if (onCityChange) onCityChange(detected);
          // Pass city name AND exact GPS coordinates to parent
          if (onLocationDetected) onLocationDetected(detected, latitude, longitude);
          else handleSearch();
        } catch {
          setLocError("Unable to detect location.");
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) {
          setLocError("Location access denied.");
        } else {
          setLocError("Unable to detect location.");
        }
      },
      { timeout: 10000 }
    );
  };

  const handleCityInput = (v) => {
    setCity(v);
    if (onCityChange) onCityChange(v);
  };

  const handleSpecInput = (v) => {
    setSpeciality(v);
    if (onSpecChange) onSpecChange(v);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

    <div className="w-full">
      {/* SearchBar Container */}
      <div className="flex flex-col md:flex-row gap-2.5 md:gap-3 w-full items-stretch md:items-center">
        
        {/* Row 1: Inputs (Always side-by-side) */}
        <div className="flex flex-row gap-2 md:gap-3 flex-1 min-w-0">
          {/* City Input */}
          <div className="relative flex-1 min-w-0">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
              <MapPin size={14} className="md:w-4 md:h-4" />
            </div>
            <input
              type="text"
              placeholder="City..."
              value={city}
              onChange={(e) => handleCityInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setCityFocused(true)}
              onBlur={() => setTimeout(() => setCityFocused(false), 150)}
              className="w-full pl-8 md:pl-9 pr-3 py-3 rounded-xl md:rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[13px] md:text-sm font-medium text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all backdrop-blur-sm"
            />
            {/* City Suggestions */}
            <AnimatePresence>
              {cityFocused && citySuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 w-full mt-1.5 z-50 glass rounded-xl overflow-hidden shadow-2xl border border-[var(--glass-border)]"
                >
                  {citySuggestions.map((s) => (
                    <div
                      key={s}
                      onMouseDown={() => { setCity(s); if (onCityChange) onCityChange(s); setCityFocused(false); }}
                      className="flex items-center gap-2 px-4 py-3 hover:bg-cyan-400/10 cursor-pointer text-sm font-semibold text-[var(--text-main)] transition-colors"
                    >
                      <MapPin size={13} className="text-cyan-400 shrink-0" />
                      {s}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Speciality Input */}
          <div className="relative flex-1 min-w-0">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
              <Search size={14} className="md:w-4 md:h-4" />
            </div>
            <input
              type="text"
              placeholder="Speciality..."
              value={speciality}
              onChange={(e) => handleSpecInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setSpecFocused(true)}
              onBlur={() => setTimeout(() => setSpecFocused(false), 150)}
              className="w-full pl-8 md:pl-9 pr-3 py-3 rounded-xl md:rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[13px] md:text-sm font-medium text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/30 transition-all backdrop-blur-sm"
            />
            {/* Speciality Suggestions */}
            <AnimatePresence>
              {specFocused && specSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 w-full mt-1.5 z-50 glass rounded-xl overflow-hidden shadow-2xl border border-[var(--glass-border)]"
                >
                  {specSuggestions.map((s) => (
                    <div
                      key={s}
                      onMouseDown={() => { setSpeciality(s); if (onSpecChange) onSpecChange(s); setSpecFocused(false); }}
                      className="flex items-center gap-2 px-4 py-3 hover:bg-purple-400/10 cursor-pointer text-sm font-semibold text-[var(--text-main)] transition-colors"
                    >
                      <span className="text-purple-400 text-xs"></span>
                      {s}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Buttons Group (Col on Mobile, Row on Desktop) */}
        <div className="flex flex-col md:flex-row gap-2 md:gap-3 shrink-0">
          {/* Use My Location Button */}
          <button
            onClick={handleUseMyLocation}
            disabled={locating}
            title="Use GPS to detect your city"
            className="flex items-center justify-center gap-2 px-6 md:px-4 py-3 md:py-3.5 rounded-xl md:rounded-2xl font-bold text-[11px] md:text-xs uppercase tracking-widest bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-muted)] hover:text-cyan-400 hover:border-cyan-400/40 hover:bg-cyan-400/5 disabled:opacity-60 disabled:cursor-not-allowed transition-all backdrop-blur-sm whitespace-nowrap shrink-0 w-full md:w-auto"
          >
            {locating ? (
              <Loader2 size={16} className="animate-spin text-cyan-400" />
            ) : (
              <Navigation size={16} className="text-cyan-400" />
            )}
            <span>
              {locating ? "Detecting..." : "Use My Location"}
            </span>
          </button>

          {/* Apply Search Button */}
          <motion.button
            onClick={handleSearch}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 px-8 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black text-[11px] md:text-xs uppercase tracking-widest bg-gradient-to-r from-cyan-400 to-purple-500 text-white shadow-xl hover:shadow-cyan-400/25 transition-all shrink-0 w-full md:w-auto"
          >
            <Search size={15} />
            <span>Apply Search</span>
          </motion.button>
        </div>
      </div>

      {/* Location Error */}
      <AnimatePresence>
        {locError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold"
          >
            <span>⚠ {locError}</span>
            <button onClick={() => setLocError("")} className="hover:text-red-300 transition-colors">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
