import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, Tooltip, LayersControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useLocation, useSearchParams } from "react-router-dom";
import { Activity, AlertCircle, Navigation, Crosshair } from "lucide-react";
import ResultCard from "../components/ResultCard";
import SearchBar from "../components/SearchBar";
import { useLiveLocation } from "../hooks/useLiveLocation";

// Handle Map Animations & Bounds
function MapController({ places, selectedId, userPos, routingTo, routeData, livePos, followUser }) {
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

    // Priority 3: Live User Position (Follow Mode)
    if (followUser && livePos) {
      map.flyTo(livePos, map.getZoom() < 15 ? 15 : map.getZoom(), { animate: true, duration: 1 });
      return;
    }

    // Priority 4: All Search Results
    const validPlaces = places.filter(p => p.lat !== 0 && p.lon !== 0 && isInsideIndia(p.lat, p.lon));
    if (validPlaces.length > 0) {
      const bounds = L.latLngBounds(validPlaces.map(p => [p.lat, p.lon]));
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    }
  }, [places, selectedId, map, userPos, routingTo, routeData, livePos, followUser]);

  // Disable follow mode on manual drag
  useEffect(() => {
    const handleMove = () => {
      // Logic to detect manual drag could be added here if we wanted to auto-disable follow mode
    };
    map.on('dragstart', handleMove);
    return () => map.off('dragstart', handleMove);
  }, [map]);

  return null;
}

