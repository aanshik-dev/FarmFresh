import mongoose from "mongoose";
import Schedule from "../../models/schedule.model.js";
import ScheduleItem from "../../models/scheduleItem.model.js";
import CropDeal from "../../models/cropDeal.model.js";
import Driver from "../../models/driver.model.js";
import Zone from "../../models/zone.model.js";
import Membership from "../../models/membership.model.js";
import FarmerGroup from "../../models/farmerGroup.model.js";
import FarmerCrop from "../../models/farmerCrop.model.js";
import CollectedCrop from "../../models/collectedCrops.model.js";
import Notification from "../../models/notification.model.js";
import PaymentTransaction from "../../models/paymentTransaction.model.js";
import generateId from "../idGenerator.service.js";
import throwErr from "../../utils/throwErr.js";

// ── Constants & helpers ───────────────────────────────────────────────────────

// A pickup may be planned at most three weeks ahead (business rule).
const MAX_SCHEDULE_AHEAD_DAYS = 21;

// Statuses where the pickup has not happened yet but is still on the books.
const OPEN_STATUSES = ["SCHEDULED", "IN_PROGRESS", "POSTPONED"];

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const fmtDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/**
 * Validates a pickup date: must be today or later, and within three weeks.
 * Returns the normalised Date.
 */
const validatePickupDate = (pickupDate, label = "Pickup date") => {
  const date = new Date(pickupDate);
  if (Number.isNaN(date.getTime())) throwErr(400, `${label} is invalid !!`);

  const today = startOfDay(new Date());
  if (startOfDay(date) < today) throwErr(400, `${label} cannot be in the past !!`);

  const limit = startOfDay(new Date());
  limit.setDate(limit.getDate() + MAX_SCHEDULE_AHEAD_DAYS);
  if (startOfDay(date) > limit)
    throwErr(
      400,
      `${label} cannot be more than ${MAX_SCHEDULE_AHEAD_DAYS} days (3 weeks) from today !!`,
    );

  return date;
};

/** Resolve a readable crop name/code out of a populated CropDeal.crop (FarmerCrop → Crop). */
const cropLabel = (farmerCrop) => {
  const directory = farmerCrop?.crop || {};
  return {
    name: directory.name || farmerCrop?.name || "Crop",
    code: directory.code || farmerCrop?.code || "",
  };
};

// ══════════════════════════════════════════════════════════════════════════════
// CREATE
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Create a pickup schedule.
 * items = [{ cropDealId, collectedQuantity, remark }]
 */
