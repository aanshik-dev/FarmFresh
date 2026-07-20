import express from "express";
import {
  addCrop,
  editCrop,
  getCrops,
  sendRequest,
  cancelRequest,
  deleteCrop,
  getMemberships,
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

router.patch(
  "/me/edit-crop",
  verifyToken,
  authorizeRoles("FARMER_GROUP"),
  editCrop,
);

router.get("/me/crops", verifyToken, authorizeRoles("FARMER_GROUP"), getCrops);

router.delete(
  "/me/delete-crop",
  verifyToken,
  authorizeRoles("FARMER_GROUP"),
  deleteCrop,
);

router.post(
  "/me/members/request",
  verifyToken,
  authorizeRoles("FARMER_GROUP"),
  sendRequest,
);

router.get(
  "/me/members",
  verifyToken,
  authorizeRoles("FARMER_GROUP"),
  getMemberships,
);

router.post(
  "/me/members/cancel",
  verifyToken,
  authorizeRoles("FARMER_GROUP"),
  cancelRequest,
);

export default router;
