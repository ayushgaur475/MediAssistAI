const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");

exports.bookAppointment = async (req, res) => {
  const { doctorId, patientName, date, time } = req.body;

  const doctor = await Doctor.findById(doctorId);

  const slot = doctor.availableSlots.find(
    s => s.date === date && s.time === time && !s.isBooked
  );

  if (!slot) {
    return res.status(400).json({ message: "Slot not available" });
  }

  slot.isBooked = true;
  await doctor.save();

  const appointment = new Appointment({
    doctorId,
    patientName,
    date,
    time
  });

  await appointment.save();

  res.json({ message: "Appointment Booked Successfully" });
};