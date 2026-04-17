import React from 'react';

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
      className={`p-4 md:p-6 rounded-3xl border transition-all cursor-pointer bg-[var(--bg-card)] group flex flex-col gap-4
        ${isHovered ? 'border-[#22d3ee]/50 shadow-[0_10px_40px_rgba(0,0,0,0.08)] scale-[1.01] bg-[var(--bg-card-hover)]' : 'border-[var(--border-subtle)] shadow-sm'}
      `}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onClick={onClick}
    >
      {/* Title Section */}
      <div className="flex flex-col gap-2">
        <h3 className="font-black text-[#22d3ee] text-base md:text-lg lg:text-xl leading-tight tracking-tight">
          {index !== undefined ? `${index + 1}. ` : ""}{place.hospital_name || place.name || 'Unnamed Facility'}
        </h3>
        
        <div className="flex items-center gap-3">
          <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-lg px-3 py-1 flex items-center gap-2">
             <span className="text-[var(--text-main)] font-bold text-xs">{distance || "?.?"} km</span>
             <span className="text-[var(--text-muted)] text-xs">•</span>
             <span className="text-[var(--text-main)] font-bold text-xs">{distance ? Math.round(distance * 1.5) : "??"} min</span>
          </div>
          {displaySpeciality && (
             <span className="text-[var(--text-muted)] font-bold text-[10px] tracking-widest uppercase">{displaySpeciality}</span>
          )}
        </div>
      </div>

      {/* Address Details */}
      <div className="flex flex-col gap-2.5 mt-2">
        <div className="flex gap-2 text-sm">
          <span className="text-[var(--text-main)] font-black whitespace-nowrap">Address:</span>
          <span className="text-[var(--text-muted)] font-medium leading-relaxed">{addrInfo.street}</span>
        </div>
        <div className="flex gap-2 text-sm">
          <span className="text-[var(--text-main)] font-black whitespace-nowrap">City:</span>
          <span className="text-[var(--text-muted)] font-medium">{addrInfo.city}</span>
        </div>
        <div className="flex gap-2 text-sm">
          <span className="text-[var(--text-main)] font-black whitespace-nowrap">State:</span>
          <span className="text-[var(--text-muted)] font-medium">{addrInfo.state}</span>
        </div>
        <div className="flex gap-2 text-sm">
          <span className="text-[var(--text-main)] font-black whitespace-nowrap">Pincode:</span>
          <span className="text-[var(--text-muted)] font-medium">{addrInfo.pincode}</span>
        </div>
      </div>

      {/* Action Button */}
      <button 
        className="mt-4 w-full py-3 md:py-4 rounded-2xl border-2 border-[#22d3ee] text-[#22d3ee] font-black text-lg hover:bg-[#22d3ee] hover:text-white transition-all active:scale-[0.98] shadow-lg shadow-[#22d3ee]/10"
        onClick={(e) => {
          e.stopPropagation();
          if (window.handleNavigate) window.handleNavigate(place);
        }}
      >
        Navigate
      </button>
    </div>
  );
}
