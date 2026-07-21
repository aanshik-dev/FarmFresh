import mongoose from "mongoose";
import Schedule from "../../models/schedule.model.js";
import ScheduleItem from "../../models/scheduleItem.model.js";
import CropDeal from "../../models/cropDeal.model.js";
import Driver from "../../models/driver.model.js";
import Zone from "../../models/zone.model.js";
import Membership from "../../models/membership.model.js";
import Notification from "../../models/notification.model.js";
import PaymentTransaction from "../../models/paymentTransaction.model.js";
import throwErr from "../../utils/throwErr.js";

/**
 * Create a pickup schedule
 * items = [{ cropDealId, collectedQuantity }]
 */
const createSchedule = async (collectiveId, { driverId, zoneId, pickupDate, time, notes, items }) => {
  if (!driverId || !zoneId || !pickupDate || !items || items.length === 0)
    throwErr(400, "driverId, zoneId, pickupDate, and items are required !!");

  const driver = await Driver.findOne({ _id: driverId, collective: collectiveId, status: { $ne: "INACTIVE" } });
  if (!driver) throwErr(404, "Driver not found !!");

  const zone = await Zone.findOne({ _id: zoneId, collective: collectiveId, status: "ACTIVE" });
  if (!zone) throwErr(404, "Zone not found !!");

  // Validate all deals
  const dealIds = items.map((i) => i.cropDealId);
  const deals = await CropDeal.find({ _id: { $in: dealIds }, status: "APPROVED" }).populate({
    path: "membership",
    match: { collective: collectiveId },
  });

  const validDeals = deals.filter((d) => d.membership !== null);
  if (validDeals.length !== items.length)
    throwErr(400, "Some crop deals are invalid or not approved !!");

  // Build schedule items and calculate total
  const dealMap = {};
  for (const d of validDeals) dealMap[d._id.toString()] = d;

  let totalAmount = 0;
  const itemDocs = items.map(({ cropDealId, collectedQuantity }) => {
    const deal = dealMap[cropDealId];
    const amount = deal.agreedPrice * collectedQuantity;
    totalAmount += amount;
    return {
      farmerGroup: deal.membership.farmer,
      cropDeal: cropDealId,
      collectedQuantity,
      agreedPrice: deal.agreedPrice,
      totalAmount: amount,
    };
  });

  const session = await mongoose.startSession();
  let schedule;
  try {
    await session.withTransaction(async () => {
      [schedule] = await Schedule.create(
        [{ collective: collectiveId, driver: driverId, zone: zoneId, pickupDate, time: time || "09:00", notes: notes || "", totalAmount }],
        { session },
      );

      const scheduleItemDocs = itemDocs.map((item) => ({ ...item, schedule: schedule._id }));
      await ScheduleItem.insertMany(scheduleItemDocs, { session });

      // Update collected quantities on CropDeals
      for (const { cropDeal, collectedQuantity } of items) {
        await CropDeal.findByIdAndUpdate(cropDeal, { $set: { collectedQuantity } }, { session });
      }

      // Update balance on Memberships
      const membershipUpdates = {};
      for (const { cropDeal, collectedQuantity } of items) {
        const deal = dealMap[cropDeal];
        const membershipId = deal.membership._id.toString();
        membershipUpdates[membershipId] = (membershipUpdates[membershipId] || 0) + deal.agreedPrice * collectedQuantity;
      }
      for (const [membershipId, amount] of Object.entries(membershipUpdates)) {
        await Membership.findByIdAndUpdate(membershipId, { $inc: { balance: amount } }, { session });
      }
    });
  } finally {
    await session.endSession();
  }

  // Notify all affected farmer groups
  const uniqueFarmerIds = [...new Set(itemDocs.map((i) => i.farmerGroup.toString()))];
  const pickupDateStr = new Date(pickupDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  await Notification.insertMany(
    uniqueFarmerIds.map((farmerId) => ({
      recipient: farmerId,
      recipientRole: "FARMER_GROUP",
      type: "PICKUP",
      title: "Pickup Scheduled",
      body: `A pickup has been scheduled for ${pickupDateStr} from ${zone.name}. Driver: ${driver.name} (${driver.phone}).`,
      data: { scheduleId: schedule._id },
      sender: collectiveId,
    })),
  );

  return { success: true, message: "Pickup scheduled successfully !!", schedule };
};

// ── Get schedules (collective) ─────────────────────────────────────────────────
const getSchedules = async (collectiveId, filter = "all") => {
  const query = { collective: collectiveId };
  const now = new Date();

  if (filter === "upcoming") query.pickupDate = { $gte: now };
  else if (filter === "past") query.pickupDate = { $lt: now };

  const schedules = await Schedule.find(query)
    .populate("driver", "name phone vehicleNumber")
    .populate("zone", "name color")
    .sort({ pickupDate: -1 })
    .lean();

  return { success: true, message: "Schedules fetched !!", schedules };
};

// ── Get single schedule detail with items ────────────────────────────────────
const getScheduleDetail = async (collectiveId, scheduleId) => {
  const schedule = await Schedule.findOne({ _id: scheduleId, collective: collectiveId })
    .populate("driver", "name phone vehicleNumber")
    .populate("zone", "name color")
    .lean();
  if (!schedule) throwErr(404, "Schedule not found !!");

  const items = await ScheduleItem.find({ schedule: scheduleId })
    .populate("farmerGroup", "name phone profile leadFarmer")
    .populate({ path: "cropDeal", populate: { path: "crop", select: "name code" } })
    .lean();

  return { success: true, message: "Schedule detail fetched !!", schedule, items };
};

// ── Update schedule status (CANCEL / POSTPONE / COMPLETE) ────────────────────
const updateScheduleStatus = async (collectiveId, scheduleId, { status, newDate }) => {
  const allowedStatuses = ["CANCELLED", "POSTPONED", "COMPLETED", "IN_PROGRESS"];
  if (!allowedStatuses.includes(status)) throwErr(400, "Invalid status !!");

  const schedule = await Schedule.findOne({ _id: scheduleId, collective: collectiveId });
  if (!schedule) throwErr(404, "Schedule not found !!");
  if (["COMPLETED", "CANCELLED"].includes(schedule.status))
    throwErr(400, "Cannot modify a completed or cancelled schedule !!");

  if (status === "POSTPONED") {
    if (!newDate) throwErr(400, "New pickup date is required when postponing !!");
    schedule.pickupDate = new Date(newDate);
  }

  schedule.status = status;
  await schedule.save();

  // If completing, increment driver's total deliveries
  if (status === "COMPLETED") {
    await Driver.findByIdAndUpdate(schedule.driver, { $inc: { totalDeliveries: 1 } });
  }

  return { success: true, message: `Schedule ${status.toLowerCase()} !!", schedule` };
};

// ── Mark schedule item as paid ────────────────────────────────────────────────
const markItemPaid = async (collectiveId, scheduleId, itemId, paymentProof) => {
  const schedule = await Schedule.findOne({ _id: scheduleId, collective: collectiveId });
  if (!schedule) throwErr(404, "Schedule not found !!");

  const item = await ScheduleItem.findOne({ _id: itemId, schedule: scheduleId });
  if (!item) throwErr(404, "Schedule item not found !!");
  if (item.paymentStatus === "PAID") throwErr(409, "This item is already marked as paid !!");

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      item.paymentStatus = "PAID";
      if (paymentProof) item.paymentProof = paymentProof;
      await item.save({ session });

      // Get the cropDeal's membership to reduce balance
      const deal = await CropDeal.findById(item.cropDeal).populate("membership");
      if (deal && deal.membership) {
        await Membership.findByIdAndUpdate(
          deal.membership._id,
          { $inc: { balance: -item.totalAmount, totalEarnings: item.totalAmount } },
          { session },
        );
      }
    });
  } finally {
    await session.endSession();
  }

  // Notify farmer
  await Notification.create({
    recipient: item.farmerGroup,
    recipientRole: "FARMER_GROUP",
    type: "PAYMENT",
    title: "Payment Received",
    body: `₹${item.totalAmount.toFixed(2)} has been marked as paid by your collective.`,
    data: { scheduleId, itemId: item._id, totalAmount: item.totalAmount },
    sender: collectiveId,
  });

  return { success: true, message: "Payment recorded successfully !!", item };
};

