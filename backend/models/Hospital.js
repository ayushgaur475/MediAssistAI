import mongoose from "mongoose";

const hospitalSchema = new mongoose.Schema({
  Hospital_Name: { type: String, required: true },
  Location: { type: String },
  Location_Coordinates: { type: String },
  District: { type: String, index: true },
  State: { type: String },
  Discipline_Systems_of_Medicine: { type: String, index: true },
  Address_Original_First_Line: { type: String }
}, { timestamps: false, collection: 'hospitals' });

const Hospital = mongoose.model("Hospital", hospitalSchema);

export default Hospital;
