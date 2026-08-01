import FarmerCrop from "../models/farmerCrop.model.js";
import Membership from "../models/membership.model.js";
import CropDeal from "../models/cropDeal.model.js";
import ScheduleItem from "../models/scheduleItem.model.js";
import Schedule from "../models/schedule.model.js";
import Zone from "../models/zone.model.js";
import Driver from "../models/driver.model.js";
import CollectedCrop from "../models/collectedCrops.model.js";

// Pickups that are on the books but have not happened yet.
const OPEN_STATUSES = ["SCHEDULED", "IN_PROGRESS", "POSTPONED"];

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

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

// ── FARMER STATS ────────────────────────────────────────────────────────────
export const getFarmerStats = async (farmerId) => {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const memberships = await Membership.find({ farmer: farmerId })
    .select("_id status balance totalEarnings")
    .lean();
  const membershipIds = memberships.map((m) => m._id);

  const [activeCrops, activeDeals, readyDeals, pendingRequests, items] = await Promise.all([
    FarmerCrop.countDocuments({ farmer: farmerId, status: "ACTIVE" }),
    CropDeal.countDocuments({ membership: { $in: membershipIds }, status: "APPROVED" }),
    CropDeal.countDocuments({
      membership: { $in: membershipIds },
      status: "APPROVED",
      "growth.stage": "READY",
    }),
    CropDeal.countDocuments({ membership: { $in: membershipIds }, status: "REQUESTED" }),
    // Only this farmer's own crop lines — a schedule may carry several groups.
    ScheduleItem.find({ farmerGroup: farmerId })
      .populate({ path: "schedule", select: "status pickupDate code time" })
      .select("schedule totalAmount collectedQuantity paymentStatus status")
      .lean(),
  ]);

  let upcomingPickups = 0;
  let livePickups = 0;
  let unsettled = 0;
  let nextPickup = null;
  const seenSchedules = new Set();

  for (const item of items) {
    const schedule = item.schedule;
    if (!schedule) continue;

    if (item.status === "COLLECTED" && item.paymentStatus !== "PAID")
      unsettled = round2(unsettled + (item.totalAmount || 0));

    const id = schedule._id.toString();
    if (seenSchedules.has(id) || !OPEN_STATUSES.includes(schedule.status)) continue;
    seenSchedules.add(id);

    const date = new Date(schedule.pickupDate);
    if (date >= todayStart && date <= todayEnd) livePickups += 1;
    else if (date > todayEnd) upcomingPickups += 1;
    else continue;

    if (!nextPickup || date < new Date(nextPickup.pickupDate)) {
      nextPickup = {
        _id: schedule._id,
        code: schedule.code,
        pickupDate: schedule.pickupDate,
        time: schedule.time,
        status: schedule.status,
      };
    }
  }

  return {
    activeCrops,
    activeDeals,
    readyDeals,
    pendingRequests,
    activeCollectives: memberships.filter((m) => m.status === "ACTIVE").length,
    // Money the collectives still owe for crops already collected.
    outstandingBalance: round2(memberships.reduce((s, m) => s + (m.balance || 0), 0)),
    unsettledFromPickups: unsettled,
    totalEarnings: round2(memberships.reduce((s, m) => s + (m.totalEarnings || 0), 0)),
    upcomingPickups,
    livePickups,
    nextPickup,
  };
};

// ── COLLECTIVE STATS ────────────────────────────────────────────────────────
export const getCollectiveStats = async (collectiveId) => {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const memberships = await Membership.find({ collective: collectiveId })
    .select("_id status balance totalEarnings")
    .lean();
  const membershipIds = memberships.map((m) => m._id);

  const [
    totalCrops,
    activeZones,
    availableDrivers,
    totalDrivers,
    upcomingPickups,
    livePickups,
    pendingRequests,
    readyDeals,
    unpaidSchedules,
  ] = await Promise.all([
    CollectedCrop.countDocuments({ collective: collectiveId, status: "ACTIVE" }),
    Zone.countDocuments({ collective: collectiveId, status: "ACTIVE" }),
    // Driver has no "ACTIVE" state — anything that is not INACTIVE is on the roster.
    Driver.countDocuments({ collective: collectiveId, status: "AVAILABLE" }),
    Driver.countDocuments({ collective: collectiveId, status: { $ne: "INACTIVE" } }),
    Schedule.countDocuments({
      collective: collectiveId,
      status: { $in: OPEN_STATUSES },
      pickupDate: { $gt: todayEnd },
    }),
    Schedule.countDocuments({
      collective: collectiveId,
      status: { $in: OPEN_STATUSES },
      pickupDate: { $gte: todayStart, $lte: todayEnd },
    }),
    CropDeal.countDocuments({ membership: { $in: membershipIds }, status: "REQUESTED" }),
    CropDeal.countDocuments({
      membership: { $in: membershipIds },
      status: "APPROVED",
      "growth.stage": "READY",
      $or: [
        { "schedule.activeSchedule": null },
        { "schedule.activeSchedule": { $exists: false } },
      ],
    }),
    Schedule.find({
      collective: collectiveId,
      status: "COMPLETED",
      $expr: { $lt: ["$paidAmount", "$totalAmount"] },
    })
      .select("totalAmount paidAmount")
      .lean(),
  ]);

  return {
    totalCrops,
    activeZones,
    activeDrivers: availableDrivers,
    totalDrivers,
    upcomingPickups,
    livePickups,
    pendingRequests,
    readyDeals,
    activeMembers: memberships.filter((m) => m.status === "ACTIVE").length,
    // What the collective still owes across every completed-but-unsettled pickup.
    pendingPayout: round2(
      unpaidSchedules.reduce((s, sc) => s + ((sc.totalAmount || 0) - (sc.paidAmount || 0)), 0),
    ),
    totalPaidOut: round2(memberships.reduce((s, m) => s + (m.totalEarnings || 0), 0)),
  };
};

export default {
  getFarmerStats,
  getCollectiveStats,
};
