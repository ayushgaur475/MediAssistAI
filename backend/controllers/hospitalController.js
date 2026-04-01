import Hospital from "../models/Hospital.js";
import axios from "axios";

/**
 * Autocomplete for Districts
 */
export const getDistricts = async (req, res) => {
  try {
    const districts = await Hospital.distinct("District");
    return res.status(200).json({ 
      data: districts.filter(d => typeof d === 'string' && d !== "0" && d !== "NA") 
    });
  } catch (error) {
    console.error("Error fetching districts:", error);
    return res.status(500).json({ error: "Failed to fetch districts" });
  }
};
/**
 * Autocomplete for Specialities (with string splitting)
 */
export const getSpecialities = async (req, res) => {
  try {
    const rawSpecs = await Hospital.distinct("Discipline_Systems_of_Medicine");
    
    // Set to store unique cleaned specialities
    const uniqueSpecs = new Set();
    
    rawSpecs.forEach(s => {
      if (typeof s === 'string' && s.length > 2) {
        // Split by comma or slash to get individual disciplines
        const parts = s.split(/[,\/]/);
        parts.forEach(p => {
          const trimmed = p.trim();
          if (trimmed.length > 2 && !trimmed.includes("NA") && trimmed !== "0") {
            // Capitalize first letter for consistency
            const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
            uniqueSpecs.add(formatted);
          }
        });
      }
    });

    return res.status(200).json({ 
      data: Array.from(uniqueSpecs).sort()
    });
  } catch (error) {
    console.error("Error fetching specialities:", error);
    return res.status(500).json({ error: "Failed to fetch specialities" });
  }
};

/**
 * Unified Search Logic
 * Tier 1: MongoDB
 * Tier 2: OSM Nominatim
 */
export const searchHospitals = async (req, res) => {
  try {
    const { city, speciality } = req.query;
    
    if (!city || city.trim() === "") {
      return res.status(400).json({ error: "City parameter is required." });
    }

    // --- Tier 1: Local Dataset Search ---
    const cleanedCity = city.trim();
    const cityRegex = new RegExp(cleanedCity, "i"); // Relaxed regex
    let queryFilter = { District: cityRegex };
    
    if (speciality && speciality.trim() !== "") {
      const specRegex = new RegExp(speciality.trim(), "i");
      queryFilter.Discipline_Systems_of_Medicine = specRegex;
    }

    console.log(`[Tier 1 Search] City: "${cleanedCity}", Spec: "${speciality || "NONE"}"`);
    
    // Get City Center Coordinates for "User Location Proxy"
    let cityCoords = null;
    try {
      const cityLookUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanedCity)}&countrycodes=in&limit=1`;
      const cityLookRes = await axios.get(cityLookUrl, {
        headers: { 'User-Agent': 'MediAsisstAI-App' },
        timeout: 3000
      });
      if (cityLookRes.data && cityLookRes.data[0]) {
        cityCoords = {
          lat: parseFloat(cityLookRes.data[0].lat),
          lon: parseFloat(cityLookRes.data[0].lon)
        };
      }
    } catch (e) { console.error("City center lookup failed", e.message); }

    const dbResults = await Hospital.find(queryFilter).limit(100).lean();

    if (dbResults.length > 0) {
      console.log(`[Tier 1] Found ${dbResults.length} records in DB.`);
      const mapped = dbResults.map(h => {
        let lat = 0, lon = 0;
        if (h.Location_Coordinates && h.Location_Coordinates !== "0, 0" && h.Location_Coordinates !== "NA") {
          const parts = h.Location_Coordinates.split(",");
          if (parts.length === 2) {
            lat = parseFloat(parts[0].trim());
            lon = parseFloat(parts[1].trim());
          }
        }
        return {
          id: h._id.toString(),
          hospital_name: h.Hospital_Name,
          address: h.Address_Original_First_Line || h.Location,
          district: h.District,
          speciality: h.Discipline_Systems_of_Medicine || "General Healthcare",
          lat, lon,
          source: 'database'
        };
      });
      return res.status(200).json({ source: 'database', count: mapped.length, cityCoords, data: mapped });
    }

    // --- Tier 2: OSM Fallback ---
    console.log(`[Tier 2] DB empty for "${cleanedCity}". Querying OSM...`);
    
    const osmQuery = speciality ? `${speciality} in ${cleanedCity}` : `hospital in ${cleanedCity}`;
    const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(osmQuery)}&countrycodes=in&limit=20`;
    
    try {
      const osmRes = await axios.get(osmUrl, {
        headers: { 'User-Agent': 'MediAsisstAI-App' },
        timeout: 5000 
      });

      const osmData = osmRes.data || [];
      const mappedOSM = osmData.map((item, idx) => ({
        id: `osm_${item.place_id || idx}`,
        hospital_name: item.display_name.split(',')[0],
        address: item.display_name,
        district: cleanedCity,
        speciality: (speciality || item.type || "Healthcare").toUpperCase(),
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        source: 'osm'
      }));

      return res.status(200).json({
        source: mappedOSM.length > 0 ? 'osm' : 'none',
        count: mappedOSM.length,
        cityCoords,
        data: mappedOSM
      });
      
    } catch (osmError) {
      console.error("OSM API Error:", osmError.message);
      return res.status(200).json({ 
        source: 'error', 
        count: 0, 
        data: [], 
        message: "External search service is temporarily busy. Please try again in a moment."
      });
    }

  } catch (error) {
    console.error("Search API Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
