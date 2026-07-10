import express from "express";
import multer from "multer";
import {
  verifyEmail,
  forgotPassword,
  registerUser,
  loginUser,
  refreshToken,
} from "../controllers/auth.controller.js";
import upload from "../middlewares/uploader.js";

const router = express.Router();

router.post("/get-otp", verifyEmail);

router.post("/forgot-otp", forgotPassword);

router.post(
  "/register",
  (req, res, next) => {
    upload.single("profile")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }
      next();
    });
  },
  registerUser,
);

router.post("/login", loginUser);

router.post("/refresh", refreshToken);

export default router;