const createSchedule = async (
  collectiveId,
  { driverId, zoneId, pickupDate, time, notes, items },
) => {
  if (!driverId || !zoneId || !pickupDate || !Array.isArray(items) || items.length === 0)
    throwErr(400, "driverId, zoneId, pickupDate and at least one crop are required !!");

  const date = validatePickupDate(pickupDate);

  const driver = await Driver.findOne({
    _id: driverId,
    collective: collectiveId,
    status: { $ne: "INACTIVE" },
  });
  if (!driver) throwErr(404, "Driver not found or is no longer active !!");

  const zone = await Zone.findOne({ _id: zoneId, collective: collectiveId, status: "ACTIVE" });
  if (!zone) throwErr(404, "Zone not found or is no longer active !!");

  // ── Normalise + validate the requested lines ────────────────────────────────
  const requested = new Map();
  for (const item of items) {
    const dealId = item?.cropDealId;
    const qty = Number(item?.collectedQuantity);
    if (!dealId) throwErr(400, "Every pickup line needs a cropDealId !!");
    if (!mongoose.isValidObjectId(dealId)) throwErr(400, "Invalid crop deal id !!");
    if (!qty || qty <= 0)
      throwErr(400, "Every selected crop needs a collection quantity greater than 0 !!");
    if (requested.has(String(dealId)))
      throwErr(400, "The same crop deal cannot be added to a pickup twice !!");
    requested.set(String(dealId), { quantity: qty, remark: item?.remark?.trim() || "" });
  }

  const deals = await CropDeal.find({
    _id: { $in: [...requested.keys()] },
    status: "APPROVED",
  })
    .populate({
      path: "membership",
      match: { collective: collectiveId, status: "ACTIVE" },
    })
    .populate({ path: "crop", populate: { path: "crop", select: "name code" } });

  const validDeals = deals.filter((d) => d.membership);
  if (validDeals.length !== requested.size)
    throwErr(
      400,
      "Some crops are not approved, no longer part of an active membership, or do not belong to your collective !!",
    );

  // ── ZONE ENFORCEMENT: all crops must belong to the selected zone ────────────
  for (const deal of validDeals) {
    const membershipZone = String(deal.membership.zone || "");
    if (membershipZone && membershipZone !== String(zoneId)) {
      const { name } = cropLabel(deal.crop);
      throwErr(
        400,
        `"${name}" belongs to a different zone. A single schedule must cover exactly one zone !!`,
      );
    }
  }

  let totalAmount = 0;
  let totalQuantity = 0;
  const itemDocs = [];

  for (const deal of validDeals) {
    const { quantity, remark } = requested.get(deal._id.toString());
    const { name, code } = cropLabel(deal.crop);

    // Edge case: farmer deactivated the crop after the deal was approved.
    if (!deal.crop || deal.crop.status === "INACTIVE")
      throwErr(400, `"${name}" has been removed by the farmer group and cannot be picked up !!`);

    // Edge case: the crop is already part of another open pickup.
    if (deal.schedule?.activeSchedule)
      throwErr(400, `"${name}" is already part of another pickup that is not finished yet !!`);

    if (String(deal.growth?.stage || "").toUpperCase() !== "READY")
      throwErr(400, `"${name}" is not in READY stage yet and cannot be scheduled !!`);

    if (!deal.agreedPrice || deal.agreedPrice <= 0)
      throwErr(400, `"${name}" has no agreed price — review the deal before scheduling !!`);

    const amount = round2(deal.agreedPrice * quantity);
    totalAmount = round2(totalAmount + amount);
    totalQuantity = round2(totalQuantity + quantity);

    itemDocs.push({
      collective: collectiveId,
      farmerGroup: deal.membership.farmer,
      membership: deal.membership._id,
      cropDeal: deal._id,
      cropName: name,
      cropCode: code,
      plannedQuantity: quantity,
      collectedQuantity: quantity,
      agreedPrice: deal.agreedPrice,
      totalAmount: amount,
      remark,
    });
  }

  if (driver.capacity && totalQuantity > driver.capacity)
    throwErr(
      400,
      `Selected crops total ${totalQuantity} kg which exceeds ${driver.name}'s vehicle capacity of ${driver.capacity} kg !!`,
    );

  const uniqueFarmerIds = [...new Set(itemDocs.map((i) => i.farmerGroup.toString()))];

  const session = await mongoose.startSession();
  let schedule;
  try {
    await session.withTransaction(async () => {
      const code = await generateId("schedule", session);

      [schedule] = await Schedule.create(
        [
          {
            code,
            collective: collectiveId,
            driver: driverId,
            zone: zoneId,
            pickupDate: date,
            time: time || "09:00",
            notes: notes || "",
            totalAmount,
            totalQuantity,
            farmerCount: uniqueFarmerIds.length,
            itemCount: itemDocs.length,
          },
        ],
        { session },
      );

      await ScheduleItem.insertMany(
        itemDocs.map((item) => ({ ...item, schedule: schedule._id })),
        { session },
      );

      // Lock every deal to this pickup so it cannot be double-scheduled.
      for (const item of itemDocs) {
        await CropDeal.findByIdAndUpdate(
          item.cropDeal,
          {
            $set: {
              "schedule.collectedQuantity": item.plannedQuantity,
              "schedule.activeSchedule": schedule._id,
            },
          },
          { session },
        );
      }

      await Driver.findByIdAndUpdate(driverId, { $set: { status: "ASSIGNED" } }, { session });
    });
  } finally {
    await session.endSession();
  }

  // Notify every affected farmer group with their own crop lines.
  await Notification.insertMany(
    uniqueFarmerIds.map((farmerId) => {
      const own = itemDocs.filter((i) => i.farmerGroup.toString() === farmerId);
      const amount = round2(own.reduce((s, i) => s + i.totalAmount, 0));
      return {
        recipient: farmerId,
        recipientRole: "FARMER_GROUP",
        type: "PICKUP",
        title: `Pickup Scheduled · ${schedule.code}`,
        body: `${own.length} crop(s) will be collected on ${fmtDate(date)} at ${
          time || "09:00"
        } from ${zone.name}. Driver: ${driver.name} (${driver.phone}). Estimated value ₹${amount.toLocaleString(
          "en-IN",
        )}.`,
        data: {
          scheduleId: schedule._id,
          scheduleCode: schedule.code,
          pickupDate: date,
          amount,
        },
        sender: collectiveId,
      };
    }),
  );

  return { success: true, message: "Pickup scheduled successfully !!", schedule };
};

// ══════════════════════════════════════════════════════════════════════════════
// READ
// ══════════════════════════════════════════════════════════════════════════════

/**
 * List schedules for a collective.
 * filter: all | live | upcoming | past | unpaid
 */
const getSchedules = async (collectiveId, filter = "all") => {
  const query = { collective: collectiveId };
  const today = startOfDay(new Date());

  if (filter === "live") {
    query.pickupDate = { $gte: today, $lte: endOfDay(new Date()) };
    query.status = { $in: OPEN_STATUSES };
  } else if (filter === "upcoming") {
    query.status = { $in: OPEN_STATUSES };
  } else if (filter === "past") {
    query.status = { $in: ["COMPLETED", "CANCELLED"] };
  } else if (filter === "unpaid") {
    query.status = "COMPLETED";
    query.$expr = { $lt: ["$paidAmount", "$totalAmount"] };
  }

  const schedules = await Schedule.find(query)
    .populate("driver", "name phone vehicleNumber capacity profile driverId")
    .populate("zone", "name color")
    .sort({ pickupDate: -1 })
    .lean();

  const scheduleIds = schedules.map((s) => s._id);
  const items = await ScheduleItem.find({ schedule: { $in: scheduleIds } }).lean();
  const itemsMap = new Map();
  items.forEach((item) => {
    const sid = item.schedule.toString();
    if (!itemsMap.has(sid)) itemsMap.set(sid, []);
    itemsMap.get(sid).push(item);
  });

  return {
    success: true,
    message: "Schedules fetched !!",
    schedules: schedules.map((s) => ({
      ...s,
      items: itemsMap.get(s._id.toString()) || [],
      pendingAmount: round2((s.totalAmount || 0) - (s.paidAmount || 0)),
      isFullyPaid: (s.paidAmount || 0) >= (s.totalAmount || 0),
    })),
  };
};

