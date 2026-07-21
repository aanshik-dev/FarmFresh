import FarmerCrop from "../models/farmerCrop.model.js";
import Membership from "../models/membership.model.js";
import CropDeal from "../models/cropDeal.model.js";
import Notification from "../models/notification.model.js";
import ScheduleItem from "../models/scheduleItem.model.js";
import Schedule from "../models/schedule.model.js";
import Zone from "../models/zone.model.js";
import Driver from "../models/driver.model.js";
import CollectedCrop from "../models/collectedCrops.model.js";

// ── FARMER STATS ────────────────────────────────────────────────────────────
export const getFarmerStats = async (farmerId) => {
  // 1. Total crops planted (ACTIVE)
  const activeCrops = await FarmerCrop.countDocuments({
    farmer: farmerId,
    status: "ACTIVE",
  });

  // 2. Active deals (APPROVED)
  // Find memberships for this farmer
  const memberships = await Membership.find({ farmer: farmerId }).select("_id balance");
  const membershipIds = memberships.map((m) => m._id);

  const activeDeals = await CropDeal.countDocuments({
    membership: { $in: membershipIds },
    status: "APPROVED",
  });

  // 3. Outstanding balance (sum of membership balances)
  const outstandingBalance = memberships.reduce((sum, m) => sum + (m.balance || 0), 0);

  // 4. Upcoming pickups (ScheduleItems in PENDING paymentStatus + Scheduled status)
  // Actually, let's just count ScheduleItems for this farmer that belong to an IN_PROGRESS or SCHEDULED schedule
  const schedules = await Schedule.find({
    status: { $in: ["SCHEDULED", "IN_PROGRESS"] },
  }).select("_id");
  const scheduleIds = schedules.map((s) => s._id);

  const upcomingPickups = await ScheduleItem.countDocuments({
    farmerGroup: farmerId,
    schedule: { $in: scheduleIds },
  });

  return {
    activeCrops,
    activeDeals,
    outstandingBalance,
    upcomingPickups,
  };
};

// ── COLLECTIVE STATS ────────────────────────────────────────────────────────
export const getCollectiveStats = async (collectiveId) => {
  // 1. Total collected crops active (inventory categories)
  const totalCrops = await CollectedCrop.countDocuments({
    collective: collectiveId,
    status: "ACTIVE",
  });

  // 2. Total active zones
  const activeZones = await Zone.countDocuments({
    collective: collectiveId,
    status: "ACTIVE",
  });

  // 3. Online drivers (For now just active drivers)
  const activeDrivers = await Driver.countDocuments({
    collective: collectiveId,
    status: "ACTIVE",
  });

  // 4. Total scheduled/in_progress pickups
  const upcomingPickups = await Schedule.countDocuments({
    collective: collectiveId,
    status: { $in: ["SCHEDULED", "IN_PROGRESS"] },
  });

  // 5. Total members (active memberships)
  const activeMembers = await Membership.countDocuments({
    collective: collectiveId,
    status: "ACTIVE",
  });

  return {
    totalCrops,
    activeZones,
    activeDrivers,
    upcomingPickups,
    activeMembers,
  };
};

export default {
  getFarmerStats,
  getCollectiveStats,
};
