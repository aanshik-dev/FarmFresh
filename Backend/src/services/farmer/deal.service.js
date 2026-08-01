import CropDeal from "../../models/cropDeal.model.js";
import ScheduleItem from "../../models/scheduleItem.model.js";
import Membership from "../../models/membership.model.js";
import Notification from "../../models/notification.model.js";
import throwErr from "../../utils/throwErr.js";

// ── Update crop status (farmer posts an update) ───────────────────────────────
const updateCropStatus = async (farmerId, dealId, { stage, message, imgUrl, images }) => {
  if (!stage) throwErr(400, "Crop stage is required !!");

  const deal = await CropDeal.findById(dealId).populate({
    path: "membership",
    match: { farmer: farmerId },
  });

  if (!deal || !deal.membership)
    throwErr(404, "Deal not found or does not belong to you !!");
  if (deal.status !== "APPROVED")
    throwErr(400, "Can only update status for APPROVED deals !!");

  const isQueryResponse = deal.growth.queryStatus === "OPEN";

  const newImages = Array.isArray(images) && images.length > 0
    ? images
    : imgUrl ? [imgUrl] : [];

  // Update crop deal stage and growth object (REPLACES old images and note with new ones)
  deal.growth.stage = stage;
  deal.growth.queryStatus = "CLOSED";
  deal.growth.lastUpdated = new Date();
  deal.growth.images = newImages;
  deal.growth.message = message?.trim() || "";

  await deal.save();

  // Notify collective
  const collectiveId = deal.membership.collective;
  await Notification.create({
    recipient: collectiveId,
    recipientRole: "COLLECTIVE",
    type: "STATUS_UPDATE",
    title: "Crop Status Updated",
    body: `Farmer group has updated crop status to: ${stage}${message ? ` — "${message}"` : ""}.`,
    data: { dealId: deal._id, stage, isQueryResponse },
    sender: farmerId,
  });

  return { success: true, message: "Crop status updated successfully !!", growth: deal.growth };
};

// ── Get status history for a deal (farmer view) ────────────────────────────────
const getStatusHistory = async (farmerId, dealId) => {
  const deal = await CropDeal.findById(dealId).populate({
    path: "membership",
    match: { farmer: farmerId },
  });

  if (!deal || !deal.membership)
    throwErr(404, "Deal not found or does not belong to you !!");

  return { success: true, message: "Status fetched !!", deal, growth: deal.growth };
};

// ── Get pickup history for a specific deal (per-crop pickup ledger) ───────────
const getDealPickupHistory = async (farmerId, dealId) => {
  // Verify deal belongs to farmer
  const deal = await CropDeal.findById(dealId).populate({
    path: "membership",
    match: { farmer: farmerId },
  });
  if (!deal || !deal.membership)
    throwErr(404, "Deal not found or does not belong to you !!");

  const items = await ScheduleItem.find({ cropDeal: dealId })
    .populate({
      path: "schedule",
      select: "code pickupDate status completedAt collective",
      populate: { path: "collective", select: "name phone" },
    })
    .sort({ createdAt: -1 })
    .lean();

  return {
    success: true,
    message: "Pickup history fetched !!",
    history: items.map((item) => ({
      _id: item._id,
      scheduleId: item.schedule?._id,
      scheduleCode: item.schedule?.code,
      pickupDate: item.schedule?.pickupDate,
      completedAt: item.schedule?.completedAt,
      collective: item.schedule?.collective,
      collectedQuantity: item.collectedQuantity,
      agreedPrice: item.agreedPrice,
      totalAmount: item.totalAmount,
      status: item.status,
      paymentStatus: item.paymentStatus,
      paymentProof: item.paymentProof,
      paidAt: item.paidAt,
    })),
  };
};

// ── Get all active deals for a farmer ─────────────────────────────────────────
const getActiveDeals = async (farmerId) => {
  const memberships = await Membership.find({ farmer: farmerId }).lean();
  const membershipIds = memberships.map((m) => m._id);

  const deals = await CropDeal.find({
    membership: { $in: membershipIds },
    status: "APPROVED",
  })
    .populate("crop")
    .populate({ path: "membership", populate: { path: "collective", select: "name phone" } })
    .lean();

  return { success: true, message: "Active deals fetched !!", deals };
};

export default { updateCropStatus, getStatusHistory, getDealPickupHistory, getActiveDeals };
