import express from "express";
import getAllCrops from "../controllers/common.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.get("/crops", getAllCrops);

// Accessible ONLY by FARMER_GROUP
router.get(
  "/farmer-only",
  authMiddleware,
  roleMiddleware(["FARMER_GROUP"]),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "You have accessed a Farmer Group exclusive endpoint!",
      user: req.user,
    });
  }
);

// Accessible ONLY by COLLECTIVE
router.get(
  "/collective-only",
  authMiddleware,
  roleMiddleware(["COLLECTIVE"]),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "You have accessed a Collective exclusive endpoint!",
      user: req.user,
    });
  }
);

// Accessible by BOTH
router.get(
  "/shared-data",
  authMiddleware,
  roleMiddleware(["FARMER_GROUP", "COLLECTIVE", "ADMIN"]),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "This endpoint is protected but shared across multiple roles.",
      user: req.user,
    });
  }
);

export default router;
