import express from "express";
import { searchHospitals, getDistricts, getSpecialities } from "../controllers/hospitalController.js";

const router = express.Router();

router.get("/search", searchHospitals);
router.get("/districts", getDistricts);
router.get("/specialities", getSpecialities);

export default router;
