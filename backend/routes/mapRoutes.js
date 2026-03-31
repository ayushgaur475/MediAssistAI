import express from "express";
import axios from "axios";

const router = express.Router();

/* ===============================
   CLINICS ROUTE
================================ */
router.get("/clinics", async (req, res) => {
  try {
    const { city, speciality = "" } = req.query;

    if (!city) {
      return res.status(400).json({ error: "City required" });
    }

    const specialityLower = speciality.toLowerCase();

    // Get city coordinates
    const geoRes = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: city,
          format: "json",
          limit: 1,
          countrycodes: "in"
        },
        headers: {
          "User-Agent": "MediAssistAI-App"
        }
      }
    );

    if (!geoRes.data.length) {
      return res.status(404).json({ error: "City not found" });
    }

    const lat = geoRes.data[0].lat;
    const lon = geoRes.data[0].lon;

    let query = `
      [out:json][timeout:15];
      (
        node["amenity"="clinic"](around:8000,${lat},${lon});
        node["amenity"="hospital"](around:8000,${lat},${lon});
      );
      out center 20;
    `;

    if (specialityLower === "dentist") {
      query = `
        [out:json][timeout:15];
        (
          node["amenity"="dentist"](around:8000,${lat},${lon});
        );
        out center 20;
      `;
    }

    const overpassRes = await axios.post(
      "https://overpass-api.de/api/interpreter",
      query,
      {
        headers: {
          "Content-Type": "text/plain",
          "User-Agent": "MediAssistAI-App"
        },
        timeout: 30000
      }
    );

    res.json(overpassRes.data.elements || []);

  } catch (err) {
    console.error("Clinics Error:", err.message);
    res.status(500).json({ error: err.message || "Failed to fetch clinics" });
  }
});

/* ===============================
   LABS ROUTE
================================ */
router.get("/labs", async (req, res) => {
  try {
    const { city } = req.query;

    if (!city) {
      return res.status(400).json({ error: "City required" });
    }

    // 1️⃣ Get city coordinates
    const geoRes = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: city,
          format: "json",
          limit: 1,
          countrycodes: "in"
        },
        headers: {
          "User-Agent": "MediAssistAI-App"
        }
      }
    );

    if (!geoRes.data.length) {
      return res.json([]);
    }

    const lat = geoRes.data[0].lat;
    const lon = geoRes.data[0].lon;

    // 2️⃣ Fetch laboratories + diagnostic centres
    const query = `
      [out:json][timeout:20];
      (
        node["healthcare"="laboratory"](around:15000,${lat},${lon});
        node["amenity"="clinic"](around:15000,${lat},${lon});
        node["amenity"="hospital"](around:15000,${lat},${lon});
      );
      out center;
    `;

    const overpassRes = await axios.post(
      "https://overpass-api.de/api/interpreter",
      query,
      { headers: { "Content-Type": "text/plain" } }
    );

    res.json(overpassRes.data.elements || []);

  } catch (err) {
    console.error("Labs Error:", err.message);
    res.status(500).json({ error: "Failed to fetch labs" });
  }
});

export default router;