// ── Pay farmer for a schedule (bulk mark items paid + attach proof) ──────────
const payFarmerForSchedule = async (collectiveId, scheduleId, farmerGroupId, { paymentProof, utrNumber, remarks }) => {
  if (!scheduleId || !farmerGroupId)
    throwErr(400, "scheduleId and farmerGroupId are required !!");

  const schedule = await Schedule.findOne({ _id: scheduleId, collective: collectiveId });
  if (!schedule) throwErr(404, "Schedule not found !!");

  const items = await ScheduleItem.find({ schedule: scheduleId, farmerGroup: farmerGroupId, paymentStatus: "PENDING" });
  if (!items || items.length === 0)
    throwErr(400, "No pending payment items found for this farmer in this schedule !!");

  const totalPayment = items.reduce((sum, item) => sum + item.totalAmount, 0);

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // Mark all items as PAID
      await ScheduleItem.updateMany(
        { schedule: scheduleId, farmerGroup: farmerGroupId, paymentStatus: "PENDING" },
        { $set: { paymentStatus: "PAID", paymentProof: paymentProof || "" } },
        { session }
      );

      // Create PaymentTransaction log
      await PaymentTransaction.create(
        [
          {
            collective: collectiveId,
            farmerGroup: farmerGroupId,
            schedule: scheduleId,
            amount: totalPayment,
            paymentProof: paymentProof || "",
            utrNumber: utrNumber || "",
            remarks: remarks || "",
            paymentDate: new Date(),
          },
        ],
        { session }
      );

      // Deduct total payment from farmer membership balance and increase earnings
      const membership = await Membership.findOne({ farmer: farmerGroupId, collective: collectiveId });
      if (membership) {
        const newBalance = Math.max(0, membership.balance - totalPayment);
        await Membership.findByIdAndUpdate(
          membership._id,
          { $set: { balance: newBalance }, $inc: { totalEarnings: totalPayment } },
          { session }
        );
      }
    });
  } finally {
    await session.endSession();
  }

  // Notify farmer
  await Notification.create({
    recipient: farmerGroupId,
    recipientRole: "FARMER_GROUP",
    type: "PAYMENT",
    title: "Payment Received",
    body: `Payment of ₹${totalPayment.toFixed(2)} has been recorded for your pickup. Proof attached.`,
    data: { scheduleId, totalAmount: totalPayment, paymentProof },
    sender: collectiveId,
  });

  return { success: true, message: "Payment processed successfully !!", totalPayment };
};

