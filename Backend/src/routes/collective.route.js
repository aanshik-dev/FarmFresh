import express from "express";
import {
  addCrop,
  editCrop,
  getCrops,
} from "../controllers/collective.controller.js";
import verifyToken from "../middlewares/authMiddleware.js";
import authorizeRoles from "../middlewares/roleMiddleware.js";

const router = express.Router();


router.post("/me/add-crop", verifyToken, authorizeRoles("COLLECTIVE"), addCrop);

router.put(
  "/me/edit-crop",
  verifyToken,
  authorizeRoles("COLLECTIVE"),
  editCrop,
);

router.get(
  "/me/get-crops",
  verifyToken,
  authorizeRoles("COLLECTIVE"),
  getCrops,
);

export default router;
