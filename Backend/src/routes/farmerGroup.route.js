import express from "express";
import {
  addCrop,
  editCrop,
  getCrops,
  sendRequest,
} from "../controllers/farmer.controller.js";
import verifyToken from "../middlewares/authMiddleware.js";
import authorizeRoles from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.post(
  "/me/add-crop",
  verifyToken,
  authorizeRoles("FARMER_GROUP"),
  addCrop,
);

router.put(
  "/me/edit-crop",
  verifyToken,
  authorizeRoles("FARMER_GROUP"),
  editCrop,
);

router.get(
  "/me/get-crops",
  verifyToken,
  authorizeRoles("FARMER_GROUP"),
  getCrops,
);

router.post(
  "/me/member-request",
  verifyToken,
  authorizeRoles("FARMER_GROUP"),
  sendRequest,
);

export default router;
