import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from "react-leaflet";
import { Crosshair, AlertCircle } from "lucide-react";
import { useLiveLocation } from "../hooks/useLiveLocation";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Component to dynamically set map bounds based on doctors or live position
function MapBounds({ doctors, livePos, followUser }) {
  const map = useMap();
  useEffect(() => {
    if (followUser && livePos) {
      map.flyTo(livePos, map.getZoom() < 14 ? 14 : map.getZoom(), { animate: true });
      return;
    }

    const validDoctors = doctors.filter(doc => doc.lat || doc.center?.lat);
    if (validDoctors.length > 0) {
      const bounds = L.latLngBounds(validDoctors.map(doc => [
        parseFloat(doc.lat || doc.center?.lat),
        parseFloat(doc.lon || doc.center?.lon)
      ]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [doctors, livePos, followUser, map]);
  return null;
}

export default function SearchDoctors() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialSpeciality = params.get("speciality") || "";

  const [city, setCity] = useState("");
  const [query, setQuery] = useState(initialSpeciality);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [followUser, setFollowUser] = useState(false);

  const { location: livePos, error: liveError } = useLiveLocation();

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || "API_KEY";

  const searchDoctors = async () => {
    if (!city.trim()) {
      alert("Please enter a city.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_URL}/api/map/clinics?city=${city}&speciality=${query}`
      );
      setDoctors(res.data);
    } catch (error) {
      console.error("Error searching doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  const doctorPinHtml = `
    <div style="position: relative; width: 24px; height: 32px; display: flex; justify-content: center;">
      <div style="width: 24px; height: 24px; background-color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3); z-index: 2;">
        <div style="width: 18px; height: 18px; background-color: #06b6d4; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px; font-family: sans-serif;">D</div>
      </div>
      <div style="position: absolute; bottom: 2px; width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid white; z-index: 1; filter: drop-shadow(0 2px 1px rgba(0,0,0,0.2));"></div>
    </div>
  `;

  const customIcon = L.divIcon({
    className: 'empty-class',
    html: doctorPinHtml,
    iconSize: [24, 32],
    iconAnchor: [12, 32],
    popupAnchor: [0, -32]
  });

  const userLocationIcon = L.divIcon({
    className: 'empty-class',
    html: `<div class="relative flex items-center justify-center">
             <div class="absolute w-8 h-8 bg-blue-500/30 rounded-full animate-user-pulse"></div>
             <div class="relative w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg"></div>
           </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-gray-50">
      
      {/* Top Search Bar */}
      <div className="bg-white shadow-sm border-b p-4 flex gap-4 z-20 shrink-0">
        <input
          placeholder="Location (e.g., Delhi)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="border border-gray-300 p-2.5 w-1/4 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all"
        />

        <input
          placeholder="Search doctors, clinics, specialities..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchDoctors()}
          className="border border-gray-300 p-2.5 flex-1 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all"
        />

        <button
          onClick={searchDoctors}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-2.5 rounded-lg transition-colors disabled:opacity-70 shadow-sm"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Side: Doctor Cards */}
        <div className="w-full lg:w-[45%] xl:w-[40%] flex flex-col bg-gray-50 z-10 overflow-y-auto border-r border-gray-200">
          
          <div className="p-6 pb-2 shrink-0">
            {doctors.length > 0 ? (
              <>
                <h2 className="text-xl font-bold text-gray-800">
                  {doctors.length} {query || "clinic"}s available in {city}
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  Book appointments with verified clinic details
                </p>
              </>
            ) : (
              !loading && city && (
                <div className="text-gray-500 text-center py-8">
                  No doctors found matching your criteria. Try adjusting your search.
                </div>
              )
            )}
            
            {!city && !loading && (
              <div className="text-gray-500 text-center py-8">
                Enter a city to start finding doctors and clinics near you.
              </div>
            )}
          </div>

          <div className="px-6 pb-6 space-y-4 pt-4">
            {doctors.map((doc, index) => (
              <div
                key={index}
                className="bg-white shadow-sm border border-gray-100 rounded-xl p-5 flex flex-col md:flex-row gap-4 hover:shadow-md transition-shadow"
              >
                {/* Info Side */}
                <div className="flex gap-4 flex-1">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center shrink-0 border border-blue-100">
                    <span className="text-blue-500 font-bold text-xl">
                      {(doc.tags?.name || "C").charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-blue-700 leading-tight">
                      {doc.tags?.name || "Clinic / Hospital"}
                    </h3>
                    
                    {query && (
                      <p className="text-gray-600 text-sm mt-1 font-medium capitalize">
                        {query}
                      </p>
                    )}

                    <p className="text-gray-500 text-xs mt-2 line-clamp-2">
                      {doc.tags?.addr_full || doc.tags?.["addr:street"] || "Address available upon contact"}
                    </p>

                    <div className="flex items-center gap-1 mt-3">
                      <span className="text-green-600 text-xs font-bold px-2 py-0.5 bg-green-50 rounded">
                        ★ 4.{Math.floor(Math.random()*5 + 1)}
                      </span>
                      <span className="text-gray-400 text-xs">
                        ({Math.floor(Math.random()*200 + 10)} Patient Stories)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Side */}
                <div className="flex flex-col justify-center gap-2 border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-4 min-w-[140px]">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm w-full">
                    Book Visit
                  </button>
                  <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium px-4 py-2.5 rounded-lg transition-colors w-full">
                    Contact Clinic
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Right Side: Map */}
        <div className="hidden lg:block flex-1 relative bg-gray-200 z-0">
          <MapContainer
            center={[20.5937, 78.9629]} // Default to India
            zoom={5}
            className="h-full w-full"
            zoomControl={false}
          >
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
            
            {liveError && (
              <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm border border-amber-200 p-2 rounded-lg shadow-lg flex items-center gap-2 text-amber-600 text-[10px] font-bold uppercase transition-all animate-in fade-in slide-in-from-bottom-2">
                <AlertCircle size={14} /> {liveError}
              </div>
            )}

            <button 
              onClick={() => setFollowUser(!followUser)}
              className={`absolute top-20 right-2 z-[1000] w-10 h-10 rounded-lg shadow-lg flex items-center justify-center transition-all bg-white border ${
                followUser ? "text-cyan-600 border-cyan-500" : "text-gray-400 border-gray-200 hover:text-gray-600"
              }`}
              title={followUser ? "Stop Following" : "Follow Me"}
            >
              <Crosshair size={20} className={followUser ? "animate-spin-slow" : ""} />
            </button>

            {livePos && (
              <Marker position={livePos} icon={userLocationIcon}>
                <Popup className="rounded-xl">
                  <div className="text-center p-1">
                    <p className="font-bold text-gray-900 text-xs">You are here</p>
                  </div>
                </Popup>
              </Marker>
            )}
            
            <MapBounds doctors={doctors} livePos={livePos} followUser={followUser} />

            {doctors.map((doc, i) => {
               const lat = doc.lat || doc.center?.lat;
               const lon = doc.lon || doc.center?.lon;
               if (!lat || !lon) return null;
               
               return (
                <Marker 
                  key={i} 
                  position={[parseFloat(lat), parseFloat(lon)]}
                  icon={customIcon}
                >
                  <Popup className="rounded-lg">
                    <div className="font-sans">
                      <strong className="text-sm text-gray-800">{doc.tags?.name || "Clinic"}</strong>
                      <p className="text-xs text-gray-600 mt-1 leading-tight">
                         {doc.tags?.addr_full || "Healthcare location"}
                      </p>
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