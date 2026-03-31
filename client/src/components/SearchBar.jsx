
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  return (
    <div className="flex justify-center">
      <input
        className="p-3 rounded-l-xl w-80 text-black"
        placeholder="Search speciality or doctor"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button
        onClick={() => navigate(`/search?q=${query}`)}
        className="bg-white text-blue-600 px-6 rounded-r-xl font-semibold"
      >
        Search
      </button>
    </div>
  );
}
