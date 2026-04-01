import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useLocation, useSearchParams } from "react-router-dom";
import { Activity, AlertCircle, Navigation } from "lucide-react";
import ResultCard from "../components/ResultCard";

// Handle Map Animations & Bounds
function MapController({ places, selectedId, userPos, routingTo, routeData }) {
  const map = useMap();

  const isInsideIndia = (lat, lon) => {
    return lat >= 6 && lat <= 38 && lon >= 68 && lon <= 98;
  };

  useEffect(() => {
    // Priority 1: Navigation Routing (Fit to Path)
    if (routeData && routeData.length > 0) {
      const bounds = L.latLngBounds(routeData);
      map.fitBounds(bounds, { padding: [100, 100], animate: true });
      return;
    }

    // Priority 2: Selected Hospital
    if (selectedId && places.length > 0) {
      const selectedPlace = places.find(p => (p.place_id || p.id) === selectedId);
      if (selectedPlace && selectedPlace.lat !== 0 && selectedPlace.lon !== 0 && isInsideIndia(selectedPlace.lat, selectedPlace.lon)) {
        map.flyTo([selectedPlace.lat, selectedPlace.lon], 16, { animate: true, duration: 1.5 });
      }
      return;
    }

    // Priority 3: All Search Results
    const validPlaces = places.filter(p => p.lat !== 0 && p.lon !== 0 && isInsideIndia(p.lat, p.lon));
    if (validPlaces.length > 0) {
      const bounds = L.latLngBounds(validPlaces.map(p => [p.lat, p.lon]));
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    }
  }, [places, selectedId, map, userPos, routingTo, routeData]);

  return null;
}

// Map Control UI Component
function MapButtons({ handleLocate, setRoutingTo, userPos }) {
  const map = useMap();
  
  useEffect(() => {
    if (userPos && !window.hasInitiallyLocated) {
      map.flyTo(userPos, 15, { animate: true });
      window.hasInitiallyLocated = true;
    }
  }, [userPos, map]);

  return (
    <div className="absolute top-6 right-6 flex flex-col gap-3 z-[1000]">
      <div className="flex flex-col bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-white/10">
        <button onClick={(e) => { e.stopPropagation(); map.zoomIn(); }} className="w-12 h-12 flex items-center justify-center text-white hover:bg-white/10 font-light text-2xl border-b border-white/5">+</button>
        <button onClick={(e) => { e.stopPropagation(); map.zoomOut(); }} className="w-12 h-12 flex items-center justify-center text-white hover:bg-white/10 font-light text-2xl">-</button>
      </div>
      
      <button onClick={(e) => { e.stopPropagation(); handleLocate(); }} className="w-12 h-12 bg-gray-900 text-cyan-400 rounded-2xl shadow-2xl flex items-center justify-center hover:bg-white/10 border border-white/10" title="Find Me">
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>
      </button>

      <button onClick={(e) => { e.stopPropagation(); setRoutingTo(null); window.hasInitiallyLocated = false; }} className="w-12 h-12 bg-gray-900 text-purple-400 rounded-2xl shadow-2xl flex items-center justify-center hover:bg-white/10 border border-white/10" title="Reset Map">
         <svg className="w-6 h-6 rotate-45" fill="currentColor" viewBox="0 0 24 24"><path d="M21 3L3 10.53v.98l6.84 2.65L12.48 21h.98L21 3z"/></svg>
      </button>
    </div>
  );
}

const COMMON_SPECIALITIES = [
  'Cardiology', 'Neurology', 'Dentist', 'ENT Specialist', 'Eye Specialist',
  'Surgeon', 'Orthopedic', 'Pediatrician', 'Gynecologist', 'Dermatologist',
  'Psychiatrist', 'Oncologist', 'Radiologist', 'Urologist', 'Gastroenterologist'
];

