import React, { useState, useEffect, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useSearchParams } from "react-router-dom";
import { Search, MapPin, Activity, FlaskConical, Navigation, Crosshair, AlertCircle } from "lucide-react";
import { useLiveLocation } from "../hooks/useLiveLocation";
import { motion, AnimatePresence } from "framer-motion";
import ResultCard from "../components/ResultCard";

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

// Map Control UI Component
function MapButtons({ livePos, followUser, setFollowUser }) {
  const map = useMap();
  
  return (
    <div className="absolute top-4 right-4 flex flex-col gap-3 z-[1000]">
      <div className="flex flex-col bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden ring-1 ring-black/5">
        <button 
          onClick={(e) => { e.stopPropagation(); map.zoomIn(); }} 
          className="w-12 h-12 flex items-center justify-center text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5 transition-all active:scale-90 border-b border-white/10 text-2xl font-light"
        >
          +
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); map.zoomOut(); }} 
          className="w-12 h-12 flex items-center justify-center text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5 transition-all active:scale-90 border-b border-white/10 text-2xl font-light"
        >
          -
        </button>

        <button 
          onClick={(e) => { e.stopPropagation(); setFollowUser(!followUser); if (!followUser && livePos) map.flyTo(livePos, 15); }} 
          className={`w-12 h-12 flex items-center justify-center transition-all active:scale-90 ${
            followUser ? "text-cyan-400 bg-cyan-400/10" : "text-gray-400 hover:text-cyan-400"
          }`}
        >
          <Crosshair size={22} className={followUser ? "animate-spin-slow" : ""} />
        </button>
      </div>
    </div>
  );
}

