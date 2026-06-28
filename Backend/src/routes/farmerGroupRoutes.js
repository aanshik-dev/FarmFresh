import express from "express";
import {
  getAllGroups,
  getGroupById,
  createGroup,
  updateGroupStatus,
  deleteGroup,
} from "../controllers/farmerGroupController.js";
import verifyToken from "../middlewares/authMiddleware.js";
import authorizeRoles from "../middlewares/roleMiddleware.js";

const router = express.Router();

// GET /api/groups — anyone logged in can see all groups (also supports ?zone=Zone+A and ?status=Ready)
router.get("/", verifyToken, getAllGroups);

// GET /api/groups/:id — get a single group
router.get("/:id", verifyToken, getGroupById);

// POST /api/groups — only ADMIN or COLLECTIVE can add a new group
router.post("/", verifyToken, authorizeRoles("ADMIN", "COLLECTIVE"), createGroup);

// PATCH /api/groups/:id — FARMER_GROUP can update their own status/yield, COLLECTIVE/ADMIN can update any
router.patch("/:id", verifyToken, authorizeRoles("ADMIN", "COLLECTIVE", "FARMER_GROUP"), updateGroupStatus);

// DELETE /api/groups/:id — only ADMIN can delete
router.delete("/:id", verifyToken, authorizeRoles("ADMIN"), deleteGroup);

export default router;
