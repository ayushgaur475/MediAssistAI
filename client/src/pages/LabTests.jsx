import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Component to dynamically set map bounds
function MapBounds({ labs }) {
  const map = useMap();
  useEffect(() => {
    if (labs.length > 0) {
      const bounds = L.latLngBounds(labs.map(l => [l.lat, l.lon]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [labs, map]);
  return null;
}

export default function LabTests() {
  const [city, setCity] = useState("");
  const [labs, setLabs] = useState([]);
  const [mapCenter, setMapCenter] = useState([28.6139, 77.209]); // Default Delhi
  const [loading, setLoading] = useState(false);

  const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || "API_KEY";

  const searchLabs = async () => {
    if (!city.trim()) {
      alert("Please enter a city name");
      return;
    }

    setLoading(true);

    try {
      // First, get coordinates for the city
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&countrycodes=in&limit=1`;

      const geoRes = await fetch(geocodeUrl);
      const geoData = await geoRes.json();

      if (geoData.length === 0) {
        alert("City not found. Please try again.");
        setLoading(false);
        return;
      }

      const { lat, lon, boundingbox } = geoData[0];
      setMapCenter([parseFloat(lat), parseFloat(lon)]);

      // Use Overpass API to search for pathology labs/medical labs
      const [south, north, west, east] = boundingbox;
      const overpassQuery = `
        [bbox:${south},${west},${north},${east}];
        (
          node["amenity"="pharmacy"](${south},${west},${north},${east});
          node["amenity"="laboratory"](${south},${west},${north},${east});
          node["healthcare"="laboratory"](${south},${west},${north},${east});
          node["shop"="medical"](${south},${west},${north},${east});
          way["amenity"="pharmacy"](${south},${west},${north},${east});
          way["amenity"="laboratory"](${south},${west},${north},${east});
          way["healthcare"="laboratory"](${south},${west},${north},${east});
          relation["amenity"="pharmacy"](${south},${west},${north},${east});
          relation["amenity"="laboratory"](${south},${west},${north},${east});
        );
        out center;
      `;

      const overpassUrl = "https://overpass-api.de/api/interpreter";
      const labRes = await fetch(overpassUrl, {
        method: "POST",
        body: overpassQuery
      });

      const labData = await labRes.json();

      // Convert Overpass data format to our format
      const formattedLabs = labData.elements.map((element, i) => ({
        id: element.id,
        lat: element.center ? element.center.lat : element.lat,
        lon: element.center ? element.center.lon : element.lon,
        name: element.tags?.name || `Lab ${i + 1}`,
        display_name: element.tags?.name || `Medical Laboratory ${i + 1}`,
        type: element.tags?.["healthcare:speciality"] || "Laboratory"
      }));

      setLabs(formattedLabs || []);
      
      if (formattedLabs.length === 0) {
        alert("No pathology labs found in this city. Try another location.");
      }
    } catch (error) {
      console.error("Error searching labs:", error);
      alert("Error searching for labs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      searchLabs();
    }
  };

  const customIcon = L.icon({
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-gray-50">
      
      {/* Left Search Panel */}
      <div className="w-[350px] flex flex-col bg-white shadow-lg z-10 overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-1">
            Pathology Labs
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Find certified labs in your city
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 uppercase tracking-wider">
                City Name
              </label>
              <input
                placeholder="e.g., Delhi, Mumbai, Bangalore"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
              />
            </div>

            <button 
              onClick={searchLabs}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors shadow-sm disabled:opacity-70 mt-2 text-sm"
            >
              {loading ? "Searching..." : "Search Labs"}
            </button>
          </div>
        </div>

        {/* RESULTS */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {labs.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase px-2">
                Found {labs.length} labs
              </p>
              {labs.map((lab, i) => (
                <div 
                  key={i}
                  className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <h3 className="font-semibold text-gray-800 text-sm mb-1">
                    {lab.name || lab.display_name.split(',')[0]}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                    {lab.display_name}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            !loading && (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm px-6 text-center">
                Search for a city to find pathology labs near you.
              </div>
            )
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative z-0">
        <MapContainer
          center={mapCenter}
          zoom={13}
          className="h-full w-full"
          zoomControl={false}
        >
          <TileLayer 
            url={`https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`}
            attribution='&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {labs.length > 0 && <MapBounds labs={labs} />}

          {labs.map((lab, i) => (
            <Marker 
              key={i} 
              position={[parseFloat(lab.lat), parseFloat(lab.lon)]}
              icon={customIcon}
            >
              <Popup className="rounded-lg">
                <div className="font-sans">
                  <strong className="text-sm text-gray-800">{lab.name || lab.display_name.split(',')[0]}</strong>
                  <p className="text-xs text-gray-600 mt-1 leading-tight">
                    {lab.display_name}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}