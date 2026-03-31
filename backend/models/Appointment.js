const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  doctorId: String,
  patientName: String,
  date: String,
  time: String
});

module.exports = mongoose.model("Appointment", appointmentSchema);