import express from "express";
import verifyToken from "../middlewares/authMiddleware.js";
import authorizeRoles from "../middlewares/roleMiddleware.js";
const router = express.Router();

// Only admin can access this
router.get("/admin", verifyToken, authorizeRoles("ADMIN"), (req, res) => {
  res.json({ message: "Welcome Admin" });
})

// Only user can access this
router.get("/user", verifyToken, authorizeRoles("USER"), (req, res) => {
  res.json({ message: "Welcome User" });
})

export default router;
