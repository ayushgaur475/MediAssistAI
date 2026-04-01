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
    
  const rating = (4 + Math.random()).toFixed(1);

  return (
    <div 
      className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm glass-card
        ${isHovered ? 'border-cyan-500 shadow-xl transform -translate-y-1 bg-white/20' : 'border-[var(--border-subtle)] bg-[var(--bg-card)]'}
      `}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onClick={onClick}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="w-[80%]">
          <div className="flex items-center gap-2 mb-1">
             <h3 className="font-bold text-[var(--text-main)] text-sm leading-tight tracking-tight">
               {place.hospital_name || 'Unnamed Hospital'}
             </h3>
             {place.source === 'database' ? (
               <span className="bg-cyan-500/10 text-cyan-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-cyan-500/20">Verified</span>
             ) : (
               <span className="bg-gray-500/10 text-gray-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-white/5">External</span>
             )}
          </div>
          {place.speciality && (
            <p className="text-[10px] font-black text-neon uppercase tracking-[0.2em]">{place.speciality}</p>
          )}
        </div>
        <span className="bg-cyan-500/10 text-cyan-400 font-black text-[10px] px-2.5 py-1 rounded-full border border-cyan-500/10 shrink-0">
          ★ {rating > 5 ? '5.0' : rating}
        </span>
      </div>

      <p className="text-[var(--text-muted)] text-[11px] mt-3 line-clamp-2 leading-relaxed font-medium">
        {place.address || place.display_name || "Region location unavailable"}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-between mt-5 gap-3 border-t border-[var(--border-subtle)] pt-4">
        <span className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
          {distance ? `${distance} km away` : "Calculating..."}
        </span>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            className="flex-1 sm:flex-none text-[var(--text-main)] bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:bg-white/10 font-black text-[9px] uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              if (window.handleNavigate) window.handleNavigate(place);
            }}
          >
            Route
          </button>
          <button 
            className="flex-1 sm:flex-none text-white bg-gradient-to-r from-cyan-400 to-purple-500 font-black text-[9px] uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all shadow-lg hover:scale-105 active:scale-95"
            onClick={(e) => {
              e.stopPropagation();
              alert("Booking Flow Started!");
            }}
          >
            Book
          </button>
        </div>
      </div>
    </div>
  );
}