/** Group schedule items by farmer group, with per-farmer money summary. */
const groupItemsByFarmer = (items) => {
  const map = new Map();
  for (const item of items) {
    const id = item.farmerGroup?._id?.toString() || item.farmerGroup?.toString();
    if (!id) continue;
    if (!map.has(id)) {
      map.set(id, {
        farmerGroup: item.farmerGroup,
        membership: item.membership || null,
        items: [],
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        totalQuantity: 0,
        cropCount: 0,
        allPaid: true,
      });
    }
    const entry = map.get(id);
    entry.items.push(item);
    entry.cropCount += 1;
    entry.totalQuantity = round2(entry.totalQuantity + (item.collectedQuantity || 0));
    entry.totalAmount = round2(entry.totalAmount + (item.totalAmount || 0));
    if (item.paymentStatus === "PAID") {
      entry.paidAmount = round2(entry.paidAmount + (item.totalAmount || 0));
    } else {
      entry.pendingAmount = round2(entry.pendingAmount + (item.totalAmount || 0));
      entry.allPaid = false;
    }
  }
  return [...map.values()];
};

/** Full detail of one pickup: raw items + farmer-wise grouping + payments made. */
const getScheduleDetail = async (collectiveId, scheduleId) => {
  const schedule = await Schedule.findOne({ _id: scheduleId, collective: collectiveId })
    .populate("driver", "name phone vehicleNumber capacity profile driverId")
    .populate("zone", "name color")
    .lean();
  if (!schedule) throwErr(404, "Schedule not found !!");

  const items = await ScheduleItem.find({ schedule: scheduleId })
    .populate("farmerGroup", "name phone profile leadFarmer address")
    .populate("membership", "balance totalEarnings zone route distance estTime")
    .lean();

  const payments = await PaymentTransaction.find({ schedule: scheduleId })
    .populate("farmerGroup", "name phone")
    .sort({ createdAt: -1 })
    .lean();

  return {
    success: true,
    message: "Schedule detail fetched !!",
    schedule: {
      ...schedule,
      pendingAmount: round2((schedule.totalAmount || 0) - (schedule.paidAmount || 0)),
    },
    items,
    farmers: groupItemsByFarmer(items),
    payments,
  };
};

/**
 * Dashboard feed — what is happening today, what is coming, and what is owed.
 */
const getPickupDashboard = async (collectiveId) => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const horizon = startOfDay(now);
  horizon.setDate(horizon.getDate() + MAX_SCHEDULE_AHEAD_DAYS);

  const [live, upcoming, unpaid] = await Promise.all([
    Schedule.find({
      collective: collectiveId,
      status: { $in: OPEN_STATUSES },
      pickupDate: { $gte: todayStart, $lte: todayEnd },
    })
      .populate("driver", "name phone vehicleNumber profile")
      .populate("zone", "name color")
      .sort({ time: 1 })
      .lean(),
    Schedule.find({
      collective: collectiveId,
      status: { $in: OPEN_STATUSES },
      pickupDate: { $gt: todayEnd, $lte: endOfDay(horizon) },
    })
      .populate("driver", "name phone vehicleNumber profile")
      .populate("zone", "name color")
      .sort({ pickupDate: 1 })
      .limit(10)
      .lean(),
    Schedule.find({
      collective: collectiveId,
      status: "COMPLETED",
      $expr: { $lt: ["$paidAmount", "$totalAmount"] },
    })
      .select("code pickupDate totalAmount paidAmount farmerCount")
      .sort({ pickupDate: -1 })
      .limit(10)
      .lean(),
  ]);

  // Farmer lists for the live pickups so the dashboard card is actionable.
  const liveIds = live.map((s) => s._id);
  const liveItems = liveIds.length
    ? await ScheduleItem.find({ schedule: { $in: liveIds } })
        .populate("farmerGroup", "name phone")
        .lean()
    : [];

  const liveWithFarmers = live.map((s) => ({
    ...s,
    farmers: groupItemsByFarmer(liveItems.filter((i) => i.schedule.toString() === s._id.toString())),
  }));

  const pendingPayout = round2(
    unpaid.reduce((sum, s) => sum + ((s.totalAmount || 0) - (s.paidAmount || 0)), 0),
  );

  return {
    success: true,
    message: "Pickup dashboard fetched !!",
    live: liveWithFarmers,
    upcoming,
    unpaid,
    pendingPayout,
  };
};

/**
 * Deals that are ready to be picked up — READY stage, approved, active
 * membership, active crop, and not already locked into another pickup.
 */
const getReadyDeals = async (collectiveId, { zoneId, scheduleId } = {}) => {
  const membershipQuery = { collective: collectiveId, status: "ACTIVE" };
  // If zoneId is provided, filter memberships by zone
  if (zoneId) membershipQuery.zone = zoneId;

  const memberships = await Membership.find(membershipQuery)
    .populate("farmer", "name phone profile leadFarmer address")
    .populate("zone", "name color")
    .lean();

  const membershipMap = new Map(memberships.map((m) => [m._id.toString(), m]));

  const activeScheduleFilter = [];
  activeScheduleFilter.push({ "schedule.activeSchedule": null });
  activeScheduleFilter.push({ "schedule.activeSchedule": { $exists: false } });
  if (scheduleId) {
    activeScheduleFilter.push({ "schedule.activeSchedule": new mongoose.Types.ObjectId(scheduleId) });
  }

  const deals = await CropDeal.find({
    membership: { $in: [...membershipMap.keys()].map((id) => new mongoose.Types.ObjectId(id)) },
    status: "APPROVED",
    "growth.stage": "READY",
    $or: activeScheduleFilter,
  })
    .populate({ path: "crop", populate: { path: "crop", select: "name code category image" } })
    .sort({ "growth.lastUpdated": -1 })
    .lean();

  const readyDeals = deals
    .filter((d) => d.crop && d.crop.status !== "INACTIVE" && d.agreedPrice > 0)
    .map((d) => {
      const membership = membershipMap.get(d.membership.toString());
      const { name, code } = cropLabel(d.crop);
      return {
        _id: d._id,
        agreedPrice: d.agreedPrice,
        expectedPickupDate: d.schedule?.expectedPickupDate || null,
        lastUpdated: d.growth?.lastUpdated || null,
        cropImage: d.growth?.images?.[0] || d.crop?.crop?.image || "",
        crop: {
          _id: d.crop?._id,
          name,
          code,
          category: d.crop?.crop?.category || "",
          image: d.crop?.crop?.image || "",
        },
        expectedQuantity: d.growth?.expectedQuantity || d.requestedQuantity || d.crop?.yield || 0,
        membership: membership
          ? {
              _id: membership._id,
              farmer: membership.farmer,
              zone: membership.zone,
              distance: membership.distance,
              balance: membership.balance,
            }
          : null,
      };
    })
    .filter((d) => d.membership);

  return { success: true, message: "Ready deals fetched !!", deals: readyDeals };
};

