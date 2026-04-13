import "dotenv/config";
import express from "express";
import cors from "cors";
import mapRoutes from "./routes/mapRoutes.js";
import connectDB from "./config/db.js";
import hospitalRoutes from "./routes/hospitalRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

const app = express();   // ✅ VERY IMPORTANT

connectDB();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Routes
app.use("/api/map", mapRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/ai-doctor", aiRoutes);

app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