// ── Get ready deals (for scheduling) ─────────────────────────────────────────
const getReadyDeals = async (collectiveId) => {
  const memberships = await Membership.find({ collective: collectiveId }).lean();
  const membershipIds = memberships.map((m) => m._id);

  const deals = await CropDeal.find({
    membership: { $in: membershipIds },
    status: "APPROVED",
  })
    .populate({
      path: "crop",
      match: { status: "ACTIVE" },
      populate: { path: "crop", select: "name code" },
    })
    .populate({ path: "membership", populate: { path: "farmer", select: "name phone profile" } })
    .lean();

  // Filter out deals where FarmerCrop is inactive or null
  const activeDeals = deals.filter((d) => d.crop !== null);

  // Filter to only those with latestStage === "READY" or a READY status update
  const readyDeals = activeDeals.filter((d) => d.latestStage === "READY");

  // Fallback check against CropStatusUpdate if latestStage was not synced previously
  if (readyDeals.length < activeDeals.length) {
    const unreadyIds = activeDeals.filter((d) => d.latestStage !== "READY").map((d) => d._id);
    const { default: CropStatusUpdate } = await import("../../models/cropStatusUpdate.model.js");
    const readyUpdates = await CropStatusUpdate.find({
      cropDeal: { $in: unreadyIds },
      stage: "READY",
    }).lean();

    const readyDealIds = new Set(readyUpdates.map((u) => u.cropDeal.toString()));
    const extraReady = activeDeals.filter((d) => readyDealIds.has(d._id.toString()));
    return { success: true, message: "Ready deals fetched !!", deals: [...readyDeals, ...extraReady] };
  }

  return { success: true, message: "Ready deals fetched !!", deals: readyDeals };
};

export default {
  createSchedule,
  getSchedules,
  getScheduleDetail,
  updateScheduleStatus,
  markItemPaid,
  payFarmerForSchedule,
  getReadyDeals,
};
