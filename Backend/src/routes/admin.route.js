import express from "express";
import verifyToken from "../middlewares/authMiddleware.js";
import authorizeRoles from "../middlewares/roleMiddleware.js";
import adminController from "../controllers/admin.controller.js";

const router = express.Router();

router.get("/stats", verifyToken, authorizeRoles("ADMIN"), adminController.getStats);
router.get("/farmer-groups", verifyToken, authorizeRoles("ADMIN"), adminController.getFarmerGroups);
router.get("/collectives", verifyToken, authorizeRoles("ADMIN"), adminController.getCollectives);
router.get("/users", verifyToken, authorizeRoles("ADMIN"), adminController.getUsers);
router.patch("/users/:id/status", verifyToken, authorizeRoles("ADMIN"), adminController.updateUserStatus);
router.get("/issues", verifyToken, authorizeRoles("ADMIN"), adminController.getIssues);
router.patch("/issues/:id/status", verifyToken, authorizeRoles("ADMIN"), adminController.updateIssueStatus);

export default router;