export default function MapPage() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");
  const [city, setCity] = useState("");
  const [speciality, setSpeciality] = useState("");
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEmergencyLoading, setIsEmergencyLoading] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [fallbackMessage, setFallbackMessage] = useState("");
  const [userPos, setUserPos] = useState(null);
  const [routingTo, setRoutingTo] = useState(null);
  const [routeData, setRouteData] = useState([]);

  const [allDistricts, setAllDistricts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [allSpecialities, setAllSpecialities] = useState([]);
  const [specSuggestions, setSpecSuggestions] = useState([]);

  const markerRefs = useRef({});
  const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || "API_KEY";
  
  useEffect(() => {
    const cityParam = searchParams.get("city");
    const specParam = searchParams.get("speciality");
    const modeParam = searchParams.get("mode");

    if (cityParam) setCity(cityParam);
    if (specParam) setSpeciality(specParam);

    if (modeParam === "emergency") {
      handleEmergencySequence();
    } else if (cityParam) {
      // Small delay to ensure state is set or just call directly with values
      handleInitialSearch(cityParam, specParam || "");
    } else if (modeParam === "doctor") {
      handleLocate(); // Try to find nearby doctors if mode is doctor but no city
    }
  }, [searchParams]);

  const handleInitialSearch = async (c, s) => {
    if (c === "My Location") {
      handleLocate();
      return;
    }
    setLoading(true); setFallbackMessage("");
    try {
      const res = await fetch(`http://localhost:5000/api/hospitals/search?city=${encodeURIComponent(c)}&speciality=${encodeURIComponent(s)}`);
      const json = await res.json();
      if (json.cityCoords) setUserPos([json.cityCoords.lat, json.cityCoords.lon]);
      if (json.data && json.data.length > 0) setPlaces(json.data);
      else setFallbackMessage(`No hospitals found in ${c}.`);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleEmergencySequence = async () => {
    setIsEmergencyLoading(true);
    setLoading(true);
    setFallbackMessage("🚨 EMERGENCY SOS ACTIVE");
    
    if (!navigator.geolocation) {
      alert("Geolocation required for SOS");
      setIsEmergencyLoading(false);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const p = [pos.coords.latitude, pos.coords.longitude];
      setUserPos(p);
      await fetchNearestHospital(p);
    }, (err) => {
      alert("Allow location to use Emergency SOS");
      setIsEmergencyLoading(false);
      setLoading(false);
    });
  };

  const fetchNearestHospital = async (pos) => {
    try {
      const [lat, lon] = pos;
      const query = `[out:json][timeout:25];node["amenity"="hospital"](around:10000,${lat},${lon});out body;`;
      
      const mirrors = [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
        "https://overpass.osm.ch/api/interpreter"
      ];

      let json = null;
      let lastError = null;

      // --- Stage 1: Overpass Mirrors ---
      for (const mirror of mirrors) {
        try {
          const res = await fetch(mirror, {
            method: "POST",
            body: query,
            signal: AbortSignal.timeout(10000) // 10s for emergency
          });
          
          if (res.status === 403 || res.status === 429) continue;
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          
          const text = await res.text();
          try {
            const parsed = JSON.parse(text);
            if (parsed && parsed.elements && parsed.elements.length > 0) {
              json = parsed;
              break;
            }
          } catch (e) {
            throw new Error("Invalid JSON");
          }
        } catch (err) {
          console.warn(`SOS Mirror ${mirror} failed:`, err.message);
          lastError = err;
        }
      }

      // --- Stage 2: Nominatim Fallback ---
      if (!json || json.elements.length === 0) {
        console.log("SOS: Overpass failed or empty. Falling back to Nominatim...");
        try {
          const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=hospital+near+${lat},${lon}&countrycodes=in&limit=10`;
          const nomRes = await fetch(nomUrl, { headers: { 'User-Agent': 'MediAsisstAI-App' } });
          const nomData = await nomRes.json();
          
          if (nomData && nomData.length > 0) {
            const mapped = nomData.map(item => ({
              id: `osm_${item.place_id}`,
              hospital_name: item.display_name.split(',')[0],
              address: item.display_name,
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon),
              source: 'osm'
            }));
            setPlaces(mapped);
            const nearest = mapped[0];
            setSelectedId(nearest.id);
            setRoutingTo(nearest);
            fetchRoute(pos, nearest);
            setFallbackMessage(`✅ SOS: Hospital Found (via Hybrid Search)`);
            setLoading(false);
            setIsEmergencyLoading(false);
            return;
          }
        } catch (nomErr) {
          console.error("SOS Nominatim Fallback failed:", nomErr);
        }
      }

      if (json && json.elements && json.elements.length > 0) {
        const mapped = json.elements.map(el => ({
          id: `osm_${el.id}`,
          hospital_name: el.tags.name || "Emergency Medical Center",
          address: el.tags["addr:full"] || el.tags["addr:street"] || "Nearby Facility",
          lat: el.lat,
          lon: el.lon,
          source: 'osm'
        }));

        const getDist = (l1, n1, l2, n2) => Math.sqrt((l1-l2)**2 + (n1-n2)**2);
        mapped.sort((a, b) => getDist(lat, lon, a.lat, a.lon) - getDist(lat, lon, b.lat, b.lon));

        setPlaces(mapped);
        const nearest = mapped[0];
        setSelectedId(nearest.id);
        setRoutingTo(nearest);
        fetchRoute(pos, nearest);
        setFallbackMessage(`✅ SOS: Neareast Hospital Found`);
      } else {
        setFallbackMessage(lastError ? `⚠️ SOS Error: ${lastError.message}` : "❌ NO HOSPITALS IN 10KM");
      }
    } catch (err) {
      setFallbackMessage("⚠️ SOS SEARCH FAILED. Check Connection.");
    } finally {
      setIsEmergencyLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch("http://localhost:5000/api/hospitals/districts").then(res => res.json()).then(json => setAllDistricts(json.data || []));
    fetch("http://localhost:5000/api/hospitals/specialities").then(res => res.json()).then(json => {
      const combined = Array.from(new Set([...(json.data || []), ...COMMON_SPECIALITIES])).sort();
      setAllSpecialities(combined);
    });
  }, []);

  useEffect(() => {
    window.handleNavigate = async (hosp) => {
      setRoutingTo(hosp);
      setSelectedId(hosp.id);
      if (!userPos) { handleLocate(); }
      else { fetchRoute(userPos, hosp); }
    };
    return () => { delete window.handleNavigate; };
  }, [userPos, routingTo]);

  const fetchRoute = async (start, end) => {
    try {
      const [uLat, uLon] = start;
      const url = `https://router.project-osrm.org/route/v1/driving/${uLon},${uLat};${end.lon},${end.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.routes && json.routes[0]) {
        const coords = json.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
        setRouteData(coords);
      }
    } catch (err) { console.error("OSRM failed", err); setRouteData([start, [end.lat, end.lon]]); }
  };

  const handleLocate = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    navigator.geolocation.getCurrentPosition((pos) => {
      const p = [pos.coords.latitude, pos.coords.longitude];
      setUserPos(p);
      if (routingTo) fetchRoute(p, routingTo);
    }, (err) => alert("Allow location to use navigation."));
  };

  const handleCityChange = (v) => { setCity(v); setSuggestions(v ? allDistricts.filter(d => d.toLowerCase().startsWith(v.toLowerCase())).slice(0, 5) : []); };
  const handleSpecChange = (v) => { setSpeciality(v); setSpecSuggestions(v ? allSpecialities.filter(s => s.toLowerCase().startsWith(v.toLowerCase())).slice(0, 5) : []); };

  const handleSearch = async () => {
    if (!city.trim()) return;
    setLoading(true); setSelectedId(null); setRoutingTo(null); setRouteData([]); setFallbackMessage("");
    try {
      const res = await fetch(`http://localhost:5000/api/hospitals/search?city=${encodeURIComponent(city)}&speciality=${encodeURIComponent(speciality)}`);
      const json = await res.json();
      
      // Update User Position to City Center if available
      if (json.cityCoords) {
        const coords = [json.cityCoords.lat, json.cityCoords.lon];
        setUserPos(coords);
        window.hasInitiallyLocated = false; // Reset locate flag to allow flyTo
      }

      if (json.data && json.data.length > 0) {
        setPlaces(json.data);
        if (json.source === 'osm') setFallbackMessage("External Data Source");
      } else { setPlaces([]); setFallbackMessage(`No hospitals found in ${city}.`); }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { if (selectedId && markerRefs.current[selectedId]) markerRefs.current[selectedId].openPopup(); }, [selectedId]);

  const normalIcon = L.icon({ iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png", iconSize: [25, 41], iconAnchor: [12, 41] });
  const highlightedIcon = L.icon({ iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png", iconSize: [25, 41], iconAnchor: [12, 41] });

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-96px)] w-full overflow-hidden bg-[var(--bg-main)] font-['Outfit'] transition-colors duration-300 text-[var(--text-main)]">
      {/* Sidebar */}
      <div className="w-full md:w-[30%] min-w-[320px] max-w-[400px] flex flex-col bg-[var(--bg-main)] z-10 overflow-hidden border-r border-[var(--border-subtle)]">
        <div className="p-6 bg-[var(--bg-card)] border-b border-[var(--border-subtle)]">
          <h2 className="text-xl font-black mb-6 uppercase tracking-tighter"><span className="text-neon">Medi.</span>Map</h2>
          <div className="space-y-4">
            <div className="relative">
              <input type="text" placeholder="Enter City" className="w-full p-4 glass-card bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl text-sm outline-none focus:border-cyan-400 text-[var(--text-main)] transition-all" value={city} onChange={e => handleCityChange(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
              {suggestions.length > 0 && <div className="absolute top-full left-0 w-full mt-2 glass-card rounded-2xl z-50 overflow-hidden shadow-2xl">{suggestions.map(s => <div key={s} className="p-4 hover:bg-white/10 cursor-pointer text-sm font-bold" onClick={() => { setCity(s); setSuggestions([]); }}>📍 {s}</div>)}</div>}
            </div>
            <div className="relative">
              <input type="text" placeholder="Speciality" className="w-full p-4 glass-card bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl text-sm outline-none focus:border-purple-400 text-[var(--text-main)] transition-all" value={speciality} onChange={e => handleSpecChange(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
              {specSuggestions.length > 0 && <div className="absolute top-full left-0 w-full mt-2 glass-card rounded-2xl z-50 overflow-hidden shadow-2xl">{specSuggestions.map(s => <div key={s} className="p-4 hover:bg-white/10 cursor-pointer text-sm font-bold" onClick={() => { setSpeciality(s); setSpecSuggestions([]); }}>🩺 {s}</div>)}</div>}
            </div>
            <button onClick={handleSearch} disabled={loading} className="w-full py-4 rounded-2xl font-black text-white bg-gradient-to-r from-cyan-400 to-purple-500 shadow-xl hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-xs">
              {loading ? "Scanning..." : "Apply Search"}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {fallbackMessage && <div className="bg-cyan-500/10 text-cyan-400 text-[10px] font-black uppercase p-3 rounded-xl border border-cyan-500/20 tracking-widest">{fallbackMessage}</div>}
          {places.length > 0 ? (
            places.map((place, index) => <ResultCard 
              key={place.id || index} 
              place={place} 
              index={index} 
              userPos={userPos}
              isHovered={hoveredId === place.id || selectedId === place.id} 
              onHoverStart={() => setHoveredId(place.id)} 
              onHoverEnd={() => setHoveredId(null)} 
              onClick={() => setSelectedId(place.id)} 
            />)
          ) : !loading && <div className="flex flex-col items-center justify-center mt-20 opacity-20"><Activity size={60}/><p className="mt-4 font-black uppercase text-xs tracking-[0.3em]">No Signal</p></div>}
        </div>
      </div>

      <div className="flex-1 p-4 bg-[var(--bg-main)] flex flex-col">
        <div className="flex-1 relative rounded-[3rem] overflow-hidden shadow-[0_0_50px_rgba(0,210,255,0.1) dark:shadow-[0_0_50px_rgba(0,210,255,0.15)] border-[10px] border-[var(--bg-card)] ring-1 ring-[var(--border-subtle)]">
          <MapContainer center={[20.5937, 78.9629]} zoom={5} className="h-full w-full" zoomControl={false}>
            <TileLayer url={`https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`} attribution="&copy; MapTiler &copy; OSM" />
            <MapController places={places} selectedId={selectedId} userPos={userPos} routingTo={routingTo} routeData={routeData} />
            <MapButtons handleLocate={handleLocate} setRoutingTo={setRoutingTo} userPos={userPos} />
            {userPos && <Marker position={userPos} icon={L.icon({ iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png", iconSize: [32, 32], iconAnchor: [16, 16] })}><Popup>You are here</Popup></Marker>}
            {routeData.length > 0 && <Polyline positions={routeData} color="#000000" weight={6} opacity={0.9} lineJoin="round" lineCap="round" />}
            {places.map(place => {
              const lat = parseFloat(place.lat); const lon = parseFloat(place.lon); if (!lat || !lon) return null;
              return (
                <Marker key={place.id} position={[lat, lon]} icon={selectedId === place.id ? highlightedIcon : normalIcon} ref={r => { if (r) markerRefs.current[place.id] = r; }} eventHandlers={{ click: () => setSelectedId(place.id) }}>
                  <Popup className="custom-popup">
                    <div className="min-w-[200px] p-2 bg-[var(--bg-main)] text-[var(--text-main)] rounded-xl">
                      <h4 className="font-black text-neon text-sm uppercase leading-tight mb-2 tracking-tighter">{place.hospital_name}</h4>
                      <p className="text-[10px] text-[var(--text-muted)] mb-4 font-medium">{place.address}</p>
                      <button className="w-full bg-gradient-to-r from-cyan-400 to-purple-500 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-md" onClick={() => window.handleNavigate(place)}>Navigate Now</button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}