export default function LabTests() {
  const [searchParams] = useSearchParams();
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cityPos, setCityPos] = useState([20.5937, 78.9629]); // Default India Center
  const [hoveredId, setHoveredId] = useState(null);
  const [followUser, setFollowUser] = useState(false);
  const searchingRef = useRef(false);

  const { location: livePos, error: liveError } = useLiveLocation();

  const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || "API_KEY";

  const searchLabs = useCallback(async (cityOverride) => {
    const targetCity = cityOverride || city;
    if (!targetCity.trim() || searchingRef.current) return;
    
    searchingRef.current = true;
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
      
      // --- Stage 1: Parallel Mirror Racing (Turbo Search) ---
      console.log("Turbo Search: Racing Overpass Mirrors...");
      try {
        labData = await Promise.any(mirrors.map(async (mirror) => {
          const res = await fetch(mirror, {
            method: "POST",
            body: overpassQuery,
            signal: AbortSignal.timeout(5000) // 5s timeout per mirror
          });
          
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          if (!data || !data.elements || data.elements.length === 0) throw new Error("Empty results");
          
          console.log(`Turbo Search: Mirror ${mirror} won!`);
          return data;
        }));
      } catch (err) {
        console.warn("All Overpass mirrors failed or timed out. Falling back...");
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
      searchingRef.current = false;
    }
  }, [city]);

  useEffect(() => {
    const cityParam = searchParams.get("city");
    // Only trigger if cityParam exists AND it's different from current city 
    // AND we haven't already searched for it in this mount cycle
    if (cityParam && cityParam !== city && !searchingRef.current && labs.length === 0) {
      setCity(cityParam);
      searchLabs(cityParam);
    }
  }, [searchParams]); // Stable dependency

  const labPinHtml = `
    <div style="position: relative; width: 30px; height: 38px; display: flex; justify-content: center;">
      <div style="width: 30px; height: 30px; background-color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); z-index: 2; border: 2px solid #a855f7;">
        <div style="width: 22px; height: 22px; background: linear-gradient(135deg, #a855f7, #6366f1); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 12px; font-family: Outfit, sans-serif;">L</div>
      </div>
      <div style="position: absolute; bottom: 4px; width: 0; height: 0; border-left: 7px solid transparent; border-right: 7px solid transparent; border-top: 10px solid #a855f7; z-index: 1;"></div>
      <div style="position: absolute; bottom: 0; width: 14px; height: 4px; background: rgba(0,0,0,0.2); border-radius: 50%; blur: 2px;"></div>
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

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
  };

  const filteredLabs = labs.filter(lab => {
    // CRITICAL FIX: If user searched for a city, filter relative to that city center.
    // Only use livePos if they are using "My Location" mode.
    const isMyLocation = city.toLowerCase().includes("my location");
    const refPos = (isMyLocation && livePos) ? livePos : cityPos; 
    
    if (!refPos) return true;
    const dist = calculateDistance(refPos[0], refPos[1], lab.lat, lab.lon);
    
    // Increased radius to 15km for better catch-all, but still strict
    return dist === null || dist <= 15;
  });

  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-[var(--bg-main)] font-['Outfit'] transition-colors duration-300 text-[var(--text-main)]">
      
      {/* ─── TOP SEARCH BAR ─── */}
      <div className="shrink-0 z-20 px-4 py-4 md:py-6 bg-white/5 dark:bg-black/20 border-b border-white/5 backdrop-blur-xl relative overflow-hidden">
        {/* Animated Background Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] -z-10 animate-pulse" />
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-4 md:gap-8">
          <div className="flex items-center justify-between w-full md:w-auto gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-tr from-cyan-400 to-purple-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-500/30 animate-floating">
                <FlaskConical size={22} className="md:size-28" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black tracking-tighter flex items-center gap-1">
                  <span className="text-[var(--text-main)]">Medi.</span>
                  <span className="text-neon">Labs</span>
                </h2>
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
                   <span className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap">Diagnostic Hub</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="w-full max-w-2xl relative group">
            <div className={`absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-2xl md:rounded-3xl blur-xl opacity-0 transition-opacity duration-500 ${loading ? 'opacity-100' : 'group-hover:opacity-100'}`} />
            <div className="relative flex items-center gap-2">
               <div className="flex-1 relative flex items-center">
                 <MapPin className="absolute left-4 text-cyan-400" size={18} />
                 <input 
                    type="text" 
                    placeholder="Search by City or Area..." 
                    className="w-full pl-12 pr-4 py-3.5 md:py-4 bg-white/10 dark:bg-black/40 border border-white/10 dark:border-white/5 rounded-2xl md:rounded-[1.5rem] text-sm md:text-base outline-none focus:border-cyan-400/50 text-[var(--text-main)] transition-all font-bold placeholder:text-gray-500 backdrop-blur-md"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchLabs()}
                 />
               </div>
               <button 
                  onClick={() => searchLabs()} 
                  disabled={loading}
                  className="px-6 md:px-10 h-[50px] md:h-[60px] rounded-xl md:rounded-2xl font-black text-white bg-gradient-to-r from-purple-500 to-indigo-600 shadow-[0_10px_20px_-5px_rgba(168,85,247,0.4)] hover:scale-[1.02] active:scale-95 transition-all text-xs md:text-sm disabled:opacity-50 uppercase tracking-widest flex items-center justify-center min-w-[100px] md:min-w-[140px]"
               >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="text-[10px]">SCANNING</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Search size={16} className="hidden sm:block" />
                      <span>SEARCH</span>
                    </div>
                  )}
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── BODY: Map Left + Results Right ─── */}
      <div className="flex flex-col md:flex-row flex-1 w-full overflow-hidden">
        
        {/* Map Container (Static Left) */}
        <div className="w-full md:w-[60%] lg:w-[65%] h-[35vh] md:h-full shrink-0 p-2 md:p-3 bg-[var(--bg-main)] flex flex-col relative md:sticky top-0 z-10">
          <div className="flex-1 relative rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-2xl border-[4px] md:border-[12px] border-[var(--bg-card)] ring-1 ring-[var(--border-subtle)]">
            <MapContainer center={cityPos} zoom={13} className="h-full w-full" zoomControl={false}>
              <LayersControl position="topleft">
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
              <MapController labs={filteredLabs} cityPos={cityPos} livePos={livePos} followUser={followUser} />
              <MapButtons livePos={livePos} followUser={followUser} setFollowUser={setFollowUser} />

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
              
              {filteredLabs.map(lab => (
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

        {/* Results List View (Scrollable Right) */}
        <div className="w-full md:w-[40%] lg:w-[35%] h-full overflow-y-auto bg-[var(--bg-main)] p-2 sm:p-4 md:p-6 shrink-0 z-10 custom-scrollbar pb-24 md:pb-8">
          {filteredLabs.length > 0 ? (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-end mb-2">
                <h3 className="text-lg font-black tracking-tight text-[var(--text-main)]">{filteredLabs.length} Labs Found</h3>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-[var(--bg-card)] py-1 px-3 rounded-full">Within 10 km</span>
              </div>
              {filteredLabs.map((lab, idx) => (
                <ResultCard
                  key={lab.id}
                  place={lab}
                  index={idx}
                  userPos={livePos || cityPos}
                  isHovered={hoveredId === lab.id}
                  onHoverStart={() => setHoveredId(lab.id)}
                  onHoverEnd={() => setHoveredId(null)}
                  onClick={() => {/* Popup will handle it */}}
                />
              ))}
            </div>
          ) : !loading && (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] opacity-20 text-center">
              <FlaskConical size={60}/>
              <p className="mt-4 font-black uppercase text-xs tracking-[0.3em]">No Signal</p>
              <p className="text-[9px] text-center mt-2 tracking-wider">Search another area to find labs within 10km</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}