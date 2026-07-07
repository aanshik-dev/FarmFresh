import express from "express";
import verifyToken from "../middlewares/authMiddleware.js";
import authorizeRoles from "../middlewares/roleMiddleware.js";
import { getAllUsers } from "../controllers/userController.js";
const router = express.Router();

// Get all users (public for demo purposes)
router.get("/", getAllUsers);

// Only admin can access this
router.get("/admin", verifyToken, authorizeRoles("ADMIN"), (req, res) => {
  res.json({ message: "Welcome Admin" });
})

// Only user can access this
router.get("/user", verifyToken, authorizeRoles("USER"), (req, res) => {
  res.json({ message: "Welcome User" });
})

export default router;
