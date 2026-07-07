import express from "express";
import {
  getAdminSummary,
  getAdminFarmerGroups,
  getAdminCollectives,
  getAdminIssues,
} from "../controllers/adminController.js";

import {
  createFarmerGroup,
  updateFarmerGroup,
  deleteFarmerGroup,
  createCollective,
  updateCollective,
  deleteCollective,
} from "../controllers/adminCrudController.js";

const router = express.Router();

// All routes are public for demo purposes (no auth middleware)
router.get("/summary", getAdminSummary);
router.get("/farmer-groups", getAdminFarmerGroups);
router.post("/farmer-groups", createFarmerGroup);
router.patch("/farmer-groups/:id", updateFarmerGroup);
router.delete("/farmer-groups/:id", deleteFarmerGroup);

router.get("/collectives", getAdminCollectives);
router.post("/collectives", createCollective);
router.patch("/collectives/:id", updateCollective);
router.delete("/collectives/:id", deleteCollective);

router.get("/issues", getAdminIssues);

export default router;
