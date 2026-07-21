import Announcement from "../models/announcement.model.js";
import Membership from "../models/membership.model.js";
import Notification from "../models/notification.model.js";
import throwErr from "../utils/throwErr.js";

// ── Create announcement (collective) ──────────────────────────────────────────
const createAnnouncement = async (collectiveId, { title, body, targetCrops, newPrice }) => {
  if (!title || !body) throwErr(400, "Title and body are required !!");

  const announcement = await Announcement.create({
    collective: collectiveId,
    title: title.trim(),
    body: body.trim(),
    targetCrops: targetCrops || [],
    newPrice: newPrice || null,
  });

  // Notify all member farmer groups
  const memberships = await Membership.find({ collective: collectiveId }).lean();
  if (memberships.length > 0) {
    const notifs = memberships.map((m) => ({
      recipient: m.farmer,
      recipientRole: "FARMER_GROUP",
      type: "ANNOUNCEMENT",
      title,
      body,
      data: { announcementId: announcement._id, newPrice },
      sender: collectiveId,
    }));
    await Notification.insertMany(notifs);
  }

  return { success: true, message: "Announcement created and sent to all members !!", announcement };
};

// ── Get announcements (collective view) ────────────────────────────────────────
const getCollectiveAnnouncements = async (collectiveId) => {
  const announcements = await Announcement.find({ collective: collectiveId, status: "ACTIVE" })
    .sort({ createdAt: -1 })
    .populate("targetCrops", "name code")
    .lean();

  return { success: true, message: "Announcements fetched !!", announcements };
};

// ── Get announcements for farmer (from all their collectives) ─────────────────
const getFarmerAnnouncements = async (farmerId) => {
  const memberships = await Membership.find({ farmer: farmerId }).lean();
  const collectiveIds = memberships.map((m) => m.collective);

  const announcements = await Announcement.find({ collective: { $in: collectiveIds }, status: "ACTIVE" })
    .sort({ createdAt: -1 })
    .populate("collective", "name profile")
    .populate("targetCrops", "name code")
    .lean();

  // Mark which are unread for this farmer
  const annotated = announcements.map((a) => ({
    ...a,
    isRead: (a.readBy || []).some((id) => id.toString() === farmerId.toString()),
  }));

  return { success: true, message: "Announcements fetched !!", announcements: annotated };
};

// ── Mark announcement as read (farmer) ───────────────────────────────────────
const markAnnouncementRead = async (farmerId, announcementId) => {
  const announcement = await Announcement.findById(announcementId);
  if (!announcement || announcement.status !== "ACTIVE") throwErr(404, "Announcement not found !!");

  if (!announcement.readBy.some((id) => id.toString() === farmerId.toString())) {
    announcement.readBy.push(farmerId);
    await announcement.save();
  }

  return { success: true, message: "Marked as read !!" };
};

// ── Soft delete announcement (collective) ────────────────────────────────────
const deleteAnnouncement = async (collectiveId, announcementId) => {
  const announcement = await Announcement.findOne({ _id: announcementId, collective: collectiveId });
  if (!announcement) throwErr(404, "Announcement not found !!");

  announcement.status = "INACTIVE";
  await announcement.save();

  return { success: true, message: "Announcement deleted successfully !!" };
};

export default { createAnnouncement, getCollectiveAnnouncements, getFarmerAnnouncements, markAnnouncementRead, deleteAnnouncement };
