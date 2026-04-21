import express from "express";
import { chatWithAiDoctor, checkAiStatus } from "../controllers/aiController.js";

const router = express.Router();

router.post("/chat", chatWithAiDoctor);
router.get("/status", checkAiStatus);

export default router;
