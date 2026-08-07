import express from "express";
import verifyToken from "../middlewares/authMiddleware.js";
import authorizeRoles from "../middlewares/roleMiddleware.js";
import adminController from "../controllers/admin.controller.js";
import upload, { docUpload, singleFile } from "../middlewares/uploader.js";

const router = express.Router();

const auth = [verifyToken, authorizeRoles("ADMIN")];

router.get("/stats",              ...auth, adminController.getStats);
router.get("/farmer-groups",      ...auth, adminController.getFarmerGroups);
router.get("/collectives",        ...auth, adminController.getCollectives);
router.get("/users",              ...auth, adminController.getUsers);
router.patch("/users/:id/status", ...auth, adminController.updateUserStatus);
router.delete("/users/:id",       ...auth, adminController.deleteUser);
router.get("/issues",             ...auth, adminController.getIssues);
router.patch("/issues/:id/status",...auth, adminController.updateIssueStatus);
router.get("/contacts",           ...auth, adminController.getContacts);
router.get("/payments",           ...auth, adminController.getPaymentOverview);
router.get("/analytics",          ...auth, adminController.getPlatformAnalytics);
router.get("/crops",              ...auth, adminController.getCrops);
router.post("/crops",             ...auth, singleFile(docUpload, "image"), adminController.createCrop);
router.patch("/crops/:id",        ...auth, singleFile(docUpload, "image"), adminController.updateCrop);
router.get("/relations",          ...auth, adminController.getPlatformRelations);
router.get("/pending-payments",   ...auth, adminController.getPendingPayments);
router.get("/explorer/collection/:name", ...auth, adminController.getCollectionData);

export default router;
