import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Search from "./pages/Search";
import DoctorList from "./pages/DoctorList";
import MapPage from "./pages/MapPage";
import Appointment from "./pages/Appointment";

export default function App() {
  return (
    <div className="min-h-screen transition-colors duration-300">
      <Navbar />
      <div className="pt-24 min-h-screen overflow-x-hidden">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/doctors" element={<DoctorList />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/appointment/:id" element={<Appointment />} />
        </Routes>
      </div>
    </div>
  );
}