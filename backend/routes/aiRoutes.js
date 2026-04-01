import express from "express";
import { chatWithAiDoctor } from "../controllers/aiController.js";

const router = express.Router();

router.post("/chat", chatWithAiDoctor);

export default router;
