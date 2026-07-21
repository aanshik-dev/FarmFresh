import dealService from "../services/farmer/deal.service.js";
import pickupService from "../services/farmer/pickup.service.js";
import notificationService from "../services/notification.service.js";
import announcementService from "../services/announcement.service.js";

// ══ Crop Status Controllers ═══════════════════════════════════════════════════

export const updateCropStatus = async (req, res, next) => {
  try {
    const { id: farmerId } = req.user;
    const { dealId } = req.params;
    const result = await dealService.updateCropStatus(farmerId, dealId, req.body);
    res.status(201).json(result);
  } catch (err) { next(err); }
};

export const getDealStatusHistory = async (req, res, next) => {
  try {
    const { id: farmerId } = req.user;
    const { dealId } = req.params;
    const result = await dealService.getStatusHistory(farmerId, dealId);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

export const getActiveDeals = async (req, res, next) => {
  try {
    const { id: farmerId } = req.user;
    const result = await dealService.getActiveDeals(farmerId);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

// ══ Pickup Controllers ════════════════════════════════════════════════════════

export const getFarmerPickups = async (req, res, next) => {
  try {
    const { id: farmerId } = req.user;
    const result = await pickupService.getFarmerPickups(farmerId);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

export const getFarmerBalance = async (req, res, next) => {
  try {
    const { id: farmerId } = req.user;
    const result = await pickupService.getFarmerBalance(farmerId);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

// ══ Notification Controllers ══════════════════════════════════════════════════

export const getNotifications = async (req, res, next) => {
  try {
    const { id } = req.user;
    const result = await notificationService.getNotifications(id);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { notifId } = req.params;
    const result = await notificationService.markRead(id, notifId);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    const { id } = req.user;
    const result = await notificationService.markAllRead(id);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

// ══ Announcement Controllers ══════════════════════════════════════════════════

export const getFarmerAnnouncements = async (req, res, next) => {
  try {
    const { id: farmerId } = req.user;
    const result = await announcementService.getFarmerAnnouncements(farmerId);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

export const markAnnouncementRead = async (req, res, next) => {
  try {
    const { id: farmerId } = req.user;
    const { announcementId } = req.params;
    const result = await announcementService.markAnnouncementRead(farmerId, announcementId);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

// ══ Dashboard Controllers ═════════════════════════════════════════════════════

export const getDashboardStats = async (req, res, next) => {
  try {
    const { id: farmerId } = req.user;
    // Import dashboard service dynamically or at top
    const dashboardService = await import("../services/dashboard.service.js").then(m => m.default);
    const stats = await dashboardService.getFarmerStats(farmerId);
    res.status(200).json({ success: true, stats });
  } catch (err) { next(err); }
};