// ══════════════════════════════════════════════════════════════════════════════
// LIFECYCLE
// ══════════════════════════════════════════════════════════════════════════════

/** Mark a pickup as started — driver is on route. */
const startSchedule = async (collectiveId, schedule) => {
  schedule.status = "IN_PROGRESS";
  schedule.startedAt = new Date();
  await schedule.save();
  await Driver.findByIdAndUpdate(schedule.driver, { $set: { status: "ONROUTE" } });

  const items = await ScheduleItem.find({ schedule: schedule._id }).select("farmerGroup").lean();
  const farmerIds = [...new Set(items.map((i) => i.farmerGroup.toString()))];

  await Notification.insertMany(
    farmerIds.map((farmerId) => ({
      recipient: farmerId,
      recipientRole: "FARMER_GROUP",
      type: "PICKUP",
      title: `Pickup In Progress · ${schedule.code}`,
      body: `The driver is on the way for today's collection. Please keep the harvest ready.`,
      data: { scheduleId: schedule._id, scheduleCode: schedule.code },
      sender: collectiveId,
    })),
  );

  return { success: true, message: "Pickup marked as in progress !!", schedule };
};

/**
 * Complete a pickup. Optionally correct the actual collected quantities:
 * items = [{ itemId, collectedQuantity, status, remark }]
 * This is the moment money is accrued to the farmer group's balance.
 */
const completeSchedule = async (collectiveId, schedule, corrections = []) => {
  const items = await ScheduleItem.find({ schedule: schedule._id });
  if (items.length === 0) throwErr(400, "This pickup has no crop lines to complete !!");

  const correctionMap = new Map(
    (Array.isArray(corrections) ? corrections : [])
      .filter((c) => c?.itemId)
      .map((c) => [String(c.itemId), c]),
  );

  let totalAmount = 0;
  let totalQuantity = 0;
  const perMembership = new Map();
  const perFarmer = new Map();

  for (const item of items) {
    const correction = correctionMap.get(item._id.toString());

    if (correction?.status === "SKIPPED") {
      item.status = "SKIPPED";
      item.collectedQuantity = 0;
      item.totalAmount = 0;
    } else {
      const qty =
        correction?.collectedQuantity !== undefined && correction?.collectedQuantity !== null
          ? Number(correction.collectedQuantity)
          : item.collectedQuantity;
      if (Number.isNaN(qty) || qty < 0)
        throwErr(400, "Collected quantity must be a positive number !!");
      item.status = qty > 0 ? "COLLECTED" : "SKIPPED";
      item.collectedQuantity = qty;
      item.totalAmount = round2(qty * item.agreedPrice);
    }
    if (correction?.remark !== undefined) item.remark = String(correction.remark).slice(0, 1000);

    totalAmount = round2(totalAmount + item.totalAmount);
    totalQuantity = round2(totalQuantity + item.collectedQuantity);

    const mId = item.membership.toString();
    perMembership.set(mId, round2((perMembership.get(mId) || 0) + item.totalAmount));

    const fId = item.farmerGroup.toString();
    if (!perFarmer.has(fId)) perFarmer.set(fId, { amount: 0, crops: 0, quantity: 0 });
    const f = perFarmer.get(fId);
    f.amount = round2(f.amount + item.totalAmount);
    f.quantity = round2(f.quantity + item.collectedQuantity);
    if (item.status === "COLLECTED") f.crops += 1;
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const item of items) {
        await item.save({ session });

        // Release the deal and record its lifetime collection stats.
        const deal = await CropDeal.findByIdAndUpdate(
          item.cropDeal,
          {
            $set: {
              "schedule.activeSchedule": null,
              "schedule.collectedQuantity": item.collectedQuantity,
              "schedule.lastPickupDate": schedule.pickupDate,
              "growth.stage": item.status === "COLLECTED" ? "OTHER" : "READY",
            },
            $inc: {
              "schedule.totalCollected": item.collectedQuantity,
              "schedule.pickupCount": item.status === "COLLECTED" ? 1 : 0,
            },
          },
          { session, new: true },
        ).populate({ path: "crop", select: "crop yield" });

        if (item.status === "COLLECTED" && item.collectedQuantity > 0) {
          // Deduct the collected quantity from the partner farmer's crop account.
          const farmerCrop = deal?.crop?._id ? await FarmerCrop.findById(deal.crop._id).session(session) : null;
          if (farmerCrop) {
            farmerCrop.yield = Math.max(0, (farmerCrop.yield || 0) - item.collectedQuantity);
            await farmerCrop.save({ session });
          }

          // Update collective's crop inventory stock when crop is collected
          if (deal?.crop?.crop) {
            await CollectedCrop.findOneAndUpdate(
              { collective: collectiveId, crop: deal.crop.crop },
              { $inc: { quantity: item.collectedQuantity } },
              { session },
            );
          }
        }
      }

      // Money owed becomes real only once the crops are physically collected.
      for (const [membershipId, amount] of perMembership) {
        if (amount <= 0) continue;
        await Membership.findByIdAndUpdate(
          membershipId,
          { $inc: { balance: amount } },
          { session },
        );
      }
      for (const [farmerId, summary] of perFarmer) {
        // Only count as a pickup when something was actually collected —
        // a fully-skipped line must not inflate pickup stats.
        const inc = { pendingBalance: summary.amount };
        if (summary.quantity > 0) inc.totalPickups = 1;
        await FarmerGroup.findByIdAndUpdate(farmerId, { $inc: inc }, { session });
      }

      schedule.status = "COMPLETED";
      schedule.completedAt = new Date();
      schedule.totalAmount = totalAmount;
      schedule.totalQuantity = totalQuantity;
      await schedule.save({ session });

      await Driver.findByIdAndUpdate(
        schedule.driver,
        { $inc: { totalDeliveries: 1 }, $set: { status: "AVAILABLE" } },
        { session },
      );
    });
  } finally {
    await session.endSession();
  }

  // Farmers who had nothing collected receive no completion notification —
  // a ₹0 balance message is noise, not information.
  const notifyFarmers = [...perFarmer.entries()].filter(
    ([, summary]) => summary.quantity > 0 || summary.amount > 0,
  );

  await Notification.insertMany(
    notifyFarmers.map(([farmerId, summary]) => ({
      recipient: farmerId,
      recipientRole: "FARMER_GROUP",
      type: "PICKUP",
      title: `Pickup Completed · ${schedule.code}`,
      body: `${summary.crops} crop(s) (${summary.quantity} kg) were collected on ${fmtDate(
        schedule.pickupDate,
      )}. ₹${summary.amount.toLocaleString("en-IN")} has been added to your pending balance.`,
      data: {
        scheduleId: schedule._id,
        scheduleCode: schedule.code,
        amount: summary.amount,
      },
      sender: collectiveId,
    })),
  );

  return { success: true, message: "Pickup completed and balances updated !!", schedule };
};

