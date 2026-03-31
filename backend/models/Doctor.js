const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
  name: String,
  specialization: String,
  experience: Number,
  clinic: String,
  city: String,
  availableSlots: [
    {
      date: String,
      time: String,
      isBooked: { type: Boolean, default: false }
    }
  ]
});

module.exports = mongoose.model("Doctor", doctorSchema);