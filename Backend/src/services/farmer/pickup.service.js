import ScheduleItem from "../../models/scheduleItem.model.js";
import Membership from "../../models/membership.model.js";
import FarmerGroup from "../../models/farmerGroup.model.js";
import PaymentTransaction from "../../models/paymentTransaction.model.js";
import throwErr from "../../utils/throwErr.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

// Pickup is on the books but has not happened yet.
const OPEN_STATUSES = ["SCHEDULED", "IN_PROGRESS", "POSTPONED"];

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Roll the farmer's crop lines up into one entry per pickup. The farmer only
 * ever sees their own lines — never another group's crops from the same run.
 */
const groupItemsBySchedule = (items) => {
  const map = new Map();

  for (const item of items) {
    const schedule = item.schedule;
    if (!schedule) continue; // orphaned line — schedule was hard removed

    const id = schedule._id.toString();
    if (!map.has(id)) {
      map.set(id, {
        _id: schedule._id,
        code: schedule.code || "",
        pickupDate: schedule.pickupDate,
        time: schedule.time || "09:00",
        status: schedule.status,
        notes: schedule.notes || "",
        cancellationReason: schedule.cancellationReason || "",
        postponeHistory: schedule.postponeHistory || [],
        startedAt: schedule.startedAt || null,
        completedAt: schedule.completedAt || null,
        collective: schedule.collective || null,
        driver: schedule.driver || null,
        zone: schedule.zone || null,
        items: [],
        cropCount: 0,
        totalQuantity: 0,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        paymentStatus: "PENDING",
      });
    }

    const entry = map.get(id);
    entry.items.push({
      _id: item._id,
      cropName: item.cropName,
      cropCode: item.cropCode,
      cropDeal: item.cropDeal,
      plannedQuantity: item.plannedQuantity,
      collectedQuantity: item.collectedQuantity,
      agreedPrice: item.agreedPrice,
      totalAmount: item.totalAmount,
      status: item.status,
      paymentStatus: item.paymentStatus,
      paymentProof: item.paymentProof || "",
      paidAt: item.paidAt || null,
      remark: item.remark || "",
    });

    entry.cropCount += 1;
    entry.totalQuantity = round2(entry.totalQuantity + (item.collectedQuantity || 0));
    entry.totalAmount = round2(entry.totalAmount + (item.totalAmount || 0));
    if (item.paymentStatus === "PAID") {
      entry.paidAmount = round2(entry.paidAmount + (item.totalAmount || 0));
    } else {
      entry.pendingAmount = round2(entry.pendingAmount + (item.totalAmount || 0));
    }
  }

  // Derive a single payment badge per pickup.
  for (const entry of map.values()) {
    if (entry.totalAmount <= 0) entry.paymentStatus = "PENDING";
    else if (entry.pendingAmount <= 0) entry.paymentStatus = "PAID";
    else if (entry.paidAmount > 0) entry.paymentStatus = "PARTIAL";
    else entry.paymentStatus = "PENDING";
  }

  return [...map.values()];
};

/** Every crop line belonging to this farmer, with its pickup fully populated. */
const loadFarmerItems = (farmerId, extraQuery = {}) =>
  ScheduleItem.find({ farmerGroup: farmerId, ...extraQuery })
    .populate({
      path: "schedule",
      populate: [
        { path: "driver", select: "name phone vehicleNumber capacity" },
        { path: "zone", select: "name color" },
        { path: "collective", select: "name phone profile" },
      ],
    })
    .sort({ createdAt: -1 })
    .lean();

// ── Pickup history, split into live / upcoming / past ─────────────────────────

const getFarmerPickups = async (farmerId) => {
  const items = await loadFarmerItems(farmerId);
  const pickups = groupItemsBySchedule(items);

  const today = startOfDay(new Date());
  const live = [];
  const upcoming = [];
  const past = [];

  for (const pickup of pickups) {
    const isOpen = OPEN_STATUSES.includes(pickup.status);
    const day = startOfDay(pickup.pickupDate);

    if (isOpen && day.getTime() === today.getTime()) live.push(pickup);
    else if (isOpen && day > today) upcoming.push(pickup);
    else past.push(pickup);
  }

  // Soonest first for what is still to come, most recent first for history.
  live.sort((a, b) => new Date(a.pickupDate) - new Date(b.pickupDate));
  upcoming.sort((a, b) => new Date(a.pickupDate) - new Date(b.pickupDate));
  past.sort((a, b) => new Date(b.pickupDate) - new Date(a.pickupDate));

  const collected = pickups.filter((p) => p.status === "COMPLETED");

  return {
    success: true,
    message: "Pickup history fetched !!",
    pickups,
    live,
    upcoming,
    past,
    summary: {
      liveCount: live.length,
      upcomingCount: upcoming.length,
      completedCount: collected.length,
      // Money already earned but not yet settled by any collective.
      pendingAmount: round2(collected.reduce((s, p) => s + p.pendingAmount, 0)),
      receivedAmount: round2(collected.reduce((s, p) => s + p.paidAmount, 0)),
      totalQuantity: round2(collected.reduce((s, p) => s + p.totalQuantity, 0)),
    },
  };
};

