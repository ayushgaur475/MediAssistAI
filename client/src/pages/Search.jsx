import { useState, useEffect } from "react";   // ✅ added useEffect
import axios from "axios";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useMap } from "react-leaflet";

function ChangeMapView({ center }) {
  const map = useMap();
  map.setView(center, 13);
  return null;
}

export default function Search() {

  // 🔴 Red clinic marker
  const redIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  });

  // 🔵 Blue user marker
  const blueIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  });

  const [city, setCity] = useState("");
  const [clinics, setClinics] = useState([]);
  const [center, setCenter] = useState([28.6139, 77.2090]); // default Delhi
  const [userLocation, setUserLocation] = useState(null);

  // 📍 Get user location once
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLocation([
          position.coords.latitude,
          position.coords.longitude
        ]);
      });
    }
  }, []);

  // 🔎 Search function
  const searchClinics = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/map/clinics?city=${city}`
      );

      setClinics(res.data);

      if (res.data.length > 0) {
        const first = res.data[0];
        const lat = first.lat || first.center?.lat;
        const lon = first.lon || first.center?.lon;
        setCenter([lat, lon]);
      }

    } catch (error) {
      console.error("Search error:", error);
    }
  };
  

  return (
    <div className="h-screen flex">

      {/* LEFT SIDE */}
      <div className="w-1/3 p-4 bg-white overflow-y-auto">
        <div className="mb-4">
          <input
            placeholder="Enter city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="border p-2 w-full mb-2"
          />

          <button
            onClick={searchClinics}
            className="bg-blue-600 text-white px-4 py-2 rounded w-full"
          >
            Search
          </button>
        </div>

        {clinics.map((c, index) => (
          <div
            key={index}
            className="p-3 shadow rounded mb-3"
          >
            <h3 className="font-semibold">
              {c.tags?.name || "Unnamed Clinic"}
            </h3>
          </div>
        ))}
      </div>

      {/* RIGHT SIDE MAP */}
      <div className="w-2/3">
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <ChangeMapView center={center} />
          <TileLayer
            url="https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=q1ROmbcrXnbCUYumAVaW"
            attribution="&copy; MapTiler & OpenStreetMap contributors"
          />

          {/* 🔵 User Marker */}
          {userLocation && (
            <Marker position={userLocation} icon={blueIcon}>
              <Popup>Your Location</Popup>
            </Marker>
          )}

          {/* 🔴 Clinic Markers */}
{clinics.map((c, index) => {
  const lat = c.lat || c.center?.lat;
  const lon = c.lon || c.center?.lon;

  if (!lat || !lon) return null;

  return (
    <Marker key={index} position={[lat, lon]} icon={redIcon}>
      <Tooltip permanent direction="top" offset={[0, -30]}>
        {c.tags?.name || "Clinic"}
      </Tooltip>
      <Popup>
        {c.tags?.name || "Clinic"}
      </Popup>
    </Marker>
  );
})}

        </MapContainer>
      </div>
    </div>
  );
}