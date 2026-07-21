import ScheduleItem from "../../models/scheduleItem.model.js";
import CropDeal from "../../models/cropDeal.model.js";
import Membership from "../../models/membership.model.js";
import throwErr from "../../utils/throwErr.js";

// ── Get all pickup items for a farmer (pickup history) ────────────────────────
const getFarmerPickups = async (farmerId) => {
  const items = await ScheduleItem.find({ farmerGroup: farmerId })
    .populate({
      path: "schedule",
      populate: [
        { path: "driver", select: "name phone vehicleNumber" },
        { path: "zone", select: "name color" },
        { path: "collective", select: "name phone" },
      ],
    })
    .populate({ path: "cropDeal", populate: { path: "crop", select: "name code" } })
    .sort({ createdAt: -1 })
    .lean();

  // Separate into upcoming and past
  const now = new Date();
  const upcoming = items.filter((i) => i.schedule && new Date(i.schedule.pickupDate) >= now && i.schedule.status === "SCHEDULED");
  const past = items.filter((i) => !upcoming.includes(i));

  return {
    success: true,
    message: "Pickup history fetched !!",
    upcoming,
    past,
  };
};

// ── Get farmer balance per collective ─────────────────────────────────────────
const getFarmerBalance = async (farmerId) => {
  const memberships = await Membership.find({ farmer: farmerId })
    .populate("collective", "name phone profile")
    .lean();

  const balances = memberships.map((m) => ({
    collectiveId: m.collective._id,
    collectiveName: m.collective.name,
    collectivePhone: m.collective.phone,
    collectiveProfile: m.collective.profile,
    balance: m.balance,
    totalEarnings: m.totalEarnings,
    membershipId: m._id,
  }));

  const totalBalance = balances.reduce((sum, b) => sum + b.balance, 0);

  return {
    success: true,
    message: "Balance fetched !!",
    totalBalance,
    balances,
  };
};

export default { getFarmerPickups, getFarmerBalance };
