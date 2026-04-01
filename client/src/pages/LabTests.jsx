import React, { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useSearchParams } from "react-router-dom";
import { Search, MapPin, Activity, FlaskConical, Navigation } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Handle Map Animations & Bounds
function MapController({ labs, cityPos }) {
  const map = useMap();
  useEffect(() => {
    if (labs.length > 0) {
      const bounds = L.latLngBounds(labs.map(l => [l.lat, l.lon]));
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    } else if (cityPos) {
      map.flyTo(cityPos, 13, { animate: true });
    }
  }, [labs, cityPos, map]);
  return null;
}

export default function LabTests() {
  const [searchParams] = useSearchParams();
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cityPos, setCityPos] = useState([20.5937, 78.9629]); // Default India Center
  const [hoveredId, setHoveredId] = useState(null);

  const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || "API_KEY";

  const searchLabs = useCallback(async (cityOverride) => {
    const targetCity = cityOverride || city;
    if (!targetCity.trim()) return;
    setLoading(true);
    setLabs([]);

    try {
      // 1. Get City Coordinates
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(targetCity)}&countrycodes=in&limit=1`);
      const geoData = await geoRes.json();

      if (geoData.length === 0) {
        if (!cityOverride) alert("City not found. Please try again.");
        setLoading(false);
        return;
      }

      const { lat, lon } = geoData[0];
      const newPos = [parseFloat(lat), parseFloat(lon)];
      setCityPos(newPos);

      // 2. Query Overpass for Pathology/Labs - Optimized Radius Search (10km)
      const overpassQuery = `
        [out:json][timeout:25];
        (
          node["amenity"="laboratory"](around:10000,${lat},${lon});
          node["healthcare"="laboratory"](around:10000,${lat},${lon});
          node["healthcare:speciality"~"pathology|diagnostic"](around:10000,${lat},${lon});
          way["amenity"="laboratory"](around:10000,${lat},${lon});
          way["healthcare"="laboratory"](around:10000,${lat},${lon});
        );
        out center;
      `;

      const mirrors = [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
        "https://overpass.osm.ch/api/interpreter"
      ];

      let labData = null;
      let lastError = null;

      // --- Stage 1: Try Overpass Mirrors ---
      for (const mirror of mirrors) {
        try {
          const res = await fetch(mirror, {
            method: "POST",
            body: overpassQuery,
            signal: AbortSignal.timeout(12000) // 12s timeout per mirror
          });
          
          if (res.status === 403 || res.status === 429) {
             console.warn(`Mirror ${mirror} restricted: ${res.status}`);
             continue; 
          }
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          
          const text = await res.text();
          try {
            const parsed = JSON.parse(text);
            if (parsed && parsed.elements && parsed.elements.length > 0) {
              labData = parsed;
              break; 
            }
          } catch (e) {
            throw new Error("Invalid JSON");
          }
        } catch (err) {
          console.warn(`Mirror ${mirror} failed:`, err.message);
          lastError = err;
        }
      }

      // --- Stage 2: Nominatim Fallback (If Overpass Fails) ---
      if (!labData || labData.elements.length === 0) {
        console.log("Overpass failed or empty. Falling back to Nominatim Search...");
        try {
          const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=pathology+lab+in+${encodeURIComponent(targetCity)}&countrycodes=in&limit=20`;
          const nomRes = await fetch(nomUrl, { headers: { 'User-Agent': 'MediAsisstAI-App' } });
          const nomData = await nomRes.json();
          
          if (nomData && nomData.length > 0) {
            const formatted = nomData.map(item => ({
              id: item.place_id,
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon),
              name: item.display_name.split(',')[0],
              address: item.display_name,
              type: "Diagnostic Center (Search Result)"
            }));
            setLabs(formatted);
            setLoading(false);
            return; // Success via Nominatim
          }
        } catch (nomErr) {
          console.error("Nominatim Fallback failed:", nomErr);
        }
      }

      if (!labData || !labData.elements) {
        throw new Error("Unable to reach OpenStreetMap servers. Please try again in a moment.");
      }

      const formatted = labData.elements.map((el, i) => ({
        id: el.id,
        lat: el.center ? el.center.lat : el.lat,
        lon: el.center ? el.center.lon : el.lon,
        name: el.tags?.name || `Diagnostic Center ${i + 1}`,
        address: el.tags?.["addr:full"] || el.tags?.["addr:street"] || "Address not listed",
        type: el.tags?.["healthcare:speciality"] || "Pathology Lab"
      }));

      setLabs(formatted);
    } catch (err) {
      console.error(err);
      if (!cityOverride) alert(err.message || "Error finding labs. High traffic on OpenStreetMap servers.");
    } finally {
      setLoading(false);
    }
  }, [city]);

  useEffect(() => {
    const cityParam = searchParams.get("city");
    if (cityParam) {
      setCity(cityParam);
      searchLabs(cityParam);
    }
  }, [searchParams, searchLabs]);

  const labIcon = L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-96px)] w-full overflow-hidden bg-[var(--bg-main)] font-['Outfit'] transition-colors duration-300 text-[var(--text-main)]">
      
      {/* SIDEBAR */}
      <div className="w-full md:w-[30%] min-w-[320px] max-w-[400px] flex flex-col bg-[var(--bg-main)] z-10 overflow-hidden border-r border-[var(--border-subtle)]">
        <div className="p-6 bg-[var(--bg-card)] border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 shadow-lg">
              <FlaskConical size={24} />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tighter"><span className="text-neon">Medi.</span>Labs</h2>
          </div>

          <div className="space-y-4">
            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-2 px-1">Location Search</p>
            <div className="relative group">
               <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400 transition-transform group-focus-within:scale-110" size={18} />
               <input 
                  type="text" 
                  placeholder="Enter City or Area" 
                  className="w-full pl-12 pr-4 py-4 glass-card bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl text-sm outline-none focus:border-purple-400 text-[var(--text-main)] transition-all font-bold placeholder:text-gray-500 placeholder:font-medium"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchLabs()}
               />
            </div>
            <button 
              onClick={() => searchLabs()} 
              disabled={loading}
              className="w-full py-4 rounded-2xl font-black text-white bg-gradient-to-r from-purple-500 to-indigo-600 shadow-xl hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-xs disabled:opacity-50"
            >
              {loading ? "Scanning Area..." : "Find Pathology Labs"}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {labs.length > 0 ? (
              labs.map((lab, idx) => (
                <motion.div
                  key={lab.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer glass-card ${hoveredId === lab.id ? 'border-purple-500 bg-white/5' : 'border-[var(--border-subtle)] bg-[var(--bg-card)]'}`}
                  onMouseEnter={() => setHoveredId(lab.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div className="flex justify-between items-start gap-3">
                    <h3 className="font-bold text-[var(--text-main)] text-sm leading-tight tracking-tight">{lab.name}</h3>
                    <span className="bg-purple-500/10 text-purple-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-purple-500/20">Certified</span>
                  </div>
                  <p className="text-[var(--text-muted)] text-[11px] mt-2 line-clamp-2 leading-relaxed font-medium">{lab.address}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-purple-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                       <Activity size={12} /> {lab.type}
                    </span>
                    <button className="p-2 glass-card rounded-lg text-cyan-400 hover:bg-white/10 transition-colors">
                      <Navigation size={14} />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : !loading && (
              <div className="flex flex-col items-center justify-center mt-20 opacity-20 text-center px-10">
                <FlaskConical size={60}/>
                <p className="mt-4 font-black uppercase text-[10px] tracking-[0.3em]">Enter city to find pathology labs</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* MAP AREA */}
      <div className="flex-1 p-4 bg-[var(--bg-main)] flex flex-col">
        <div className="flex-1 relative rounded-[3rem] overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.1)] border-[10px] border-[var(--bg-card)] ring-1 ring-[var(--border-subtle)]">
          <MapContainer center={cityPos} zoom={13} className="h-full w-full" zoomControl={false}>
            <TileLayer url={`https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`} attribution='&copy; MapTiler' />
            <MapController labs={labs} cityPos={cityPos} />
            
            {labs.map(lab => (
              <Marker key={lab.id} position={[lab.lat, lab.lon]} icon={labIcon}>
                <Popup>
                  <div className="p-2 bg-[var(--bg-main)] text-[var(--text-main)] font-['Outfit']">
                    <h4 className="font-black text-purple-400 text-xs uppercase mb-1">{lab.name}</h4>
                    <p className="text-[10px] text-[var(--text-muted)] leading-tight">{lab.address}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Map Overlay Stats */}
          {labs.length > 0 && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 glass px-8 py-3 rounded-2xl flex items-center gap-6 border border-white/10 z-[1000] shadow-2xl animate-floating">
              <div className="text-center">
                 <p className="text-lg font-black text-purple-400">{labs.length}</p>
                 <p className="text-[8px] text-[var(--text-muted)] uppercase font-black">Labs Found</p>
              </div>
              <div className="w-[1px] h-8 bg-white/5" />
              <div className="text-center">
                 <p className="text-lg font-black text-cyan-400">24h</p>
                 <p className="text-[8px] text-[var(--text-muted)] uppercase font-black">Reporting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}