/** Move a pickup to a new date (still within the three week window). */
const postponeSchedule = async (collectiveId, schedule, newDate, reason) => {
  if (!newDate) throwErr(400, "A new pickup date is required when postponing !!");
  const date = validatePickupDate(newDate, "New pickup date");

  const previous = schedule.pickupDate;
  schedule.postponeHistory.push({
    from: previous,
    to: date,
    reason: reason || "",
    at: new Date(),
  });
  schedule.pickupDate = date;
  schedule.status = "POSTPONED";
  await schedule.save();

  const items = await ScheduleItem.find({ schedule: schedule._id }).select("farmerGroup").lean();
  const farmerIds = [...new Set(items.map((i) => i.farmerGroup.toString()))];

  await Notification.insertMany(
    farmerIds.map((farmerId) => ({
      recipient: farmerId,
      recipientRole: "FARMER_GROUP",
      type: "PICKUP",
      title: `Pickup Postponed · ${schedule.code}`,
      body: `The pickup planned for ${fmtDate(previous)} has been moved to ${fmtDate(date)}.${
        reason ? ` Reason: ${reason}` : ""
      }`,
      data: { scheduleId: schedule._id, scheduleCode: schedule.code, pickupDate: date },
      sender: collectiveId,
    })),
  );

  return { success: true, message: "Pickup postponed !!", schedule };
};

/** Cancel a pickup and release every crop back into the ready pool. */
const cancelSchedule = async (collectiveId, schedule, reason) => {
  const items = await ScheduleItem.find({ schedule: schedule._id });

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const item of items) {
        item.status = "CANCELLED";
        await item.save({ session });
        await CropDeal.findByIdAndUpdate(
          item.cropDeal,
          { $set: { "schedule.activeSchedule": null, "schedule.collectedQuantity": 0 } },
          { session },
        );
      }

      schedule.status = "CANCELLED";
      schedule.cancelledAt = new Date();
      schedule.cancellationReason = reason || "";
      await schedule.save({ session });

      await Driver.findByIdAndUpdate(
        schedule.driver,
        { $set: { status: "AVAILABLE" } },
        { session },
      );
    });
  } finally {
    await session.endSession();
  }

  const farmerIds = [...new Set(items.map((i) => i.farmerGroup.toString()))];
  await Notification.insertMany(
    farmerIds.map((farmerId) => ({
      recipient: farmerId,
      recipientRole: "FARMER_GROUP",
      type: "PICKUP",
      title: `Pickup Cancelled · ${schedule.code}`,
      body: `The pickup planned for ${fmtDate(schedule.pickupDate)} has been cancelled.${
        reason ? ` Reason: ${reason}` : ""
      } Your crops are available for rescheduling.`,
      data: { scheduleId: schedule._id, scheduleCode: schedule.code },
      sender: collectiveId,
    })),
  );

  return { success: true, message: "Pickup cancelled and crops released !!", schedule };
};

