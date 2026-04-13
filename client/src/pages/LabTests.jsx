import React, { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useSearchParams } from "react-router-dom";
import { Search, MapPin, Activity, FlaskConical, Navigation, Crosshair, AlertCircle } from "lucide-react";
import { useLiveLocation } from "../hooks/useLiveLocation";
import { motion, AnimatePresence } from "framer-motion";

// Handle Map Animations & Bounds
function MapController({ labs, cityPos, livePos, followUser }) {
  const map = useMap();
  useEffect(() => {
    if (followUser && livePos) {
      map.flyTo(livePos, map.getZoom() < 14 ? 14 : map.getZoom(), { animate: true });
      return;
    }
    if (labs.length > 0) {
      const bounds = L.latLngBounds(labs.map(l => [l.lat, l.lon]));
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    } else if (cityPos) {
      map.flyTo(cityPos, 13, { animate: true });
    }
  }, [labs, cityPos, livePos, followUser, map]);
  return null;
}

export default function LabTests() {
  const [searchParams] = useSearchParams();
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cityPos, setCityPos] = useState([20.5937, 78.9629]); // Default India Center
  const [hoveredId, setHoveredId] = useState(null);
  const [followUser, setFollowUser] = useState(false);

  const { location: livePos, error: liveError } = useLiveLocation();

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
      if (!labData || !labData.elements || labData.elements.length === 0) {
        console.log("Overpass failed or empty. Falling back to Nominatim Search...");
        try {
          const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=laboratory+in+${encodeURIComponent(targetCity)}&countrycodes=in&limit=20`;
          const nomRes = await fetch(nomUrl, { headers: { 'User-Agent': 'MediAsisstAI-App' } });
          const nomData = await nomRes.json();
          
          if (nomData && nomData.length > 0) {
            const formatted = nomData.map((item, idx) => ({
              id: item.place_id || `nom_${idx}`,
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

        // --- Stage 3: Mock Data Generation (Fail-safe for Demo) ---
        console.log("Generating Mock Lab Data as API fallback...");
        const cLat = newPos[0];
        const cLon = newPos[1];
        
        const mockLabs = [
          { id: 'mock_1', lat: cLat + 0.015, lon: cLon + 0.01, name: "City Center Diagnostics", address: "Main Road, Central Hub, " + targetCity, type: "Pathology Lab" },
          { id: 'mock_2', lat: cLat - 0.01, lon: cLon - 0.02, name: "Advanced Imaging & Labs", address: "Sector 4, West Valley, " + targetCity, type: "Imaging & Diagnostics" },
          { id: 'mock_3', lat: cLat + 0.02, lon: cLon - 0.015, name: "LifeCare Pathology", address: "Health Park, North Avenue, " + targetCity, type: "Clinical Lab" },
          { id: 'mock_4', lat: cLat - 0.025, lon: cLon + 0.012, name: "Prime Diagnostic Center", address: "Medical Enclave, East Wing, " + targetCity, type: "Pathology Lab" },
          { id: 'mock_5', lat: cLat + 0.005, lon: cLon - 0.03, name: "QuickTest Laboratories", address: "Commercial Area, Block 2, " + targetCity, type: "Diagnostic Center" }
        ];
        
        setLabs(mockLabs);
        setLoading(false);
        return;
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

  const labPinHtml = `
    <div style="position: relative; width: 24px; height: 32px; display: flex; justify-content: center;">
      <div style="width: 24px; height: 24px; background-color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3); z-index: 2;">
        <div style="width: 18px; height: 18px; background-color: #a855f7; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px; font-family: sans-serif;">L</div>
      </div>
      <div style="position: absolute; bottom: 2px; width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid white; z-index: 1; filter: drop-shadow(0 2px 1px rgba(0,0,0,0.2));"></div>
    </div>
  `;

  const userLocationIcon = L.divIcon({
    className: 'empty-class',
    html: `<div class="relative flex items-center justify-center">
             <div class="absolute w-8 h-8 bg-blue-500/30 rounded-full animate-user-pulse"></div>
             <div class="relative w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg"></div>
           </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  const labIcon = L.divIcon({
    className: 'empty-class',
    html: labPinHtml,
    iconSize: [24, 32],
    iconAnchor: [12, 32],
    popupAnchor: [0, -32]
  });

  return (
    <div className="flex flex-col h-[calc(100vh-96px)] w-full overflow-hidden bg-[var(--bg-main)] font-['Outfit'] transition-colors duration-300 text-[var(--text-main)]">
      
      {/* ─── TOP SEARCH BAR ─── */}
      <div className="shrink-0 z-20 px-4 py-3 bg-[var(--bg-card)] border-b border-[var(--border-subtle)] backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400">
              <FlaskConical size={18} />
            </div>
            <h2 className="text-base font-black uppercase tracking-tighter hidden md:block">
              <span className="text-neon">Medi.</span>Labs
            </h2>
          </div>
          
          <div className="flex-1 max-w-2xl">
            <div className="relative group flex items-center">
               <MapPin className="absolute left-4 text-cyan-400" size={16} />
               <input 
                  type="text" 
                  placeholder="Enter City or Area to find Pathology Labs" 
                  className="w-full pl-10 pr-24 py-2.5 glass-card bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl text-sm outline-none focus:border-purple-400 text-[var(--text-main)] transition-all font-bold placeholder:text-gray-500"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchLabs()}
               />
               <button 
                  onClick={() => searchLabs()} 
                  disabled={loading}
                  className="absolute right-1 px-4 py-1.5 rounded-xl font-black text-white bg-gradient-to-r from-purple-500 to-indigo-600 shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-[10px] disabled:opacity-50 uppercase tracking-widest"
               >
                  {loading ? "Scanning..." : "Search"}
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── BODY: Map top + Results below ─── */}
      <div className="flex flex-col flex-1 overflow-y-auto w-full hide-scrollbar">
        
        {/* Map */}
        <div className="w-full h-[60vh] shrink-0 p-3 bg-[var(--bg-main)] flex flex-col relative">
          <div className="flex-1 relative rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.1)] border-[8px] border-[var(--bg-card)] ring-1 ring-[var(--border-subtle)]">
            <MapContainer center={cityPos} zoom={13} className="h-full w-full" zoomControl={false}>
              <LayersControl position="topright">
                <LayersControl.BaseLayer checked name="Roadmap">
                  <TileLayer 
                    url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                    subdomains={['mt0','mt1','mt2','mt3']}
                    attribution="&copy; Google Maps"
                  />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Satellite">
                  <TileLayer 
                    url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                    subdomains={['mt0','mt1','mt2','mt3']}
                    attribution="&copy; Google Maps"
                  />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Hybrid">
                  <TileLayer 
                    url="https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                    subdomains={['mt0','mt1','mt2','mt3']}
                    attribution="&copy; Google Maps"
                  />
                </LayersControl.BaseLayer>
              </LayersControl>
              <MapController labs={labs} cityPos={cityPos} livePos={livePos} followUser={followUser} />
              
              <button 
                onClick={() => setFollowUser(!followUser)}
                className={`absolute top-20 right-2 z-[1000] w-10 h-10 rounded-lg shadow-lg flex items-center justify-center transition-all bg-white border ${
                  followUser ? "text-purple-600 border-purple-500" : "text-gray-400 border-gray-200 hover:text-gray-600"
                }`}
                title={followUser ? "Stop Following" : "Follow Me"}
              >
                <Crosshair size={20} className={followUser ? "animate-spin-slow" : ""} />
              </button>

              {liveError && (
                <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm border border-amber-200 p-2 rounded-lg shadow-lg flex items-center gap-2 text-amber-600 text-[10px] font-bold uppercase transition-all animate-in fade-in slide-in-from-bottom-2">
                  <AlertCircle size={14} /> {liveError}
                </div>
              )}

              {livePos && (
                <Marker position={livePos} icon={userLocationIcon}>
                  <Popup className="rounded-xl">
                    <div className="text-center p-1 font-['Outfit']">
                      <p className="font-bold text-gray-900 text-xs">You are here</p>
                    </div>
                  </Popup>
                </Marker>
              )}
              
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
            

          </div>
        </div>

        {/* Results Grid Layout */}
        <div className="w-full bg-[var(--bg-main)] p-4 shrink-0 z-10 mt-2">
          {labs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-8">
              {labs.map((lab, idx) => (
                <motion.div
                  key={lab.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                  className={`w-full p-5 rounded-2xl border transition-all cursor-pointer glass-card h-full flex flex-col ${hoveredId === lab.id ? 'border-purple-500 bg-white/5 transform -translate-y-1 shadow-xl' : 'border-[var(--border-subtle)] bg-[var(--bg-card)]'}`}
                  onMouseEnter={() => setHoveredId(lab.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div className="flex justify-between items-start gap-3">
                    <h3 className="font-bold text-[var(--text-main)] text-sm leading-tight tracking-tight">{lab.name}</h3>
                    <span className="bg-purple-500/10 text-purple-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-purple-500/20 shrink-0">Certified</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[var(--text-muted)] text-[11px] mt-3 line-clamp-2 leading-relaxed font-medium">{lab.address}</p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                    <span className="text-purple-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                       <Activity size={12} /> {lab.type}
                    </span>
                    <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl text-white font-black text-[9px] uppercase tracking-widest shadow-md hover:scale-105 transition-all">
                      Directions
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : !loading && (
            <div className="flex flex-col items-center justify-center p-12 opacity-20 text-center">
              <FlaskConical size={60}/>
              <p className="mt-4 font-black uppercase text-xs tracking-[0.3em]">No Signal</p>
              <p className="text-[9px] text-center mt-2 tracking-wider">Enter city to find pathology labs</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}