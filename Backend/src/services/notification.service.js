import Notification from "../models/notification.model.js";
import throwErr from "../utils/throwErr.js";

// ── Get notifications for any user ───────────────────────────────────────────
const getNotifications = async (userId, limit = 50) => {
  const notifications = await Notification.find({ recipient: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return {
    success: true,
    message: "Notifications fetched !!",
    notifications,
    unreadCount,
  };
};

// ── Mark notification as read ─────────────────────────────────────────────────
const markRead = async (userId, notificationId) => {
  const notif = await Notification.findOne({ _id: notificationId, recipient: userId });
  if (!notif) throwErr(404, "Notification not found !!");

  notif.isRead = true;
  await notif.save();

  return { success: true, message: "Notification marked as read !!" };
};

// ── Mark all notifications as read ───────────────────────────────────────────
const markAllRead = async (userId) => {
  await Notification.updateMany({ recipient: userId, isRead: false }, { $set: { isRead: true } });
  return { success: true, message: "All notifications marked as read !!" };
};

export default { getNotifications, markRead, markAllRead };
