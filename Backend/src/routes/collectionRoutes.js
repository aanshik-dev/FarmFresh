import express from "express";
import {
  getAllCollections,
  scheduleCollection,
  updateCollectionStatus,
} from "../controllers/collectionController.js";
import verifyToken from "../middlewares/authMiddleware.js";
import authorizeRoles from "../middlewares/roleMiddleware.js";

const router = express.Router();

// GET /api/collections — view all collections (supports ?status=Scheduled and ?zone=Zone+C)
router.get("/", verifyToken, getAllCollections);

// POST /api/collections — only COLLECTIVE or ADMIN can schedule a collection
router.post("/", verifyToken, authorizeRoles("ADMIN", "COLLECTIVE"), scheduleCollection);

// PATCH /api/collections/:id — update collection status (e.g. mark as Completed)
router.patch("/:id", verifyToken, authorizeRoles("ADMIN", "COLLECTIVE"), updateCollectionStatus);

export default router;
