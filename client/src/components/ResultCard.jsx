import React from 'react';
import { MapPin, Navigation } from 'lucide-react';

export default function ResultCard({ place, index, userPos, isHovered, onHoverStart, onHoverEnd, onClick }) {
  // Calculate real distance using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1);
  };

  const distance = userPos 
    ? calculateDistance(userPos[0], userPos[1], place.lat, place.lon)
    : null;

  const displaySpeciality = place.speciality || place.type || place.category;

  // Address Parsing Logic
  const parseAddress = (addrStr) => {
    if (!addrStr) return { street: "N/A", city: "N/A", state: "N/A", pincode: "N/A" };
    
    const parts = addrStr.split(',').map(p => p.trim());
    const pinRegex = /\b\d{6}\b/;
    let pincode = "N/A";
    let state = "N/A";
    let city = place.district || place.city || "N/A";
    
    // Find Pincode
    const pinMatch = addrStr.match(pinRegex);
    if (pinMatch) pincode = pinMatch[0];

    // Common Indian States
    const states = ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi"];
    
    state = states.find(s => addrStr.toLowerCase().includes(s.toLowerCase())) || "N/A";

    // If city is N/A but we have parts, try to guess city
    if (city === "N/A" && parts.length > 1) {
       city = parts[parts.length - 3] || parts[parts.length - 2] || "N/A";
    }

    const street = parts[0] || "N/A";

    return { street, city, state, pincode };
  };

  const addrInfo = parseAddress(place.address || place.display_name);

  return (
    <div 
      className={`p-5 md:p-7 rounded-[2rem] border transition-all cursor-pointer bg-white/50 dark:bg-white/5 backdrop-blur-md group flex flex-col gap-5
        ${isHovered ? 'border-cyan-500/50 shadow-[0_20px_50px_rgba(0,0,0,0.1)] scale-[1.02] bg-white dark:bg-white/10' : 'border-gray-200 dark:border-white/5 shadow-sm'}
      `}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onClick={onClick}
    >
      {/* Title Section */}
      <div className="flex flex-col gap-3">
        <h3 className="font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 text-lg md:text-xl lg:text-2xl leading-tight tracking-tighter">
          {index !== undefined ? `${index + 1}. ` : ""}{place.hospital_name || place.name || 'Unnamed Facility'}
        </h3>
        
        <div className="flex items-center gap-3">
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-inner">
             <span className="text-cyan-600 dark:text-cyan-400 font-black text-xs">{distance || "?.?"} km</span>
             <div className="w-1 h-1 bg-cyan-400/40 rounded-full" />
             <span className="text-gray-600 dark:text-gray-300 font-bold text-xs">{distance ? Math.round(distance * 1.5) : "??"} min</span>
          </div>
          {displaySpeciality && (
             <span className="text-gray-400 dark:text-gray-500 font-black text-[10px] tracking-[0.2em] uppercase">{displaySpeciality}</span>
          )}
        </div>
      </div>

      {/* Address Details */}
      <div className="flex flex-col gap-3 mt-1 pb-4 border-b border-gray-100 dark:border-white/5">
        <div className="flex items-start gap-3 text-xs md:text-sm">
          <MapPin size={16} className="text-purple-500 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="text-gray-800 dark:text-gray-100 font-bold leading-relaxed">{addrInfo.street}</span>
            <span className="text-gray-500 dark:text-gray-400 font-medium uppercase tracking-widest text-[9px] md:text-[10px]">
              {addrInfo.city}, {addrInfo.state} - {addrInfo.pincode}
            </span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button 
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-black text-sm md:text-base uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-2 group/btn"
        onClick={(e) => {
          e.stopPropagation();
          if (window.handleNavigate) window.handleNavigate(place);
        }}
      >
        <Navigation size={18} className="group-hover/btn:animate-bounce" />
        Navigate Now
      </button>
    </div>
  );
}
