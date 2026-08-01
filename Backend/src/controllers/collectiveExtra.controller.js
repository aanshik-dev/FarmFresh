import zoneService from "../services/collective/zone.service.js";
import driverService from "../services/collective/driver.service.js";
import dealService from "../services/collective/deal.service.js";
import scheduleService from "../services/collective/schedule.service.js";
import notificationService from "../services/notification.service.js";
import announcementService from "../services/announcement.service.js";
import uploadFile from "../utils/uploadFile.js";
import throwErr from "../utils/throwErr.js";

// ══ Zone Controllers ══════════════════════════════════════════════════════════

export const addZone = async (req, res, next) => {
  try {
    const { id: collectiveId } = req.user;
    const result = await zoneService.addZone(collectiveId, req.body);
    res.status(201).json(result);
  } catch (err) { next(err); }
};

export const getZones = async (req, res, next) => {
  try {
    const { id: collectiveId } = req.user;
    const result = await zoneService.getZones(collectiveId);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

export const editZone = async (req, res, next) => {
  try {
    const { id: collectiveId } = req.user;
    const { zoneId } = req.params;
    const result = await zoneService.editZone(collectiveId, zoneId, req.body);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

export const deleteZone = async (req, res, next) => {
  try {
    const { id: collectiveId } = req.user;
    const { zoneId } = req.params;
    const result = await zoneService.deleteZone(collectiveId, zoneId);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

export const assignZone = async (req, res, next) => {
  try {
    const { id: collectiveId } = req.user;
    const { membershipId } = req.params;
    const { zoneId } = req.body;
    const result = await zoneService.assignZone(collectiveId, membershipId, zoneId);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

// ══ Driver Controllers ════════════════════════════════════════════════════════

export const addDriver = async (req, res, next) => {
  try {
    const { id: collectiveId } = req.user;
    const result = await driverService.addDriver(collectiveId, req.body, req.file);
    res.status(201).json(result);
  } catch (err) { next(err); }
};

export const getDrivers = async (req, res, next) => {
  try {
    const { id: collectiveId } = req.user;
    const result = await driverService.getDrivers(collectiveId);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

export const editDriver = async (req, res, next) => {
  try {
    const { id: collectiveId } = req.user;
    const { driverId } = req.params;
    const result = await driverService.editDriver(collectiveId, driverId, req.body, req.file);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

export const deleteDriver = async (req, res, next) => {
  try {
    const { id: collectiveId } = req.user;
    const { driverId } = req.params;
    const result = await driverService.deleteDriver(collectiveId, driverId);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

// ══ Deal / Crop Status Controllers ════════════════════════════════════════════

export const requestCropStatus = async (req, res, next) => {
  try {
    const { id: collectiveId } = req.user;
    const { dealId } = req.params;
    const result = await dealService.requestCropStatus(collectiveId, dealId);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

export const setPickupDate = async (req, res, next) => {
  try {
    const { id: collectiveId } = req.user;
    const { dealId } = req.params;
    const { expectedPickupDate } = req.body;
    const result = await dealService.setExpectedPickupDate(collectiveId, dealId, expectedPickupDate);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

export const getDealStatusHistory = async (req, res, next) => {
  try {
    const { id: collectiveId } = req.user;
    const { dealId } = req.params;
    const result = await dealService.getDealStatusHistory(collectiveId, dealId);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

// ══ Schedule Controllers ══════════════════════════════════════════════════════

export const createSchedule = async (req, res, next) => {
  try {
    const { id: collectiveId } = req.user;
    const result = await scheduleService.createSchedule(collectiveId, req.body);
    res.status(201).json(result);
  } catch (err) { next(err); }
};

export const getSchedules = async (req, res, next) => {
  try {
    const { id: collectiveId } = req.user;
    const { filter } = req.query;
    const result = await scheduleService.getSchedules(collectiveId, filter);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

export const getScheduleDetail = async (req, res, next) => {
  try {
    const { id: collectiveId } = req.user;
    const { scheduleId } = req.params;
    const result = await scheduleService.getScheduleDetail(collectiveId, scheduleId);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

export const updateScheduleStatus = async (req, res, next) => {
  try {
    const { id: collectiveId } = req.user;
    const { scheduleId } = req.params;
    const result = await scheduleService.updateScheduleStatus(collectiveId, scheduleId, req.body);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

export const updateSchedule = async (req, res, next) => {
  try {
    const { id: collectiveId } = req.user;
    const { scheduleId } = req.params;
    const result = await scheduleService.updateSchedule(collectiveId, scheduleId, req.body);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

export const markItemPaid = async (req, res, next) => {
  try {
    const { id: collectiveId } = req.user;
    const { scheduleId, itemId } = req.params;
    const result = await scheduleService.markItemPaid(collectiveId, scheduleId, itemId, req.body);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

export const payFarmerForSchedule = async (req, res, next) => {
  try {
    const { id: collectiveId } = req.user;
    const { scheduleId, farmerGroupId } = req.params;
    const result = await scheduleService.payFarmerForSchedule(collectiveId, scheduleId, farmerGroupId, req.body);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

export const getReadyDeals = async (req, res, next) => {
  try {
    const { id: collectiveId } = req.user;
    const { zoneId, scheduleId } = req.query;
    const result = await scheduleService.getReadyDeals(collectiveId, { zoneId, scheduleId });
    res.status(200).json(result);
  } catch (err) { next(err); }
};

/** Live + upcoming pickups and the outstanding payout, for the dashboard. */
export const getPickupDashboard = async (req, res, next) => {
  try {
    const { id: collectiveId } = req.user;
    const result = await scheduleService.getPickupDashboard(collectiveId);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

// ══ Payment Controllers ═══════════════════════════════════════════════════════

export const getPayments = async (req, res, next) => {
  try {
    const { id: collectiveId } = req.user;
    const { farmerGroupId, scheduleId } = req.query;
    const result = await scheduleService.getPayments(collectiveId, { farmerGroupId, scheduleId });
    res.status(200).json(result);
  } catch (err) { next(err); }
};

/** Balance, lifetime earnings, every pickup line and every receipt for one farmer group. */
export const getFarmerLedger = async (req, res, next) => {
  try {
    const { id: collectiveId } = req.user;
    const { farmerGroupId } = req.params;
    const result = await scheduleService.getFarmerLedger(collectiveId, farmerGroupId);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

/** Upload a payment receipt image and hand back its hosted URL. */
export const uploadPaymentProof = async (req, res, next) => {
  try {
    const { id: collectiveId } = req.user;
    if (!req.file) throwErr(400, "A receipt file is required !!");

    // Naming convention: Farmfresh/payments/[schedule_code]_[farmerGroup_FID]_[timestamp]
    const { scheduleCode = "SC", farmerFid = "F" } = req.body;
    const timestamp = Date.now();
    const fileName = `${scheduleCode}_${farmerFid}_${timestamp}`;

    const result = await uploadFile(
      req.file.buffer,
      `Farmfresh/payments`,
      fileName,
      { overwrite: false }, // payment proofs are never overwritten
    );

    res.status(201).json({
      success: true,
      message: "Payment proof uploaded !!",
      url: result.secure_url,
      publicId: result.public_id,
    });
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

export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { notifId } = req.params;
    const result = await notificationService.deleteNotification(id, notifId);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

// ══ Announcement Controllers ══════════════════════════════════════════════════

export const createAnnouncement = async (req, res, next) => {
  try {
    const { id: collectiveId } = req.user;
    const result = await announcementService.createAnnouncement(collectiveId, req.body);
    res.status(201).json(result);
  } catch (err) { next(err); }
};

export const getCollectiveAnnouncements = async (req, res, next) => {
  try {
    const { id: collectiveId } = req.user;
    const result = await announcementService.getCollectiveAnnouncements(collectiveId);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

export const deleteAnnouncement = async (req, res, next) => {
  try {
    const { id: collectiveId } = req.user;
    const { announcementId } = req.params;
    const result = await announcementService.deleteAnnouncement(collectiveId, announcementId);
    res.status(200).json(result);
  } catch (err) { next(err); }
};

// ══ Dashboard Controllers ═════════════════════════════════════════════════════

export const getDashboardStats = async (req, res, next) => {
  try {
    const { id: collectiveId } = req.user;
    const dashboardService = await import("../services/dashboard.service.js").then(m => m.default);
    const stats = await dashboardService.getCollectiveStats(collectiveId);
    res.status(200).json({ success: true, stats });
  } catch (err) { next(err); }
};
