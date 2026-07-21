import express from "express";
import {
  addCrop,
  editCrop,
  getCrops,
  deleteCrop,
  sendRequest,
  cancelRequest,
  getMemberships,
  terminateDeal,
} from "../controllers/farmer.controller.js";
import {
  updateCropStatus,
  getDealStatusHistory,
  getActiveDeals,
  getFarmerPickups,
  getFarmerBalance,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getFarmerAnnouncements,
  markAnnouncementRead,
  getDashboardStats,
} from "../controllers/farmerExtra.controller.js";
import verifyToken from "../middlewares/authMiddleware.js";
import authorizeRoles from "../middlewares/roleMiddleware.js";

const router = express.Router();
const auth = [verifyToken, authorizeRoles("FARMER_GROUP")];

// ── Crops 
router.post("/me/crops", ...auth, addCrop);
router.get("/me/crops", ...auth, getCrops);
router.patch("/me/crops", ...auth, editCrop);
router.delete("/me/crops", ...auth, deleteCrop);

// ── Memberships / Collectives
router.post("/me/members/request", ...auth, sendRequest);
router.post("/me/members/cancel", ...auth, cancelRequest);
router.post("/me/members/terminate", ...auth, terminateDeal);
router.get("/me/members", ...auth, getMemberships);

// ── Deal / Crop Status
router.post("/me/deals/:dealId/update-status", ...auth, updateCropStatus);
router.get("/me/deals/:dealId/status-history", ...auth, getDealStatusHistory);
router.get("/me/deals/active", ...auth, getActiveDeals);

// ── Pickup & Balance
router.get("/me/pickups", ...auth, getFarmerPickups);
router.get("/me/balance", ...auth, getFarmerBalance);

// ── Notifications
router.get("/me/notifications", ...auth, getNotifications);
router.patch("/me/notifications/:notifId/read", ...auth, markNotificationRead);
router.patch("/me/notifications/read-all", ...auth, markAllNotificationsRead);

// ── Announcements
router.get("/me/announcements", ...auth, getFarmerAnnouncements);
router.patch(
  "/me/announcements/:announcementId/read",
  ...auth,
  markAnnouncementRead,
);

// ── Dashboard
router.get("/me/dashboard", ...auth, getDashboardStats);

export default router;
