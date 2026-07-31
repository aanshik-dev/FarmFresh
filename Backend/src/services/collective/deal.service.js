import CropDeal from "../../models/cropDeal.model.js";
import Membership from "../../models/membership.model.js";
import Notification from "../../models/notification.model.js";
import throwErr from "../../utils/throwErr.js";

// ── Request crop status from farmer (collective asks) ─────────────────────────
const requestCropStatus = async (collectiveId, dealId) => {
  const deal = await CropDeal.findById(dealId)
    .populate({
      path: "membership",
      match: { collective: collectiveId },
      populate: { path: "collective", select: "name profile" },
    })
    .populate({
      path: "crop",
      populate: { path: "crop" },
    });

  if (!deal || !deal.membership)
    throwErr(404, "Deal not found or does not belong to your collective !!");
  if (deal.status !== "APPROVED")
    throwErr(400, "Can only query status for APPROVED deals !!");
  if (deal.growth.queryStatus === "OPEN") {
    throwErr(400, "A status query is already open for this deal !!");
  }

  // Prevent spamming queries (e.g. at least 10 days since last update)
  const lastUpdate = deal.growth?.lastUpdated || deal.createdAt;
  if (lastUpdate) {
    const daysDiff = (Date.now() - new Date(lastUpdate).getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff < 10) {
      const daysLeft = Math.ceil(10 - daysDiff);
      throwErr(400, `Status can only be requested if last update is at least 10 days old. Please wait ${daysLeft} more day(s).`);
    }
  }

  deal.growth.queryStatus = "OPEN";
  await deal.save();

  // Notify farmer group with detailed title and body
  const farmerId = deal.membership.farmer;
  const cropObj = deal.crop?.crop || deal.crop || {};
  const cropName = cropObj.name || "Crop";
  const cropCode = cropObj.code || "";
  const collectiveName = deal.membership.collective?.name || "Your Collective";

  await Notification.create({
    recipient: farmerId,
    recipientRole: "FARMER_GROUP",
    type: "STATUS_UPDATE",
    title: `Status Update Requested: ${cropName}`,
    body: `${collectiveName} has requested a status update for ${cropName}${cropCode ? ` (${cropCode})` : ""} (Agreed Rate: ₹${deal.agreedPrice || 0}/kg). Please update the current growth stage.`,
    data: { dealId: deal._id, cropName, cropCode, agreedPrice: deal.agreedPrice },
    sender: collectiveId,
  });

  return { success: true, message: `Status query sent to farmer group for ${cropName} !!` };
};

// ── Set expected pickup date (collective) ─────────────────────────────────────
const setExpectedPickupDate = async (collectiveId, dealId, expectedPickupDate) => {
  if (!expectedPickupDate) throwErr(400, "Expected pickup date is required !!");

  const deal = await CropDeal.findById(dealId).populate({
    path: "membership",
    match: { collective: collectiveId },
  });

  if (!deal || !deal.membership)
    throwErr(404, "Deal not found !!");
  if (deal.status !== "APPROVED")
    throwErr(400, "Can only set pickup date for APPROVED deals !!");

  if (!deal.schedule) deal.schedule = {};
  deal.schedule.expectedPickupDate = new Date(expectedPickupDate);
  await deal.save();

  // Notify farmer
  await Notification.create({
    recipient: deal.membership.farmer,
    recipientRole: "FARMER_GROUP",
    type: "PICKUP",
    title: "Expected Pickup Date Set",
    body: `Collective has set the expected pickup date to ${new Date(expectedPickupDate).toLocaleDateString("en-IN")}.`,
    data: { dealId: deal._id, expectedPickupDate },
    sender: collectiveId,
  });

  return { success: true, message: "Expected pickup date updated successfully !!" };
};

// ── Get status update history for a deal ─────────────────────────────────────
const getDealStatusHistory = async (dealId) => {
  const deal = await CropDeal.findById(dealId).lean();
  if (!deal) throwErr(404, "Deal not found !!");

  const history = (deal.updates || []).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return { success: true, history };
};

export default {
  requestCropStatus,
  setExpectedPickupDate,
  getDealStatusHistory,
};
