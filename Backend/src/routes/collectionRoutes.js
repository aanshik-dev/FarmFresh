import express from "express";
import {
  getAllCollections,
  scheduleCollection,
  updateCollectionStatus,
} from "../controllers/collectionController.js";
import verifyToken from "../middlewares/authMiddleware.js";
import authorizeRoles from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.get("/", verifyToken, getAllCollections);

router.post("/", verifyToken, authorizeRoles("ADMIN", "COLLECTIVE"), scheduleCollection);

router.patch("/:id", verifyToken, authorizeRoles("ADMIN", "COLLECTIVE"), updateCollectionStatus);

export default router;
