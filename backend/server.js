import "dotenv/config";
import express from "express";
import cors from "cors";
import mapRoutes from "./routes/mapRoutes.js";
import connectDB from "./config/db.js";
import hospitalRoutes from "./routes/hospitalRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

const app = express();   // ✅ VERY IMPORTANT




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

// ─── STARTUP ────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`\n\x1b[32m%s\x1b[0m`, `🚀 MEDI.ASSIST BACKEND IS ONLINE`);
    console.log(`\x1b[36m%s\x1b[0m`, `📍 URL: http://localhost:${PORT}`);
    console.log(`\x1b[90m%s\x1b[0m`, `--------------------------------------------------\n`);
    
    // Attempt Database Connection (Non-blocking)
    connectDB().catch(err => {
        // This is handled inside connectDB but added here for triple safety
        console.error("Critical DB Startup error:", err.message);
    });
});

// Explicit keep-alive for some environments
server.keepAliveTimeout = 70000; 
server.headersTimeout = 71000;
