
import { useNavigate } from "react-router-dom";

export default function DoctorCard({ doctor }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md">
      <h2 className="text-xl font-semibold">{doctor.name}</h2>
      <p className="text-gray-500">{doctor.speciality}</p>
      <button
        onClick={() => navigate(`/appointment/${doctor._id}`)}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
      >
        Book Appointment
      </button>
    </div>
  );
}
