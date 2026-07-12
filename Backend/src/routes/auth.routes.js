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
import validate from "../middlewares/validate.js";
import { loginSchema, registerSchema } from "../validations/auth.validation.js";
import { loginLimiter, registerLimiter } from "../middlewares/rateLimiter.js";
import passport from "passport";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const router = express.Router();

router.post("/get-otp", verifyEmail);

router.post("/forgot-otp", forgotPassword);

router.post(
  "/register",
  registerLimiter,
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
  validate(registerSchema),
  registerUser,
);

router.post("/login", loginLimiter, validate(loginSchema), loginUser);

router.post("/refresh", refreshToken);

// ==========================================
// Google OAuth Routes
// ==========================================
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "http://localhost:5173/login?error=oauth_failed" }),
  async (req, res) => {
    try {
      const user = req.user;
      
      const accessToken = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "30m" }
      );
      
      const refreshToken = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
      );

      await User.updateOne({ _id: user._id }, { $set: { lastLogin: Date.now() } });

      // Pass tokens and user data via URL hash/search params to the frontend callback page
      const userData = encodeURIComponent(JSON.stringify({ uid: user.uid, username: user.username, role: user.role }));
      res.redirect(`http://localhost:5173/oauth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}&user=${userData}`);
    } catch (err) {
      console.error(err);
      res.redirect("http://localhost:5173/login?error=oauth_failed");
    }
  }
);

export default router;