/** Single entry point used by the route: dispatches to the lifecycle helpers. */
const updateScheduleStatus = async (
  collectiveId,
  scheduleId,
  { status, newDate, reason, items },
) => {
  const allowed = ["IN_PROGRESS", "COMPLETED", "POSTPONED", "CANCELLED"];
  if (!allowed.includes(status)) throwErr(400, "Invalid pickup status !!");

  const schedule = await Schedule.findOne({ _id: scheduleId, collective: collectiveId });
  if (!schedule) throwErr(404, "Schedule not found !!");
  if (["COMPLETED", "CANCELLED"].includes(schedule.status))
    throwErr(400, "A completed or cancelled pickup can no longer be modified !!");

  if (status === "IN_PROGRESS") {
    if (schedule.status === "IN_PROGRESS") throwErr(400, "This pickup is already in progress !!");
    return startSchedule(collectiveId, schedule);
  }
  if (status === "COMPLETED") return completeSchedule(collectiveId, schedule, items);
  if (status === "POSTPONED") return postponeSchedule(collectiveId, schedule, newDate, reason);
  return cancelSchedule(collectiveId, schedule, reason);
};

// ══════════════════════════════════════════════════════════════════════════════
// PAYMENTS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Settle a farmer group's crops for one pickup. Proof of payment is mandatory —
 * the pickup record plus this receipt is the audit trail.
 * itemIds (optional) limits the payment to specific crop lines.
 */
const payFarmerForSchedule = async (
  collectiveId,
  scheduleId,
  farmerGroupId,
  { paymentProof, utrNumber, remarks, method, itemIds } = {},
) => {
  if (!scheduleId || !farmerGroupId)
    throwErr(400, "scheduleId and farmerGroupId are required !!");
  if (!paymentProof || !String(paymentProof).trim())
    throwErr(400, "A proof of payment is required before marking a farmer group as paid !!");

  const schedule = await Schedule.findOne({ _id: scheduleId, collective: collectiveId });
  if (!schedule) throwErr(404, "Schedule not found !!");
  if (schedule.status !== "COMPLETED")
    throwErr(400, "Payment can only be recorded once the pickup is completed !!");

  const query = {
    schedule: scheduleId,
    farmerGroup: farmerGroupId,
    paymentStatus: "PENDING",
    status: "COLLECTED",
  };
  if (Array.isArray(itemIds) && itemIds.length > 0) query._id = { $in: itemIds };

  const items = await ScheduleItem.find(query);
  if (items.length === 0)
    throwErr(400, "There is nothing pending to pay for this farmer group in this pickup !!");

  const totalPayment = round2(items.reduce((sum, item) => sum + item.totalAmount, 0));
  if (totalPayment <= 0) throwErr(400, "The pending amount for this farmer group is zero !!");

  const membership = await Membership.findOne({ farmer: farmerGroupId, collective: collectiveId });
  if (!membership) throwErr(404, "Membership not found for this farmer group !!");

  const balanceAfter = round2(Math.max(0, (membership.balance || 0) - totalPayment));
  const proof = String(paymentProof).trim();
  const paidAt = new Date();

  const session = await mongoose.startSession();
  let transaction;
  try {
    await session.withTransaction(async () => {
      const code = await generateId("payment", session);

      [transaction] = await PaymentTransaction.create(
        [
          {
            code,
            collective: collectiveId,
            farmerGroup: farmerGroupId,
            membership: membership._id,
            schedule: scheduleId,
            items: items.map((i) => i._id),
            amount: totalPayment,
            balanceAfter,
            method: method || "OTHER",
            paymentProof: proof,
            utrNumber: utrNumber || "",
            remarks: remarks || "",
            paymentDate: paidAt,
          },
        ],
        { session },
      );

      await ScheduleItem.updateMany(
        { _id: { $in: items.map((i) => i._id) } },
        {
          $set: {
            paymentStatus: "PAID",
            paymentProof: proof,
            paidAt,
            paymentTransaction: transaction._id,
          },
        },
        { session },
      );

      await Membership.findByIdAndUpdate(
        membership._id,
        { $set: { balance: balanceAfter }, $inc: { totalEarnings: totalPayment } },
        { session },
      );

      const farmer = await FarmerGroup.findById(farmerGroupId).select("pendingBalance").session(session);
      await FarmerGroup.findByIdAndUpdate(
        farmerGroupId,
        {
          $set: { pendingBalance: round2(Math.max(0, (farmer?.pendingBalance || 0) - totalPayment)) },
          $inc: { totalEarnings: totalPayment },
        },
        { session },
      );

      await Schedule.findByIdAndUpdate(
        scheduleId,
        { $inc: { paidAmount: totalPayment } },
        { session },
      );

      // Mark each settled deal as paid for this cycle.
      for (const item of items) {
        await CropDeal.findByIdAndUpdate(
          item.cropDeal,
          { $set: { "schedule.paymentStatus": "PAID" } },
          { session },
        );
      }
    });
  } finally {
    await session.endSession();
  }

  await Notification.create({
    recipient: farmerGroupId,
    recipientRole: "FARMER_GROUP",
    type: "PAYMENT",
    title: `Payment Received · ₹${totalPayment.toLocaleString("en-IN")}`,
    body: `Your collective has recorded a payment of ₹${totalPayment.toLocaleString(
      "en-IN",
    )} for pickup ${schedule.code} (${items.length} crop(s)). Remaining balance: ₹${balanceAfter.toLocaleString(
      "en-IN",
    )}.`,
    data: {
      scheduleId,
      scheduleCode: schedule.code,
      amount: totalPayment,
      balanceAfter,
      paymentProof: proof,
      transactionId: transaction?._id,
    },
    sender: collectiveId,
  });

  return {
    success: true,
    message: "Payment recorded successfully !!",
    totalPayment,
    balanceAfter,
    transaction,
  };
};

