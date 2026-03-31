
import { useParams } from "react-router-dom";

export default function Appointment() {
  const { id } = useParams();

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white p-8 rounded-2xl shadow-md">
      <h2 className="text-2xl font-bold mb-6">Book Appointment</h2>
      <input className="w-full p-3 border rounded-lg mb-4" placeholder="Your Name" />
      <input className="w-full p-3 border rounded-lg mb-4" type="date" />
      <input className="w-full p-3 border rounded-lg mb-4" type="time" />
      <button className="w-full bg-blue-600 text-white py-3 rounded-lg">
        Confirm Booking
      </button>
    </div>
  );
}
