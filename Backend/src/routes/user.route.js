import express from "express";
import verifyToken from "../middlewares/authMiddleware.js";
import authorizeRoles from "../middlewares/roleMiddleware.js";
import UserController from "../controllers/user.controller.js";
import upload from "../middlewares/uploader.js";

const router = express.Router();

router.get("/admin", verifyToken, authorizeRoles("ADMIN"), (req, res) => {
  res.json({ message: "Welcome Admin" });
});

router.get("/user", verifyToken, authorizeRoles("USER"), (req, res) => {
  res.json({ message: "Welcome User" });
});

router.get(
  "/me",
  verifyToken,
  authorizeRoles("ADMIN", "COLLECTIVE", "FARMER_GROUP"),
  UserController.getCurrentUser,
);

router.patch(
  "/me/update",
  verifyToken,
  authorizeRoles("ADMIN", "COLLECTIVE", "FARMER_GROUP"),
  (req, res, next) => {
    upload.single("profile")(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }
      next();
    });
  },
  UserController.updateCurrentUser,
);

router.patch(
  "/me/deactivate",
  verifyToken,
  authorizeRoles("FARMER_GROUP", "COLLECTIVE"),
  UserController.deactivateCurrentUser,
);

router.patch(
  "/me/change-password",
  verifyToken,
  authorizeRoles("FARMER_GROUP", "COLLECTIVE"),
  UserController.changePassword,
);

export default router;