/** Pay a single crop line — thin wrapper over the farmer-level settlement. */
const markItemPaid = async (collectiveId, scheduleId, itemId, payload = {}) => {
  const item = await ScheduleItem.findOne({ _id: itemId, schedule: scheduleId, collective: collectiveId });
  if (!item) throwErr(404, "Schedule item not found !!");
  if (item.paymentStatus === "PAID") throwErr(409, "This crop line is already paid !!");

  return payFarmerForSchedule(collectiveId, scheduleId, item.farmerGroup.toString(), {
    ...payload,
    itemIds: [item._id],
  });
};

/** Payment ledger for the collective, optionally scoped to a farmer or pickup. */
const getPayments = async (collectiveId, { farmerGroupId, scheduleId } = {}) => {
  const query = { collective: collectiveId };
  if (farmerGroupId) query.farmerGroup = farmerGroupId;
  if (scheduleId) query.schedule = scheduleId;

  const payments = await PaymentTransaction.find(query)
    .populate("farmerGroup", "name phone profile leadFarmer")
    .populate("schedule", "code pickupDate")
    .sort({ createdAt: -1 })
    .lean();

  const totalPaid = round2(payments.reduce((s, p) => s + (p.amount || 0), 0));

  return { success: true, message: "Payments fetched !!", payments, totalPaid };
};

/**
 * Everything the collective needs about one farmer group's money:
 * current balance, lifetime earnings, every pickup line and every receipt.
 */
