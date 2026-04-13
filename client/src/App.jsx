import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import MapPage from "./pages/MapPage";
import LabTests from "./pages/LabTests";
import Appointment from "./pages/Appointment";
import AiDoctor from "./pages/AiDoctor";
import ZenZone from "./pages/ZenZone";
import CaretakerLounge from "./pages/CaretakerLounge";



export default function App() {
  return (
    <div className="min-h-screen transition-colors duration-300">
      <Navbar />
      <div className="pt-24 min-h-screen overflow-x-hidden">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/labs" element={<LabTests />} />
          <Route path="/appointment/:id" element={<Appointment />} />
          <Route path="/ai-doctor" element={<AiDoctor />} />
          <Route path="/zen-zone" element={<ZenZone />} />
          <Route path="/companion-lounge" element={<CaretakerLounge />} />


        </Routes>
      </div>
    </div>
  );
}