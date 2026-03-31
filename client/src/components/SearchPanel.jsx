import React from 'react';

export default function SearchPanel({ mode, city, speciality, setCity, setSpeciality, onSearch, loading }) {
  const getPlaceholder = () => {
    switch(mode) {
      case "doctor": return "e.g., Dentist, Cardiologist";
      case "surgery": return "e.g., Knee Replacement, Cataract";
      default: return "";
    }
  };

  return (
    <div className="bg-white p-6 border-b border-gray-100 flex flex-col gap-4 shadow-sm z-10 shrink-0">
      <h2 className="text-xl font-bold text-gray-800">
        {mode === "doctor" ? "Find Doctors & Clinics" : mode === "lab" ? "Find Pathology Labs" : "Find Surgery Centers"}
      </h2>
      
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Location</label>
          <input
            type="text"
            placeholder="e.g. Mumbai, Delhi"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && city.trim() && onSearch()}
            className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-shadow"
          />
        </div>

        {mode !== "lab" && (
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Speciality</label>
            <input
              type="text"
              placeholder={getPlaceholder()}
              value={speciality}
              onChange={(e) => setSpeciality(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && city.trim() && onSearch()}
              className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-shadow"
            />
          </div>
        )}

        <button
          onClick={onSearch}
          disabled={loading || !city.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow flex justify-center items-center mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="4" stroke="currentColor" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8v8H4z" fill="currentColor" className="opacity-75" />
              </svg>
              Searching...
            </span>
          ) : "Search"}
        </button>
      </div>
    </div>
  );
}