const getFarmerLedger = async (collectiveId, farmerGroupId) => {
  const membership = await Membership.findOne({ farmer: farmerGroupId, collective: collectiveId })
    .populate("farmer", "name phone profile leadFarmer address")
    .populate("zone", "name color")
    .lean();
  if (!membership) throwErr(404, "This farmer group is not a member of your collective !!");

  const [items, payments] = await Promise.all([
    ScheduleItem.find({ collective: collectiveId, farmerGroup: farmerGroupId })
      .populate("schedule", "code pickupDate status")
      .sort({ createdAt: -1 })
      .lean(),
    PaymentTransaction.find({ collective: collectiveId, farmerGroup: farmerGroupId })
      .populate("schedule", "code pickupDate")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const collected = items.filter((i) => i.status === "COLLECTED");

  return {
    success: true,
    message: "Farmer ledger fetched !!",
    membership,
    summary: {
      balance: membership.balance || 0,
      totalEarnings: membership.totalEarnings || 0,
      totalCollected: round2(collected.reduce((s, i) => s + (i.collectedQuantity || 0), 0)),
      pickupCount: new Set(collected.map((i) => i.schedule?._id?.toString())).size,
      pendingAmount: round2(
        collected
          .filter((i) => i.paymentStatus === "PENDING")
          .reduce((s, i) => s + (i.totalAmount || 0), 0),
      ),
    },
    items,
    payments,
  };
};

/**
 * Update a schedule (change driver, date, or items).
 * Only SCHEDULED or POSTPONED pickups can be edited.
 * Zone cannot be changed. Adding/removing crop items is supported.
 */
const updateSchedule = async (collectiveId, scheduleId, { driverId, pickupDate, time, notes, items }) => {
  const schedule = await Schedule.findOne({ _id: scheduleId, collective: collectiveId });
  if (!schedule) throwErr(404, "Schedule not found !!");
  if (!["SCHEDULED", "POSTPONED"].includes(schedule.status))
    throwErr(400, "Only SCHEDULED or POSTPONED pickups can be edited !!");

  // Update driver if provided
  if (driverId) {
    const driver = await Driver.findOne({ _id: driverId, collective: collectiveId, status: { $ne: "INACTIVE" } });
    if (!driver) throwErr(404, "Driver not found or inactive !!");
    schedule.driver = driverId;
  }

  // Update date/time/notes
  if (pickupDate) {
    const date = validatePickupDate(pickupDate);
    // Track in postpone history if date changes
    if (schedule.pickupDate.toISOString().slice(0, 10) !== date.toISOString().slice(0, 10)) {
      schedule.postponeHistory.push({
        from: schedule.pickupDate,
        to: date,
        reason: "Schedule edited",
        at: new Date(),
      });
      schedule.pickupDate = date;
    }
  }
  if (time !== undefined) schedule.time = time;
  if (notes !== undefined) schedule.notes = notes;

  // Re-calculate items if provided
  if (Array.isArray(items)) {
    // Load current items
    const currentItems = await ScheduleItem.find({ schedule: schedule._id });

    // Find items to remove (in current but not in new list)
    const newDealIds = new Set(items.map((i) => String(i.cropDealId)));
    const toRemove = currentItems.filter((ci) => !newDealIds.has(String(ci.cropDeal)));

    // Find items to add (in new list but not in current)
    const currentDealIds = new Set(currentItems.map((ci) => String(ci.cropDeal)));
    const toAdd = items.filter((i) => !currentDealIds.has(String(i.cropDealId)));
    const toUpdate = items.filter((i) => currentDealIds.has(String(i.cropDealId)));

    // Track farmer notifications
    const changesByFarmer = {};
    const addChange = (farmerId, msg) => {
      const key = String(farmerId);
      if (!changesByFarmer[key]) changesByFarmer[key] = [];
      changesByFarmer[key].push(msg);
    };

    // ── Phase 1: validate EVERYTHING before mutating anything ──
    // A validation failure here must not leave partially-applied changes.

    // No deal may appear twice in the new item list
    const seen = new Set();
    for (const item of items) {
      const id = String(item.cropDealId);
      if (seen.has(id))
        throwErr(400, "The same crop deal cannot be added to a pickup twice !!");
      seen.add(id);
    }

    // Load and validate new deals, enforcing zone consistency
    const preparedAdds = [];
    if (toAdd.length > 0) {
      const newDeals = await CropDeal.find({
        _id: { $in: toAdd.map((i) => i.cropDealId) },
        status: "APPROVED",
        "growth.stage": "READY",
        $or: [{ "schedule.activeSchedule": null }, { "schedule.activeSchedule": { $exists: false } }],
      }).populate({
        path: "membership",
        match: { collective: collectiveId, status: "ACTIVE" },
      }).populate({ path: "crop", populate: { path: "crop", select: "name code" } });

      const validNewDeals = newDeals.filter((d) => d.membership);
      for (const deal of validNewDeals) {
        // Zone consistency
        const mZone = String(deal.membership.zone || "");
        if (mZone && mZone !== String(schedule.zone))
          throwErr(400, `Cannot add a crop from a different zone to this schedule !!`);

        const addItem = toAdd.find((i) => String(i.cropDealId) === String(deal._id));
        const qty = Number(addItem?.collectedQuantity) || deal.crop?.yield || 0;
        if (qty <= 0)
          throwErr(400, "Every selected crop needs a collection quantity greater than 0 !!");
        const { name, code } = cropLabel(deal.crop);
        const amount = round2(deal.agreedPrice * qty);

        preparedAdds.push({
          deal,
          qty,
          name,
          code,
          amount,
          farmer: deal.membership.farmer,
        });
      }
    }

    // Validate quantity updates of existing items
    const preparedUpdates = [];
    for (const item of toUpdate) {
      const currentItem = currentItems.find((ci) => String(ci.cropDeal) === String(item.cropDealId));
      if (!currentItem) continue;
      const qty = Number(item.collectedQuantity) || currentItem.collectedQuantity;
      if (Number.isNaN(qty) || qty < 0)
        throwErr(400, "Collected quantity must be a positive number !!");
      preparedUpdates.push({ currentItem, qty });
    }

    // Capacity check against the projected final state (before any write)
    const removedIds = new Set(toRemove.map((ci) => String(ci._id)));
    let projectedTotal = currentItems
      .filter((ci) => !removedIds.has(String(ci._id)))
      .reduce((sum, i) => sum + (i.collectedQuantity || 0), 0);
    projectedTotal += preparedAdds.reduce((sum, a) => sum + a.qty, 0);
    for (const { currentItem, qty } of preparedUpdates) {
      projectedTotal += qty - (currentItem.collectedQuantity || 0);
    }
    const driver = await Driver.findById(schedule.driver);
    if (driver?.capacity && projectedTotal > driver.capacity)
      throwErr(400, `Updated crop total exceeds ${driver.name}'s vehicle capacity of ${driver.capacity} kg !!`);

    // ── Phase 2: apply the mutations ──

    // Release crop deals back to the pool for removed items
    for (const item of toRemove) {
      addChange(item.farmerGroup, `Crop dropped: ${item.cropName}`);
      await CropDeal.findByIdAndUpdate(item.cropDeal, {
        $set: { "schedule.activeSchedule": null },
      });
      await item.deleteOne();
    }

    // Add the newly selected crops
    for (const { deal, qty, name, code, amount, farmer } of preparedAdds) {
      const newItem = new ScheduleItem({
        schedule: schedule._id,
        collective: collectiveId,
        farmerGroup: farmer,
        membership: deal.membership._id,
        cropDeal: deal._id,
        cropName: name,
        cropCode: code,
        plannedQuantity: qty,
        collectedQuantity: qty,
        agreedPrice: deal.agreedPrice,
        totalAmount: amount,
      });
      await newItem.save();
      await CropDeal.findByIdAndUpdate(deal._id, { $set: { "schedule.activeSchedule": schedule._id } });

      addChange(farmer, `Crop added: ${name} (${qty} kg)`);
    }

    // Update quantities of existing crop items if modified
    for (const { currentItem, qty } of preparedUpdates) {
      if (currentItem.collectedQuantity !== qty) {
        const oldQty = currentItem.collectedQuantity;
        currentItem.plannedQuantity = qty;
        currentItem.collectedQuantity = qty;
        currentItem.totalAmount = round2(currentItem.agreedPrice * qty);
        await currentItem.save();

        addChange(currentItem.farmerGroup, `Quantity changed for ${currentItem.cropName}: ${oldQty} kg -> ${qty} kg`);
      }
    }

    // Recalculate schedule totals
    const allItems = await ScheduleItem.find({ schedule: schedule._id });
    schedule.totalAmount = round2(allItems.reduce((s, i) => s + i.totalAmount, 0));
    schedule.totalQuantity = round2(allItems.reduce((s, i) => s + i.collectedQuantity, 0));
    schedule.itemCount = allItems.length;
    const farmerIds = [...new Set(allItems.map((i) => i.farmerGroup.toString()))];
    schedule.farmerCount = farmerIds.length;

    // Insert notifications for each farmer group about their changes
    for (const [farmerId, messages] of Object.entries(changesByFarmer)) {
      if (messages.length > 0) {
        await Notification.create({
          recipient: farmerId,
          recipientRole: "FARMER_GROUP",
          type: "PICKUP",
          title: `Schedule Updated · ${schedule.code}`,
          body: `Your pickup schedule details have been updated:\n${messages.map(m => `• ${m}`).join("\n")}`,
          data: { scheduleId: schedule._id, scheduleCode: schedule.code },
          sender: collectiveId,
        });
      }
    }
  }

  await schedule.save();
  return { success: true, message: "Schedule updated successfully !!", schedule };
};

export default {
  createSchedule,
  updateSchedule,
  getSchedules,
  getScheduleDetail,
  getPickupDashboard,
  getReadyDeals,
  updateScheduleStatus,
  markItemPaid,
  payFarmerForSchedule,
  getPayments,
  getFarmerLedger,
};