// Map Control UI Component
function MapButtons({ handleLocate, setRoutingTo, userPos, followUser, setFollowUser }) {
  const map = useMap();
  
  useEffect(() => {
    if (userPos && !window.hasInitiallyLocated) {
      map.flyTo(userPos, 15, { animate: true });
      window.hasInitiallyLocated = true;
    }
  }, [userPos, map]);

  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
      {/* Action Pillar */}
      <div className="flex flex-col bg-[var(--bg-card)] backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden border border-[var(--border-subtle)]">
        {/* Zoom Controls */}
        <button 
          onClick={(e) => { e.stopPropagation(); map.zoomIn(); }} 
          className="w-11 h-11 flex items-center justify-center text-[var(--text-main)] hover:bg-[var(--text-main)]/5 transition-colors border-b border-[var(--border-subtle)] text-xl font-light"
          title="Zoom In"
        >
          +
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); map.zoomOut(); }} 
          className="w-11 h-11 flex items-center justify-center text-[var(--text-main)] hover:bg-[var(--text-main)]/5 transition-colors border-b border-[var(--border-subtle)] text-xl font-light"
          title="Zoom Out"
        >
          -
        </button>

        {/* Locate / Follow */}
        <button 
          onClick={(e) => { e.stopPropagation(); setFollowUser(!followUser); if (!followUser) handleLocate(); }} 
          className={`w-11 h-11 flex items-center justify-center transition-all border-b border-[var(--border-subtle)] ${
            followUser ? "text-cyan-500 bg-cyan-500/10" : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--text-main)]/5"
          }`}
          title={followUser ? "Stop Tracking" : "Follow Me"}
        >
          <Crosshair size={20} className={followUser ? "animate-spin-slow" : ""} />
        </button>

        {/* Recenter */}
        <button 
          onClick={(e) => { e.stopPropagation(); handleLocate(); }} 
          className="w-11 h-11 flex items-center justify-center text-cyan-400 hover:bg-[var(--text-main)]/5 transition-colors border-b border-[var(--border-subtle)]"
          title="Recenter"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>
        </button>

        {/* Reset Map */}
        <button 
          onClick={(e) => { e.stopPropagation(); setRoutingTo(null); window.hasInitiallyLocated = false; }} 
          className="w-11 h-11 flex items-center justify-center text-purple-400 hover:bg-[var(--text-main)]/5 transition-colors"
          title="Reset Map"
        >
           <svg className="w-5 h-5 rotate-45" fill="currentColor" viewBox="0 0 24 24"><path d="M21 3L3 10.53v.98l6.84 2.65L12.48 21h.98L21 3z"/></svg>
        </button>
      </div>
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
  const [followUser, setFollowUser] = useState(false);
  const [isSearchedCity, setIsSearchedCity] = useState(false);

  const { location: livePos, error: liveError, isTracking } = useLiveLocation();

  const [allDistricts, setAllDistricts] = useState([]);
  const searchingRef = useRef(false);
  const [suggestions, setSuggestions] = useState([]);
  const [allSpecialities, setAllSpecialities] = useState([]);
  const [specSuggestions, setSpecSuggestions] = useState([]);
  // Stores exact GPS coords from "Use My Location" so Apply Search uses them too
  const [gpsCoords, setGpsCoords] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const markerRefs = useRef({});
  const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || "API_KEY";
  
  useEffect(() => {
    const cityParam = searchParams.get("city");
    const specParam = searchParams.get("speciality");
    const modeParam = searchParams.get("mode");

    if (cityParam) setCity(cityParam);
    if (specParam) setSpeciality(specParam);

    if (cityParam && cityParam !== "My Location") {
      handleInitialSearch(cityParam, specParam || "");
    } else if (modeParam === "emergency") {
      handleEmergencySequence();
    }
  }, [searchParams]);

  const handleInitialSearch = async (c, s) => {
    if (c === "My Location") {
      handleLocate();
      return;
    }
    setLoading(true); setFallbackMessage("");
    try {
      const res = await fetch(`${API_URL}/api/hospitals/search?city=${encodeURIComponent(c)}&speciality=${encodeURIComponent(s)}`);
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
      setFallbackMessage("Geolocation not supported");
      setIsEmergencyLoading(false);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const p = [pos.coords.latitude, pos.coords.longitude];
      setUserPos(p);
      setIsSearchedCity(false);
      await fetchNearestHospital(p);
    }, (err) => {
      setFallbackMessage("⚠️ SOS: Please allow location access");
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
      
      // --- Stage 1: Turbo SOS Racing ---
      if (searchingRef.current) return;
      searchingRef.current = true;

      try {
        json = await Promise.any(mirrors.map(async (mirror) => {
          const res = await fetch(mirror, {
            method: "POST",
            body: query,
            signal: AbortSignal.timeout(5000)
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          if (!data || !data.elements || data.elements.length === 0) throw new Error("Empty");
          return data;
        }));
      } catch (err) {
        console.warn("Turbo SOS: All mirrors failed or timed out.");
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
            searchingRef.current = false;
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
        setFallbackMessage(`✅ SOS: Nearest Hospital Found`);
      } else {
        setFallbackMessage("❌ NO HOSPITALS IN 10KM (Try manual search)");
      }
    } catch (err) {
      setFallbackMessage("⚠️ SOS SEARCH FAILED. Check Connection.");
    } finally {
      setIsEmergencyLoading(false);
      setLoading(false);
      searchingRef.current = false;
    }
  };

  useEffect(() => {
    fetch(`${API_URL}/api/hospitals/districts`).then(res => res.json()).then(json => setAllDistricts(json.data || []));
    fetch(`${API_URL}/api/hospitals/specialities`).then(res => res.json()).then(json => {
      const combined = Array.from(new Set([...(json.data || []), ...COMMON_SPECIALITIES])).sort();
      setAllSpecialities(combined);
    });
  }, []);

  useEffect(() => {
    window.handleNavigate = async (hosp) => {
      setRoutingTo(hosp);
      setSelectedId(hosp.id);
      document.getElementById('map-view')?.scrollIntoView({ behavior: 'smooth' });
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
    if (!navigator.geolocation) return setFallbackMessage("Geolocation not supported");
    
    navigator.geolocation.getCurrentPosition((pos) => {
      const p = [pos.coords.latitude, pos.coords.longitude];
      setUserPos(p);
      setIsSearchedCity(false);
      if (routingTo) fetchRoute(p, routingTo);
    }, (err) => setFallbackMessage("Please enable location access."));
  };

  const fetchNearbyByCoords = async (lat, lon, spec = "") => {
    if (searchingRef.current) return;
    searchingRef.current = true;
    setLoading(true);
    setSelectedId(null);
    setRoutingTo(null);
    setRouteData([]);
    setFallbackMessage("");
    setUserPos([lat, lon]);
    setIsSearchedCity(false);
    window.hasInitiallyLocated = false;

    const RADIUS_M = 20000;
    const RADIUS_DEG = 0.2;

    const distKm = (lat1, lon1, lat2, lon2) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    let amenityFilter = "";
    const specLower = spec.toLowerCase().trim();
    if (specLower === "dentist" || specLower.includes("dental")) {
      amenityFilter = `node["amenity"="dentist"](around:${RADIUS_M},${lat},${lon});way["amenity"="dentist"](around:${RADIUS_M},${lat},${lon});`;
    } else if (specLower.includes("pharmacy")) {
      amenityFilter = `node["amenity"="pharmacy"](around:${RADIUS_M},${lat},${lon});way["amenity"="pharmacy"](around:${RADIUS_M},${lat},${lon});`;
    } else if (specLower.includes("clinic") || specLower.includes("doctor")) {
      amenityFilter = `node["amenity"~"clinic|doctors"](around:${RADIUS_M},${lat},${lon});way["amenity"~"clinic|doctors"](around:${RADIUS_M},${lat},${lon});`;
    } else if (spec) {
      amenityFilter = `
        node["amenity"~"hospital|clinic|doctors"]["name"~"${spec}",i](around:${RADIUS_M},${lat},${lon});
        way["amenity"~"hospital|clinic|doctors"]["name"~"${spec}",i](around:${RADIUS_M},${lat},${lon});
        node["amenity"~"hospital|clinic|doctors"]["healthcare:speciality"~"${spec}",i](around:${RADIUS_M},${lat},${lon});
        way["amenity"~"hospital|clinic|doctors"]["healthcare:speciality"~"${spec}",i](around:${RADIUS_M},${lat},${lon});
      `;
    } else {
      amenityFilter = `node["amenity"="hospital"](around:${RADIUS_M},${lat},${lon});way["amenity"="hospital"](around:${RADIUS_M},${lat},${lon});`;
    }

    const query = `[out:json][timeout:30];(${amenityFilter});out center body;`;
    const mirrors = [
      "https://overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter",
      "https://overpass.osm.ch/api/interpreter"
    ];

    let json = null;
    try {
      json = await Promise.any(mirrors.map(async (mirror) => {
        const res = await fetch(mirror, {
          method: "POST",
          body: query,
          signal: AbortSignal.timeout(5000)
        });
        if (!res.ok) throw new Error("Fail");
        const data = await res.json();
        if (!data?.elements?.length) throw new Error("Empty");
        return data;
      }));
    } catch {
      console.warn("Turbo Search: All mirrors failed.");
    }

    if (json?.elements?.length > 0) {
      const mapped = json.elements
        .map(el => ({
          id: `osm_${el.id}`,
          hospital_name: el.tags?.name || "Nearby Hospital",
          address: el.tags?.["addr:full"] || el.tags?.["addr:street"] || el.tags?.["addr:city"] || "Nearby Facility",
          lat: el.lat ?? el.center?.lat,
          lon: el.lon ?? el.center?.lon,
          speciality: el.tags?.amenity || "hospital",
          source: 'osm'
        }))
        .filter(h => h.lat && h.lon)
        .filter(h => distKm(lat, lon, h.lat, h.lon) <= 25)
        .sort((a, b) => distKm(lat, lon, a.lat, a.lon) - distKm(lat, lon, b.lat, b.lon));

      setPlaces(mapped);
      setFallbackMessage(`📍 ${mapped.length} hospitals found within 20km of your location`);
    } else {
      try {
        const minLat = lat - RADIUS_DEG, maxLat = lat + RADIUS_DEG;
        const minLon = lon - RADIUS_DEG, maxLon = lon + RADIUS_DEG;
        // viewbox format: left,top,right,bottom  bounded=1 strictly restricts to this box
        const nomQuery = spec ? `${spec} hospital` : 'hospital';
        const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(nomQuery)}&viewbox=${minLon},${maxLat},${maxLon},${minLat}&bounded=1&countrycodes=in&limit=20`;
        const nomRes = await fetch(nomUrl, { headers: { 'User-Agent': 'MediAsisstAI-App' } });
        const nomData = await nomRes.json();

        if (nomData?.length > 0) {
          const mapped = nomData
            .map(item => ({
              id: `osm_${item.place_id}`,
              hospital_name: item.display_name.split(',')[0],
              address: item.display_name,
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon),
              source: 'osm'
            }))
            // Hard distance filter even on Nominatim results
            .filter(h => distKm(lat, lon, h.lat, h.lon) <= 25)
            .sort((a, b) => distKm(lat, lon, a.lat, a.lon) - distKm(lat, lon, b.lat, b.lon));

          if (mapped.length > 0) {
            setPlaces(mapped);
            setFallbackMessage(`📍 ${mapped.length} hospitals found near your location`);
          } else {
            setFallbackMessage("No hospitals found within 25km of your location. Try searching by city name.");
          }
        } else {
          setFallbackMessage("No hospitals found near your location. Try searching by city name.");
        }
      } catch {
        setFallbackMessage("Unable to search nearby hospitals. Please try searching by city.");
      }
    }
    setLoading(false);
  };

  // Manually typing a city clears GPS mode
  const handleCityChange = (v) => {
    setCity(v);
    setGpsCoords(null); // user is typing, stop using GPS coords
    setSuggestions(v ? allDistricts.filter(d => d.toLowerCase().startsWith(v.toLowerCase())).slice(0, 5) : []);
  };
  const handleSpecChange = (v) => { setSpeciality(v); setSpecSuggestions(v ? allSpecialities.filter(s => s.toLowerCase().startsWith(v.toLowerCase())).slice(0, 5) : []); };

  const handleSearch = async (overrideCity) => {
    // If GPS coords are saved (from "Use My Location"), use them for accuracy
    if (gpsCoords && typeof overrideCity !== 'string') {
      fetchNearbyByCoords(gpsCoords[0], gpsCoords[1], speciality);
      return;
    }
    const searchCity = (typeof overrideCity === 'string' ? overrideCity : city).trim();
    if (!searchCity) return;
    setLoading(true); setSelectedId(null); setRoutingTo(null); setRouteData([]); setFallbackMessage("");
    try {
      const res = await fetch(`${API_URL}/api/hospitals/search?city=${encodeURIComponent(searchCity)}&speciality=${encodeURIComponent(speciality)}`);
      const json = await res.json();
      
      // Update User Position to City Center if available
      if (json.cityCoords) {
        const coords = [json.cityCoords.lat, json.cityCoords.lon];
        setUserPos(coords);
        setIsSearchedCity(true);
        window.hasInitiallyLocated = false;
      }

      if (json.data && json.data.length > 0) {
        setPlaces(json.data);
        if (json.source === 'osm') setFallbackMessage("External Data Source");
      } else { setPlaces([]); setFallbackMessage(`No hospitals found in ${searchCity}.`); }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { if (selectedId && markerRefs.current[selectedId]) markerRefs.current[selectedId].openPopup(); }, [selectedId]);

  const hospitalPinHtml = `
    <div style="position: relative; width: 24px; height: 32px; display: flex; justify-content: center;">
      <div style="width: 24px; height: 24px; background-color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3); z-index: 2;">
        <div style="width: 18px; height: 18px; background-color: #ea4335; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px; font-family: sans-serif;">H</div>
      </div>
      <div style="position: absolute; bottom: 2px; width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid white; z-index: 1; filter: drop-shadow(0 2px 1px rgba(0,0,0,0.2));"></div>
    </div>
  `;

  const highlightedHospitalPinHtml = `
    <div style="position: relative; width: 28px; height: 38px; display: flex; justify-content: center; z-index: 1000; transform: translateY(-4px);">
      <div style="width: 28px; height: 28px; background-color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.4); z-index: 2;">
        <div style="width: 22px; height: 22px; background-color: #d32f2f; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 13px; font-family: sans-serif;">H</div>
      </div>
      <div style="position: absolute; bottom: 2px; width: 0; height: 0; border-left: 7px solid transparent; border-right: 7px solid transparent; border-top: 10px solid white; z-index: 1; filter: drop-shadow(0 2px 1px rgba(0,0,0,0.3));"></div>
    </div>
  `;

  const searchedPinHtml = `
    <div style="position: relative; width: 28px; height: 38px; display: flex; justify-content: center; z-index: 900; transform: translateY(-4px);">
      <div style="width: 28px; height: 28px; background-color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.4); z-index: 2;">
        <div style="width: 20px; height: 20px; background-color: #3b82f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white;">
           <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/></svg>
        </div>
      </div>
      <div style="position: absolute; bottom: 2px; width: 0; height: 0; border-left: 7px solid transparent; border-right: 7px solid transparent; border-top: 10px solid white; z-index: 1; filter: drop-shadow(0 2px 1px rgba(0,0,0,0.3));"></div>
    </div>
  `;

  const normalIcon = L.divIcon({ className: 'empty-class', html: hospitalPinHtml, iconSize: [24, 32], iconAnchor: [12, 32], tooltipAnchor: [12, -20] });
  const highlightedIcon = L.divIcon({ className: 'empty-class', html: highlightedHospitalPinHtml, iconSize: [28, 38], iconAnchor: [14, 38], tooltipAnchor: [14, -24] });
  const searchedLocationIcon = L.divIcon({ className: 'empty-class', html: searchedPinHtml, iconSize: [28, 38], iconAnchor: [14, 38], tooltipAnchor: [14, -24] });
  const userLocationIcon = L.divIcon({
    className: 'empty-class',
    html: `<div class="relative flex items-center justify-center">
             <div class="absolute w-8 h-8 bg-blue-500/30 rounded-full animate-user-pulse"></div>
             <div class="relative w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg"></div>
           </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
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

  const filteredPlaces = places.filter(place => {
    if (!userPos) return true;
    const dist = calculateDistance(userPos[0], userPos[1], place.lat, place.lon);
    return dist === null || dist <= 10;
  });

  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-[var(--bg-main)] font-['Outfit'] transition-colors duration-300 text-[var(--text-main)]">

      {/* ─── TOP SEARCH BAR ─── */}
      <div className="shrink-0 z-20 px-4 py-3 bg-[var(--bg-card)] border-b border-[var(--border-subtle)] backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <h2 className="text-base font-black uppercase tracking-tighter whitespace-nowrap hidden md:block">
            <span className="text-neon">Medi.</span>Map
          </h2>
          <div className="flex-1">
            <SearchBar
              city={city}
              setCity={setCity}
              speciality={speciality}
              setSpeciality={setSpeciality}
              handleSearch={handleSearch}
              onLocationDetected={(detectedCity, lat, lon) => {
                setCity(detectedCity);
                if (lat && lon) {
                  setGpsCoords([lat, lon]); // save so Apply Search reuses them
                  fetchNearbyByCoords(lat, lon, speciality);
                } else {
                  handleSearch(detectedCity);
                }
              }}
              citySuggestions={suggestions}
              onCityChange={handleCityChange}
              specSuggestions={specSuggestions}
              onSpecChange={handleSpecChange}
            />
          </div>
        </div>
        {/* Status / fallback message */}
        {(fallbackMessage || loading || isEmergencyLoading) && (
          <div className="max-w-7xl mx-auto mt-2">
            {isEmergencyLoading && (
              <div className="flex items-center gap-2 bg-red-500/10 text-red-400 text-[10px] font-black uppercase p-2 rounded-xl tracking-widest animate-pulse">
                <AlertCircle size={12} /> 🚨 SOS Active — Locating nearest hospital...
              </div>
            )}
            {!isEmergencyLoading && fallbackMessage && (
              <div className="bg-cyan-500/5 text-cyan-500 dark:text-cyan-400 text-[10px] font-black uppercase p-2.5 rounded-xl tracking-widest shadow-sm">
                {fallbackMessage}
              </div>
            )}
            {loading && !isEmergencyLoading && (
              <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest animate-pulse">
                Scanning hospitals...
              </div>
            )}
          </div>
        )}

        {/* Live Location Error Toast */}
        {liveError && (
          <div className="max-w-7xl mx-auto mt-2">
            <div className="flex items-center gap-2 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase p-2 rounded-xl border border-amber-500/20 tracking-widest">
              <AlertCircle size={12} /> {liveError}
            </div>
          </div>
        )}
      </div>

      {/* ─── BODY: Map Left + Results Right ─── */}
      <div className="flex flex-col md:flex-row flex-1 w-full overflow-hidden">

        {/* Map Container (Static Left / Top on Mobile) */}
        <div id="map-view" className="w-full md:w-[60%] lg:w-[65%] h-[35vh] md:h-full shrink-0 p-2 md:p-3 bg-[var(--bg-main)] flex flex-col z-10">
          <div className="flex-1 relative rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(0,210,255,0.08)] border-[8px] border-[var(--bg-card)] ring-1 ring-[var(--border-subtle)]">
            <MapContainer center={[20.5937, 78.9629]} zoom={5} className="h-full w-full" zoomControl={false}>
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
              <MapController 
                places={filteredPlaces} 
                selectedId={selectedId} 
                userPos={userPos} 
                routingTo={routingTo} 
                routeData={routeData} 
                livePos={livePos}
                followUser={followUser}
              />
              <MapButtons 
                handleLocate={handleLocate} 
                setRoutingTo={setRoutingTo} 
                userPos={userPos} 
                followUser={followUser}
                setFollowUser={setFollowUser}
              />
              {livePos && (
                <Marker position={livePos} icon={userLocationIcon}>
                  <Popup className="rounded-xl">
                    <div className="text-center p-1">
                      <p className="font-bold text-gray-900 text-xs">You are here</p>
                      <p className="text-[10px] text-gray-500 mt-1">Live Tracking Active</p>
                    </div>
                  </Popup>
                </Marker>
              )}
              {userPos && (!livePos || isSearchedCity) && (
                <Marker 
                  position={userPos} 
                  icon={isSearchedCity ? searchedLocationIcon : userLocationIcon}
                >
                  <Popup className="rounded-xl">
                    <div className="text-center p-1">
                      <p className={`font-bold ${isSearchedCity ? 'text-blue-600' : 'text-gray-900'} text-xs`}>
                        {isSearchedCity ? 'Searched Location' : 'You are here'}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-1">
                        {isSearchedCity ? city : 'Location Detected'}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )}
              {routeData.length > 0 && <Polyline positions={routeData} color="#3b82f6" weight={6} opacity={0.9} lineJoin="round" lineCap="round" />}
              {filteredPlaces.filter(place => !selectedId || place.id === selectedId).map(place => {
                const lat = parseFloat(place.lat); const lon = parseFloat(place.lon); if (!lat || !lon) return null;
                return (
                  <Marker key={place.id} position={[lat, lon]} icon={selectedId === place.id ? highlightedIcon : normalIcon} ref={r => { if (r) markerRefs.current[place.id] = r; }} eventHandlers={{ click: () => { setSelectedId(place.id); setRouteData([]); setRoutingTo(null); } }} />
                );
              })}
            </MapContainer>
          </div>
        </div>

        {/* Results List View (Scrollable Right / Bottom) */}
        <div className="w-full md:w-[40%] lg:w-[35%] h-full overflow-y-auto bg-[var(--bg-main)] p-2 sm:p-4 md:p-6 shrink-0 z-10 custom-scrollbar pb-24 md:pb-8">
          {filteredPlaces.length > 0 ? (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-end mb-2">
                <h3 className="text-lg font-black tracking-tight text-[var(--text-main)]">{filteredPlaces.length} Results Found</h3>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-[var(--bg-card)] py-1 px-3 rounded-full">Within 10 km</span>
              </div>
              {filteredPlaces.map((place, index) => (
                <div key={place.id || index} className="w-full relative group">
                  <ResultCard 
                    place={place} 
                    index={index} 
                    userPos={userPos}
                    isHovered={hoveredId === place.id || selectedId === place.id} 
                    onHoverStart={() => setHoveredId(place.id)} 
                    onHoverEnd={() => setHoveredId(null)} 
                    onClick={() => {
                      setSelectedId(place.id);
                      setRouteData([]);
                      setRoutingTo(null);
                      // Scroll to map strictly on mobile, on desktop map is static sticky
                      if (window.innerWidth < 768) {
                         document.getElementById('map-view')?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }} 
                  />
                </div>
              ))}
            </div>
          ) : !loading && (
            <div className="flex flex-col items-center justify-center h-full opacity-20 min-h-[300px]">
              <Activity size={56}/>
              <p className="mt-4 font-black uppercase text-xs tracking-[0.3em]">No Signal</p>
              <p className="text-[9px] text-center mt-2 tracking-wider">Search another area to view locations within 10km</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}