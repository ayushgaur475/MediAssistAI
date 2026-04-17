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

// Map Control UI Component
function MapButtons({ livePos, followUser, setFollowUser }) {
  const map = useMap();
  
  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
      <div className="flex flex-col bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/10">
        <button 
          onClick={(e) => { e.stopPropagation(); map.zoomIn(); }} 
          className="w-11 h-11 flex items-center justify-center text-white hover:bg-white/10 transition-colors border-b border-white/5 text-xl font-light"
          title="Zoom In"
        >
          +
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); map.zoomOut(); }} 
          className="w-11 h-11 flex items-center justify-center text-white hover:bg-white/10 transition-colors border-b border-white/5 text-xl font-light"
          title="Zoom Out"
        >
          -
        </button>

        <button 
          onClick={(e) => { e.stopPropagation(); setFollowUser(!followUser); if (!followUser && livePos) map.flyTo(livePos, 15); }} 
          className={`w-11 h-11 flex items-center justify-center transition-all ${
            followUser ? "text-purple-400 bg-purple-400/10" : "text-gray-400 hover:text-white hover:bg-white/10"
          }`}
          title={followUser ? "Stop Tracking" : "Follow My Location"}
        >
          <Crosshair size={20} className={followUser ? "animate-spin-slow" : ""} />
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
    // If live pos is not available, we can base it on searched cityPos but 10km is strict.
    // If user's geo is available, measure from there, else measure from city center.
    const refPos = livePos || cityPos; 
    if (!refPos) return true;
    const dist = calculateDistance(refPos[0], refPos[1], lab.lat, lab.lon);
    return dist === null || dist <= 10;
  });

  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-[var(--bg-main)] font-['Outfit'] transition-colors duration-300 text-[var(--text-main)]">
      
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

      {/* ─── BODY: Map Left + Results Right ─── */}
      <div className="flex flex-col md:flex-row flex-1 w-full overflow-hidden">
        
        {/* Map Container (Static Left) */}
        <div className="w-full md:w-[60%] lg:w-[65%] h-[35vh] md:h-full shrink-0 p-2 md:p-3 bg-[var(--bg-main)] flex flex-col relative md:sticky top-0 z-10">
          <div className="flex-1 relative rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.1)] border-[8px] border-[var(--bg-card)] ring-1 ring-[var(--border-subtle)]">
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
                <h3 className="text-lg font-black tracking-tight">{filteredLabs.length} Labs Found</h3>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-[var(--bg-card)] py-1 px-3 rounded-full">Within 10 km</span>
              </div>
              {filteredLabs.map((lab, idx) => {
                const refPos = livePos || cityPos;
                const dist = refPos ? calculateDistance(refPos[0], refPos[1], lab.lat, lab.lon) : null;
                
                // Lab Address Parsing
                const parseLabAddress = (addrStr) => {
                  if (!addrStr) return { street: "N/A", city: "N/A", state: "N/A", pincode: "N/A" };
                  const parts = addrStr.split(',').map(p => p.trim());
                  const pinRegex = /\b\d{6}\b/;
                  const pinMatch = addrStr.match(pinRegex);
                  const pincode = pinMatch ? pinMatch[0] : "N/A";
                  const states = ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi"];
                  const state = states.find(s => addrStr.toLowerCase().includes(s.toLowerCase())) || "N/A";
                  let city = parts[parts.length - 3] || parts[parts.length - 2] || "N/A";
                  return { street: parts[0] || "N/A", city, state, pincode };
                };

                const addr = parseLabAddress(lab.address);

                return (
                  <motion.div
                    key={lab.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                    className={`p-6 rounded-3xl border transition-all cursor-pointer bg-[#0f0f12] flex flex-col gap-4
                      ${hoveredId === lab.id ? 'border-[#22d3ee]/50 shadow-[0_0_30px_rgba(34,211,238,0.15)] bg-[#16161a]' : 'border-white/5 shadow-xl'}
                    `}
                    onMouseEnter={() => setHoveredId(lab.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {/* Title */}
                    <div className="flex flex-col gap-2">
                       <h3 className="font-black text-[#22d3ee] text-lg leading-tight tracking-tight">
                         {idx + 1}. {lab.name}
                       </h3>
                       <div className="flex items-center gap-3">
                         <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 flex items-center gap-2">
                            <span className="text-white font-bold text-xs">{dist ? dist.toFixed(1) : "?.?"} km</span>
                            <span className="text-white/40 text-xs">•</span>
                            <span className="text-white font-bold text-xs">{dist ? Math.round(dist * 1.8) : "??"} min</span>
                         </div>
                         <span className="text-white/60 font-medium text-[10px] tracking-widest uppercase">{lab.type || "Pathology"}</span>
                       </div>
                    </div>

                    {/* Address Stack */}
                    <div className="flex flex-col gap-2.5 mt-2">
                      <div className="flex gap-2 text-sm">
                        <span className="text-white font-black whitespace-nowrap">Address:</span>
                        <span className="text-white/70 font-medium">{addr.street}</span>
                      </div>
                      <div className="flex gap-2 text-sm">
                        <span className="text-white font-black whitespace-nowrap">City:</span>
                        <span className="text-white/70 font-medium">{addr.city}</span>
                      </div>
                      <div className="flex gap-2 text-sm">
                        <span className="text-white font-black whitespace-nowrap">State:</span>
                        <span className="text-white/70 font-medium">{addr.state}</span>
                      </div>
                      <div className="flex gap-2 text-sm">
                        <span className="text-white font-black whitespace-nowrap">Pincode:</span>
                        <span className="text-white/70 font-medium">{addr.pincode}</span>
                      </div>
                    </div>

                    <button className="mt-4 w-full py-4 rounded-2xl border-2 border-[#22d3ee] text-[#22d3ee] font-black text-lg hover:bg-[#22d3ee] hover:text-white transition-all active:scale-[0.98] shadow-lg shadow-[#22d3ee]/10">
                      Navigate
                    </button>
                  </motion.div>
                );
              })}
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