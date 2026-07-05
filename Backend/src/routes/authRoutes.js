import express from "express";
import { getOtp, registerUser } from "../controllers/authController.js";

const router = express.Router();

router.post("/get-otp", getOtp);

router.post("/register", registerUser);

// router.post("/login", login)

export default router;
