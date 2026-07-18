import express from "express";
import multer from "multer";
import {
  verifyEmail,
  registerUser,
  forgotPassOtp,
  forgotPassVerify,
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

router.post("/forgot-otp", forgotPassOtp);

router.post("/forgot-password", forgotPassVerify);

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

router.get("/google", (req, res, next) => {
  const role = ["FARMER_GROUP", "COLLECTIVE"].includes(req.query.role)
    ? req.query.role
    : "FARMER_GROUP";
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    state: role,
  })(req, res, next);
});

const FRONTEND = process.env.FRONTEND_URL || "http://localhost:5173";

router.get(
  "/google/callback",
  (req, res, next) => {
    passport.authenticate("google", {
      session: false,
      failWithError: true, // pass the error to next() instead of redirecting
    })(req, res, (err) => {
      if (err) {
        const msg = encodeURIComponent(
          err?.message || "Google sign-in failed. Please try again.",
        );
        return res.redirect(
          `${FRONTEND}/login?error=oauth_failed&message=${msg}`,
        );
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const user = req.user;

      const accessToken = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "30m" },
      );

      const refreshToken = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" },
      );

      await User.updateOne(
        { _id: user._id },
        { $set: { lastLogin: Date.now() } },
      );

      const userData = encodeURIComponent(
        JSON.stringify({
          uid: user.uid,
          username: user.username,
          role: user.role,
        }),
      );
      res.redirect(
        `${FRONTEND}/oauth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}&user=${userData}`,
      );
    } catch (err) {
      console.error(err);
      const msg = encodeURIComponent(
        err?.message || "Authentication error. Please try again.",
      );
      res.redirect(`${FRONTEND}/login?error=oauth_failed&message=${msg}`);
    }
  },
);

export default router;
