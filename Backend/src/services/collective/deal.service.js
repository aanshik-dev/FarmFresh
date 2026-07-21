import CropDeal from "../../models/cropDeal.model.js";
import CropStatusUpdate from "../../models/cropStatusUpdate.model.js";
import Membership from "../../models/membership.model.js";
import Notification from "../../models/notification.model.js";
import throwErr from "../../utils/throwErr.js";

// ── Request crop status from farmer (collective asks) ─────────────────────────
const requestCropStatus = async (collectiveId, dealId) => {
  const deal = await CropDeal.findById(dealId).populate({
    path: "membership",
    match: { collective: collectiveId },
  });

  if (!deal || !deal.membership)
    throwErr(404, "Deal not found or does not belong to your collective !!");
  if (deal.status !== "APPROVED")
    throwErr(400, "Can only query status for APPROVED deals !!");
  if (deal.queryPending)
    throwErr(409, "A status query is already pending for this deal !!");

  deal.queryPending = true;
  await deal.save();

  // Notify farmer
  const farmerId = deal.membership.farmer;
  await Notification.create({
    recipient: farmerId,
    recipientRole: "FARMER_GROUP",
    type: "STATUS_UPDATE",
    title: "Crop Status Requested",
    body: "Your collective has requested a crop status update. Please update the current stage.",
    data: { dealId: deal._id },
    sender: collectiveId,
  });

  return { success: true, message: "Status query sent to farmer group !!" };
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

  deal.expectedPickupDate = new Date(expectedPickupDate);
  await deal.save();

  // Notify farmer
  await Notification.create({
    recipient: deal.membership.farmer,
    recipientRole: "FARMER_GROUP",
    type: "PICKUP",
    title: "Expected Pickup Date Set",
    body: `Your collective has set an expected pickup date: ${new Date(expectedPickupDate).toLocaleDateString("en-IN")}.`,
    data: { dealId: deal._id, expectedPickupDate },
    sender: collectiveId,
  });

  return { success: true, message: "Expected pickup date set !!", deal };
};

// ── Get status history for a deal (collective view) ───────────────────────────
const getStatusHistory = async (collectiveId, dealId) => {
  const deal = await CropDeal.findById(dealId).populate({
    path: "membership",
    match: { collective: collectiveId },
  });

  if (!deal || !deal.membership)
    throwErr(404, "Deal not found or does not belong to your collective !!");

  const history = await CropStatusUpdate.find({ cropDeal: dealId })
    .sort({ createdAt: -1 })
    .populate("updatedBy", "name phone")
    .lean();

  return { success: true, message: "Status history fetched !!", deal, history };
};

export default { requestCropStatus, setExpectedPickupDate, getStatusHistory };
