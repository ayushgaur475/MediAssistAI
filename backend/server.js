import express from "express";
import cors from "cors";
import mapRoutes from "./routes/mapRoutes.js";
import connectDB from "./config/db.js";
import hospitalRoutes from "./routes/hospitalRoutes.js";

const app = express();   // ✅ VERY IMPORTANT

connectDB();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/map", mapRoutes);
app.use("/api/hospitals", hospitalRoutes);

app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});