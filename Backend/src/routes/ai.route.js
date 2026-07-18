import express from "express";
import { getCropAdvice } from "../controllers/ai.controller.js";
import verifyToken from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/advise", verifyToken, getCropAdvice);

export default router;
