import express from "express";
import verifyToken from "../middlewares/authMiddleware.js";
const router = express.Router();

// Only admin can access this
// Only admin can access this
router.get("/admin", verifyToken, (req, res) => {
  res.json({ message: "Welcome Admin" });
})

router.get("/user", (req, res) => {
  res.json({ message: "Welcome User" });
})

export default router;

// Only user can access this