// ── One pickup in full, plus the receipts raised against it ───────────────────

const getFarmerPickupDetail = async (farmerId, scheduleId) => {
  const items = await loadFarmerItems(farmerId, { schedule: scheduleId });
  if (items.length === 0)
    throwErr(404, "Pickup not found or you were not part of it !!");

  const [pickup] = groupItemsBySchedule(items);
  if (!pickup) throwErr(404, "Pickup not found !!");

  const receipts = await PaymentTransaction.find({
    farmerGroup: farmerId,
    schedule: scheduleId,
  })
    .populate("collective", "name phone profile")
    .sort({ createdAt: -1 })
    .lean();

  return { success: true, message: "Pickup detail fetched !!", pickup, receipts };
};

// ── Balance & earnings, per collective and in total ───────────────────────────

const getFarmerBalance = async (farmerId) => {
  const [memberships, farmer, receipts, items] = await Promise.all([
    Membership.find({ farmer: farmerId })
      .populate("collective", "name phone profile")
      .populate("zone", "name color")
      .lean(),
    FarmerGroup.findById(farmerId)
      .select("totalEarnings pendingBalance totalPickups")
      .lean(),
    PaymentTransaction.find({ farmerGroup: farmerId })
      .populate("collective", "name phone profile")
      .populate("schedule", "code pickupDate")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
    ScheduleItem.find({ farmerGroup: farmerId, status: "COLLECTED" })
      .select("collective totalAmount collectedQuantity paymentStatus schedule")
      .lean(),
  ]);

  // Pending / collected money per collective, straight off the pickup lines.
  const perCollective = new Map();
  for (const item of items) {
    const key = item.collective?.toString();
    if (!key) continue;
    if (!perCollective.has(key))
      perCollective.set(key, { pending: 0, collected: 0, quantity: 0, pickups: new Set() });
    const entry = perCollective.get(key);
    entry.collected = round2(entry.collected + (item.totalAmount || 0));
    entry.quantity = round2(entry.quantity + (item.collectedQuantity || 0));
    if (item.schedule) entry.pickups.add(item.schedule.toString());
    if (item.paymentStatus !== "PAID")
      entry.pending = round2(entry.pending + (item.totalAmount || 0));
  }

  const balances = memberships
    .filter((m) => m.collective)
    .map((m) => {
      const stats = perCollective.get(m.collective._id.toString());
      return {
        membershipId: m._id,
        membershipStatus: m.status,
        collectiveId: m.collective._id,
        collectiveName: m.collective.name,
        collectivePhone: m.collective.phone,
        collectiveProfile: m.collective.profile,
        zone: m.zone || null,
        // Membership.balance is the authoritative ledger the collective settles
        // against; the line-level sum is shown next to it as a cross-check.
        balance: round2(m.balance || 0),
        totalEarnings: round2(m.totalEarnings || 0),
        unpaidFromPickups: round2(stats?.pending || 0),
        lifetimeCollected: round2(stats?.collected || 0),
        totalQuantity: round2(stats?.quantity || 0),
        pickupCount: stats?.pickups.size || 0,
        memberSince: m.memberSince || null,
      };
    })
    .sort((a, b) => b.balance - a.balance);

  return {
    success: true,
    message: "Balance fetched !!",
    totalBalance: round2(balances.reduce((s, b) => s + b.balance, 0)),
    totalEarnings: round2(balances.reduce((s, b) => s + b.totalEarnings, 0)),
    totalPickups: farmer?.totalPickups || 0,
    // Aggregates cached on the profile — handy for a quick sanity check.
    profileTotals: {
      totalEarnings: round2(farmer?.totalEarnings || 0),
      pendingBalance: round2(farmer?.pendingBalance || 0),
      totalPickups: farmer?.totalPickups || 0,
    },
    balances,
    receipts,
  };
};

export default { getFarmerPickups, getFarmerPickupDetail, getFarmerBalance };
