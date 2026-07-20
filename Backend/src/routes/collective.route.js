import express from "express";
import {
  addCrop,
  editCrop,
  getCrops,
  deleteCrop,
  getMemberships,
  acceptRequest,
  rejectRequest,
} from "../controllers/collective.controller.js";
import verifyToken from "../middlewares/authMiddleware.js";
import authorizeRoles from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.post("/me/add-crop", verifyToken, authorizeRoles("COLLECTIVE"), addCrop);

router.patch(
  "/me/edit-crop",
  verifyToken,
  authorizeRoles("COLLECTIVE"),
  editCrop,
);

router.get("/me/crops", verifyToken, authorizeRoles("COLLECTIVE"), getCrops);

router.delete(
  "/me/delete-crop",
  verifyToken,
  authorizeRoles("COLLECTIVE"),
  deleteCrop,
);

router.get(
  "/me/members",
  verifyToken,
  authorizeRoles("COLLECTIVE"),
  getMemberships,
);

router.post(
  "/me/members/reject",
  verifyToken,
  authorizeRoles("COLLECTIVE"),
  rejectRequest,
);

router.post(
  "/me/members/accept",
  verifyToken,
  authorizeRoles("COLLECTIVE"),
  acceptRequest,
);

export default router;
