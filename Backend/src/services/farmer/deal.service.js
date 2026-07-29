import CropDeal from "../../models/cropDeal.model.js";
import Membership from "../../models/membership.model.js";
import Notification from "../../models/notification.model.js";
import throwErr from "../../utils/throwErr.js";

// ── Update crop status (farmer posts an update) ───────────────────────────────
const updateCropStatus = async (farmerId, dealId, { stage, message, imgUrl }) => {
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

  // Create status update record
  const update = {
    stage,
    message: message?.trim() || "",
    imgUrl,
    updatedBy: farmerId,
    isQueryResponse,
  };
  deal.updates.push(update);

  // Update crop deal stage and close query status
  deal.growth.stage = stage;
  deal.growth.queryStatus = "CLOSED";
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

  return { success: true, message: "Crop status updated successfully !!", update };
};

// ── Get status history for a deal (farmer view) ────────────────────────────────
const getStatusHistory = async (farmerId, dealId) => {
  const deal = await CropDeal.findById(dealId).populate({
    path: "membership",
    match: { farmer: farmerId },
  });

  if (!deal || !deal.membership)
    throwErr(404, "Deal not found or does not belong to you !!");

  const history = (deal.updates || []).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return { success: true, message: "Status history fetched !!", deal, history };
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

export default { updateCropStatus, getStatusHistory, getActiveDeals };
