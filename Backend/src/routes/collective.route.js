import express from "express";
import {
  addCrop, editCrop, getCrops, deleteCrop,
  getMemberships, acceptRequest, rejectRequest, terminateDeal,
} from "../controllers/collective.controller.js";
import {
  addZone, getZones, editZone, deleteZone, assignZone,
  addDriver, getDrivers, editDriver, deleteDriver,
  requestCropStatus, setPickupDate, getDealStatusHistory,
  createSchedule, getSchedules, getScheduleDetail, updateScheduleStatus,
  markItemPaid, payFarmerForSchedule, getReadyDeals,
  getNotifications, markNotificationRead, markAllNotificationsRead,
  createAnnouncement, getCollectiveAnnouncements, deleteAnnouncement,
  getDashboardStats,
} from "../controllers/collectiveExtra.controller.js";
import verifyToken from "../middlewares/authMiddleware.js";
import authorizeRoles from "../middlewares/roleMiddleware.js";

const router = express.Router();
const auth = [verifyToken, authorizeRoles("COLLECTIVE")];

// ── Crop Inventory
router.post("/me/crops", ...auth, addCrop);
router.get("/me/crops", ...auth, getCrops);
router.patch("/me/crops", ...auth, editCrop);
router.delete("/me/crops", ...auth, deleteCrop);

// ── Memberships / Farmer Groups
router.get("/me/members", ...auth, getMemberships);
router.post("/me/members/accept", ...auth, acceptRequest);
router.post("/me/members/reject", ...auth, rejectRequest);
router.post("/me/members/terminate", ...auth, terminateDeal);
router.patch("/me/members/:membershipId/zone", ...auth, assignZone);

// ── Zones 
router.post("/me/zones", ...auth, addZone);
router.get("/me/zones", ...auth, getZones);
router.patch("/me/zones/:zoneId", ...auth, editZone);
router.delete("/me/zones/:zoneId", ...auth, deleteZone);

// ── Drivers
router.post("/me/drivers", ...auth, addDriver);
router.get("/me/drivers", ...auth, getDrivers);
router.patch("/me/drivers/:driverId", ...auth, editDriver);
router.delete("/me/drivers/:driverId", ...auth, deleteDriver);

// ── Deal / Crop Status
router.post("/me/deals/:dealId/query-status", ...auth, requestCropStatus);
router.patch("/me/deals/:dealId/pickup-date", ...auth, setPickupDate);
router.get("/me/deals/:dealId/status-history", ...auth, getDealStatusHistory);
router.get("/me/ready-deals", ...auth, getReadyDeals);

// ── Pickup Schedules
router.post("/me/schedules", ...auth, createSchedule);
router.get("/me/schedules", ...auth, getSchedules);
router.get("/me/schedules/:scheduleId", ...auth, getScheduleDetail);
router.patch("/me/schedules/:scheduleId/status", ...auth, updateScheduleStatus);
router.patch("/me/schedules/:scheduleId/items/:itemId/pay", ...auth, markItemPaid);
router.post("/me/schedules/:scheduleId/farmers/:farmerGroupId/pay", ...auth, payFarmerForSchedule);

// ── Notifications ─────────────────────────────────────────────────────────────
router.get("/me/notifications", ...auth, getNotifications);
router.patch("/me/notifications/:notifId/read", ...auth, markNotificationRead);
router.patch("/me/notifications/read-all", ...auth, markAllNotificationsRead);

// ── Announcements ─────────────────────────────────────────────────────────────
router.post("/me/announcements", ...auth, createAnnouncement);
router.get("/me/announcements", ...auth, getCollectiveAnnouncements);
router.delete("/me/announcements/:announcementId", ...auth, deleteAnnouncement);

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get("/me/dashboard", ...auth, getDashboardStats);

export default router;
