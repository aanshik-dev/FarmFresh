import User from "../models/user.model.js";
import Admin from "../models/admin.model.js";
import FarmerGroup from "../models/farmerGroup.model.js";
import Collective from "../models/collective.model.js";
import Membership from "../models/membership.model.js";
import Schedule from "../models/schedule.model.js";
import ScheduleItem from "../models/scheduleItem.model.js";
import Zone from "../models/zone.model.js";
import Review from "../models/review.model.js";
import Issue from "../models/issue.model.js";
import Contact from "../models/contact.model.js";
import PaymentTransaction from "../models/paymentTransaction.model.js";
import Crop from "../models/crop.model.js";
import FarmerCrop from "../models/farmerCrop.model.js";
import CollectedCrop from "../models/collectedCrops.model.js";
import CropDeal from "../models/cropDeal.model.js";
import generateId from "../services/idGenerator.service.js";
import uploadFile from "../utils/uploadFile.js";
import throwErr from "../utils/throwErr.js";

const formatAddress = (addr) => {
  if (!addr) return "N/A";
  if (typeof addr === "string") return addr.trim() || "N/A";
  if (typeof addr === "object" && addr !== null) {
    if (addr.formattedAddress && String(addr.formattedAddress).trim()) {
      return String(addr.formattedAddress).trim();
    }
    const parts = [
      addr.street,
      addr.village,
      addr.locality,
      addr.area,
      addr.town,
      addr.district,
      addr.city,
      addr.state,
      addr.pincode,
      addr.pinCode,
      addr.zip,
    ]
      .map((p) => (p ? String(p).trim() : ""))
      .filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "N/A";
  }
  return String(addr).trim() || "N/A";
};

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const last12Months = () => {
  const now = new Date();
  const rows = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    rows.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      month: MONTH_LABELS[d.getMonth()],
      kg: 0,
    });
  }
  return rows;
};

// ── Platform overview stats ──────────────────────────────────────────────────
const getStats = async (req, res, next) => {
  try {
    const [totalFarmerGroups, totalCollectives, totalUsers, openIssues, recentIssues] =
      await Promise.all([
        FarmerGroup.countDocuments(),
        Collective.countDocuments(),
        User.countDocuments(),
        Issue.countDocuments({ status: "OPEN" }),
        Issue.find({ status: "OPEN" })
          .sort({ createdAt: -1 })
          .limit(4)
          .select("title priority type reportedByName createdAt")
          .lean(),
      ]);

    const harvestRows = await Schedule.aggregate([
      { $match: { status: "COMPLETED", completedAt: { $ne: null } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$completedAt" } },
          kg: { $sum: { $ifNull: ["$totalQuantity", 0] } },
        },
      },
    ]);
    const harvestMap = new Map(harvestRows.map((r) => [r._id, r.kg]));
    const monthlyHarvest = last12Months().map((m) => ({
      month: m.month,
      kg: harvestMap.get(m.key) || 0,
    }));

    const recentGroups = await FarmerGroup.find()
      .sort({ createdAt: -1 })
      .limit(4)
      .lean();
    const recentGroupIds = recentGroups.map((g) => g._id);

    const [membershipAgg, ratingAgg] = await Promise.all([
      Membership.aggregate([
        { $match: { farmer: { $in: recentGroupIds } } },
        {
          $group: {
            _id: "$farmer",
            total: { $sum: 1 },
            active: {
              $sum: { $cond: [{ $eq: ["$status", "ACTIVE"] }, 1, 0] },
            },
          },
        },
      ]),
      Review.aggregate([
        { $match: { fid: { $in: recentGroupIds } } },
        {
          $group: {
            _id: "$fid",
            rating: { $avg: "$rating" },
            reviews: { $sum: 1 },
          },
        },
      ]),
    ]);
    const memMap = new Map(membershipAgg.map((m) => [String(m._id), m]));
    const rateMap = new Map(ratingAgg.map((r) => [String(r._id), r]));

    const groups = recentGroups.map((g) => {
      const mem = memMap.get(String(g._id));
      const rate = rateMap.get(String(g._id));
      return {
        id: g._id,
        name: g.name,
        leadFarmer: g.leadFarmer,
        farmerCount: g.farmerCount,
        profile: g.profile,
        memberships: mem?.total || 0,
        activeMemberships: mem?.active || 0,
        rating: rate ? Math.round(rate.rating * 10) / 10 : null,
      };
    });

    res.status(200).json({
      success: true,
      stats: {
        totalFarmerGroups,
        totalCollectives,
        totalUsers,
        openIssues,
        monthlyHarvest,
        recentGroups: groups,
        recentIssues,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── Farmer groups with membership/zone/rating/crop aggregates ────────────────
const getFarmerGroups = async (req, res, next) => {
  try {
    const groups = await FarmerGroup.find().sort({ createdAt: -1 }).lean();
    const groupIds = groups.map((g) => g._id);

    const [userRows, membershipAgg, ratingAgg, zoneAgg, cropAgg, collectiveAgg] = await Promise.all([
      User.find({ _id: { $in: groupIds } }).select("isActive").lean(),
      Membership.aggregate([
        { $match: { farmer: { $in: groupIds } } },
        {
          $group: {
            _id: "$farmer",
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ["$status", "ACTIVE"] }, 1, 0] } },
            totalBalance: { $sum: "$balance" },
            totalEarnings: { $sum: "$totalEarnings" },
          },
        },
      ]),
      Review.aggregate([
        { $match: { fid: { $in: groupIds } } },
        { $group: { _id: "$fid", rating: { $avg: "$rating" }, reviews: { $sum: 1 } } },
      ]),
      Membership.aggregate([
        { $match: { farmer: { $in: groupIds }, status: "ACTIVE", zone: { $ne: null } } },
        { $lookup: { from: "zones", localField: "zone", foreignField: "_id", as: "z" } },
        { $unwind: "$z" },
        { $group: { _id: "$farmer", zones: { $addToSet: "$z.name" } } },
      ]),
      // Active crops grown by each farmer group
      FarmerCrop.aggregate([
        { $match: { farmer: { $in: groupIds }, status: "ACTIVE" } },
        { $lookup: { from: "crops", localField: "crop", foreignField: "_id", as: "c" } },
        { $unwind: "$c" },
        { $group: { _id: "$farmer", crops: { $push: { name: "$c.name", code: "$c.code", category: "$c.category", image: "$c.image" } } } },
      ]),
      // Collectives they are members of with full details
      Membership.aggregate([
        { $match: { farmer: { $in: groupIds } } },
        { $lookup: { from: "collectives", localField: "collective", foreignField: "_id", as: "col" } },
        { $unwind: { path: "$col", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: "$farmer",
            collectives: {
              $push: {
                id: { $toString: "$col._id" },
                name: "$col.name",
                manager: "$col.manager",
                phone: "$col.phone",
                email: "$col.email",
                address: "$col.address",
                profile: "$col.profile",
                status: "$status",
                balance: "$balance",
                totalEarnings: "$totalEarnings",
                memberSince: "$createdAt",
              },
            },
          },
        },
      ]),
    ]);

    const userMap = new Map(userRows.map((u) => [String(u._id), u]));
    const memMap = new Map(membershipAgg.map((m) => [String(m._id), m]));
    const rateMap = new Map(ratingAgg.map((r) => [String(r._id), r]));
    const zoneMap = new Map(zoneAgg.map((z) => [String(z._id), z.zones]));
    const cropMap = new Map(cropAgg.map((c) => [String(c._id), c.crops]));
    const colMap = new Map(collectiveAgg.map((c) => [String(c._id), c.collectives]));

    const rows = groups.map((g) => {
      const mem = memMap.get(String(g._id));
      const rate = rateMap.get(String(g._id));
      return {
        id: String(g._id),
        name: g.name,
        leadFarmer: g.leadFarmer || "N/A",
        farmerCount: g.farmerCount || 0,
        email: g.email || "",
        phone: g.phone || "",
        profile: g.profile || "",
        address: formatAddress(g.address),
        status: userMap.get(String(g._id))?.isActive === false ? "inactive" : "active",
        totalPickups: g.totalPickups || 0,
        totalEarnings: mem?.totalEarnings || g.totalEarnings || 0,
        pendingBalance: mem?.totalBalance || g.pendingBalance || 0,
        memberships: mem?.total || 0,
        activeMemberships: mem?.active || 0,
        zones: zoneMap.get(String(g._id)) || [],
        crops: cropMap.get(String(g._id)) || [],
        collectives: colMap.get(String(g._id)) || [],
        rating: rate ? Math.round(rate.rating * 10) / 10 : null,
        reviews: rate?.reviews || 0,
        createdAt: g.createdAt,
      };
    });

    res.status(200).json({ success: true, groups: rows });
  } catch (error) {
    next(error);
  }
};

// ── Collectives with zone/membership/harvest/crop aggregates ─────────────────
const getCollectives = async (req, res, next) => {
  try {
    const collectives = await Collective.find().sort({ createdAt: -1 }).lean();
    const collectiveIds = collectives.map((c) => c._id);

    const [userRows, zoneAgg, memberAgg, harvestAgg, cropAgg, pendingAgg] = await Promise.all([
      User.find({ _id: { $in: collectiveIds } }).select("isActive").lean(),
      Zone.aggregate([
        { $match: { collective: { $in: collectiveIds }, status: "ACTIVE" } },
        { $group: { _id: "$collective", zones: { $addToSet: "$name" }, count: { $sum: 1 } } },
      ]),
      Membership.aggregate([
        { $match: { collective: { $in: collectiveIds } } },
        { $lookup: { from: "farmergroups", localField: "farmer", foreignField: "_id", as: "fg" } },
        { $unwind: { path: "$fg", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: "$collective",
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ["$status", "ACTIVE"] }, 1, 0] } },
            pendingBalance: { $sum: "$balance" },
            farmerGroups: {
              $push: {
                id: { $toString: "$fg._id" },
                name: "$fg.name",
                leadFarmer: "$fg.leadFarmer",
                farmerCount: "$fg.farmerCount",
                phone: "$fg.phone",
                email: "$fg.email",
                address: "$fg.address",
                profile: "$fg.profile",
                status: "$status",
                balance: "$balance",
                totalEarnings: "$totalEarnings",
                memberSince: "$createdAt",
              },
            },
          },
        },
      ]),
      Schedule.aggregate([
        { $match: { collective: { $in: collectiveIds }, status: "COMPLETED" } },
        { $group: { _id: "$collective", kg: { $sum: { $ifNull: ["$totalQuantity", 0] } }, schedules: { $sum: 1 } } },
      ]),
      // Crops collected by each collective
      CollectedCrop.aggregate([
        { $match: { collective: { $in: collectiveIds }, status: "ACTIVE" } },
        { $lookup: { from: "crops", localField: "crop", foreignField: "_id", as: "c" } },
        { $unwind: "$c" },
        { $group: { _id: "$collective", crops: { $push: { name: "$c.name", code: "$c.code", category: "$c.category", image: "$c.image", price: "$price", quantity: "$quantity" } } } },
      ]),
      // Pending payments (unpaid ScheduleItems)
      ScheduleItem.aggregate([
        { $match: { collective: { $in: collectiveIds }, paymentStatus: "PENDING", status: "COLLECTED" } },
        { $group: { _id: "$collective", pendingAmount: { $sum: "$totalAmount" }, pendingCount: { $sum: 1 } } },
      ]),
    ]);

    const userMap = new Map(userRows.map((u) => [String(u._id), u]));
    const zoneMap = new Map(zoneAgg.map((z) => [String(z._id), { zones: z.zones, count: z.count }]));
    const memMap = new Map(memberAgg.map((m) => [String(m._id), m]));
    const harvestMap = new Map(harvestAgg.map((h) => [String(h._id), h]));
    const cropMap = new Map(cropAgg.map((c) => [String(c._id), c.crops]));
    const pendingMap = new Map(pendingAgg.map((p) => [String(p._id), p]));

    const rows = collectives.map((c) => {
      const mem = memMap.get(String(c._id));
      const harvest = harvestMap.get(String(c._id));
      const zoneData = zoneMap.get(String(c._id));
      const pending = pendingMap.get(String(c._id));
      return {
        id: String(c._id),
        name: c.name,
        manager: c.manager || "N/A",
        workers: c.workers || 0,
        email: c.email || "",
        phone: c.phone || "",
        profile: c.profile || "",
        address: formatAddress(c.address),
        status: userMap.get(String(c._id))?.isActive === false ? "inactive" : "active",
        rating: c.ratingAvg || null,
        zones: zoneData?.zones || [],
        zonesCount: zoneData?.count || 0,
        memberships: mem?.total || 0,
        activeGroups: mem?.active || 0,
        farmerGroups: mem?.farmerGroups || [],
        pendingBalance: mem?.pendingBalance || 0,
        totalHarvestKg: harvest?.kg || 0,
        totalSchedules: harvest?.schedules || 0,
        crops: cropMap.get(String(c._id)) || [],
        pendingPaymentAmount: pending?.pendingAmount || 0,
        pendingPaymentCount: pending?.pendingCount || 0,
        createdAt: c.createdAt,
      };
    });

    res.status(200).json({ success: true, collectives: rows });
  } catch (error) {
    next(error);
  }
};

// ── Generic Collection Explorer for GUI Database Tab ──────────────────────────
const getCollectionData = async (req, res, next) => {
  try {
    const { name } = req.params;
    let modelMap = {
      farmergroups: FarmerGroup,
      collectives: Collective,
      crops: Crop,
      memberships: Membership,
      zones: Zone,
      schedules: Schedule,
      scheduleitems: ScheduleItem,
      users: User,
      issues: Issue,
      reviews: Review,
      contacts: Contact,
      payments: PaymentTransaction,
    };

    const targetModel = modelMap[name.toLowerCase()];
    if (!targetModel) {
      throwErr(400, `Collection '${name}' not supported.`);
    }

    const docs = await targetModel.find().sort({ createdAt: -1 }).limit(100).lean();

    // Sanitize and format documents so all nested objects (like address) are single strings
    const formattedDocs = docs.map((doc) => {
      const cleanDoc = {};
      for (const [key, val] of Object.entries(doc)) {
        if (key === "address") {
          cleanDoc[key] = formatAddress(val);
        } else if (val instanceof Date) {
          cleanDoc[key] = val.toISOString();
        } else if (typeof val === "object" && val !== null) {
          if (val._id) {
            cleanDoc[key] = String(val.name || val.code || val.title || val._id);
          } else if (Array.isArray(val)) {
            cleanDoc[key] = val.map((v) => (typeof v === "object" ? String(v.name || v.code || JSON.stringify(v)) : String(v))).join(", ");
          } else {
            cleanDoc[key] = formatAddress(val);
          }
        } else {
          cleanDoc[key] = val;
        }
      }
      return cleanDoc;
    });

    res.status(200).json({ success: true, collection: name, count: formattedDocs.length, docs: formattedDocs });
  } catch (error) {
    next(error);
  }
};

// ── All platform users with profile info ─────────────────────────────────────
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    const fgIds = users.filter((u) => u.role === "FARMER_GROUP").map((u) => u._id);
    const colIds = users.filter((u) => u.role === "COLLECTIVE").map((u) => u._id);
    const adminIds = users.filter((u) => u.role === "ADMIN").map((u) => u._id);

    const [fgProfiles, colProfiles, adminProfiles] = await Promise.all([
      FarmerGroup.find({ _id: { $in: fgIds } })
        .select("name phone profile leadFarmer farmerCount")
        .lean(),
      Collective.find({ _id: { $in: colIds } })
        .select("name phone profile manager workers")
        .lean(),
      Admin.find({ _id: { $in: adminIds } })
        .select("name phone profile")
        .lean(),
    ]);

    const fgMap = new Map(fgProfiles.map((p) => [String(p._id), p]));
    const colMap = new Map(colProfiles.map((p) => [String(p._id), p]));
    const adminMap = new Map(adminProfiles.map((p) => [String(p._id), p]));

    const rows = users.map((u) => {
      let profile = null;
      let sub = "";
      if (u.role === "FARMER_GROUP") {
        profile = fgMap.get(String(u._id));
        sub = profile ? `${profile.leadFarmer} · ${profile.farmerCount} farmers` : "";
      } else if (u.role === "COLLECTIVE") {
        profile = colMap.get(String(u._id));
        sub = profile ? `${profile.manager} · ${profile.workers} workers` : "";
      } else if (u.role === "ADMIN") {
        profile = adminMap.get(String(u._id));
        sub = "Platform administrator";
      }
      return {
        id: u._id,
        uid: u.uid,
        email: u.username,
        role: u.role,
        isActive: u.isActive,
        lastLogin: u.lastLogin,
        createdAt: u.createdAt,
        name: profile?.name || u.username,
        phone: profile?.phone || "",
        profile: profile?.profile || "",
        sub,
      };
    });

    res.status(200).json({ success: true, users: rows });
  } catch (error) {
    next(error);
  }
};

// ── Activate / deactivate a non-admin account ────────────────────────────────
const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    if (typeof isActive !== "boolean") {
      return throwErr(400, "isActive must be a boolean");
    }

    const target = await User.findById(id);
    if (!target) return throwErr(404, "User not found");
    if (target.role === "ADMIN" && !isActive) {
      return throwErr(400, "Admin accounts cannot be deactivated");
    }

    target.isActive = isActive;
    await target.save();

    res.status(200).json({
      success: true,
      message: isActive
        ? "User activated successfully"
        : "User deactivated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ── Issues ───────────────────────────────────────────────────────────────────
const getIssues = async (req, res, next) => {
  try {
    const issues = await Issue.find().sort({ createdAt: -1 }).lean();
    const assignedIds = issues
      .filter((i) => i.assignedTo)
      .map((i) => i.assignedTo);
    const assignedUsers = await User.find({ _id: { $in: assignedIds } })
      .select("username")
      .lean();
    const nameMap = new Map(assignedUsers.map((u) => [String(u._id), u.username]));

    const rows = issues.map((i) => ({
      id: i._id,
      title: i.title,
      description: i.description,
      type: i.type,
      priority: i.priority,
      status: i.status,
      reportedByName: i.reportedByName,
      reportedByRole: i.reportedByRole,
      assignedTo: nameMap.get(String(i.assignedTo)) || null,
      createdAt: i.createdAt,
    }));

    res.status(200).json({ success: true, issues: rows });
  } catch (error) {
    next(error);
  }
};

const updateIssueStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!["OPEN", "IN_PROGRESS", "RESOLVED"].includes(status)) {
      return throwErr(400, "Invalid issue status");
    }

    const issue = await Issue.findById(id);
    if (!issue) return throwErr(404, "Issue not found");

    issue.status = status;
    issue.assignedTo = status === "OPEN" ? null : req.user.id;
    issue.resolvedAt = status === "RESOLVED" ? new Date() : null;
    await issue.save();

    res.status(200).json({
      success: true,
      message: "Issue status updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ── Contact form submissions (inbox) ─────────────────────────────────────────
const getContacts = async (req, res, next) => {
  try {
    const contacts = await Contact.find()
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json({ success: true, contacts });
  } catch (error) {
    next(error);
  }
};

// ── Hard-delete a non-admin user ──────────────────────────────────────────────
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const target = await User.findById(id);
    if (!target) return throwErr(404, "User not found");
    if (target.role === "ADMIN") return throwErr(400, "Admin accounts cannot be deleted");

    await User.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// ── Platform-level payment overview ───────────────────────────────────────────
const getPaymentOverview = async (req, res, next) => {
  try {
    const [totalVolume, recentTx, byCollective] = await Promise.all([
      PaymentTransaction.aggregate([
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      PaymentTransaction.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("collective", "name")
        .populate("farmerGroup", "name")
        .lean(),
      PaymentTransaction.aggregate([
        {
          $group: {
            _id: "$collective",
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "collectives",
            localField: "_id",
            foreignField: "_id",
            as: "col",
          },
        },
        { $unwind: { path: "$col", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            collectiveName: { $ifNull: ["$col.name", "Unknown"] },
            total: 1,
            count: 1,
          },
        },
      ]),
    ]);

    res.status(200).json({
      success: true,
      overview: {
        totalVolume: totalVolume[0]?.total || 0,
        totalTransactions: totalVolume[0]?.count || 0,
        topCollectives: byCollective,
        recentTransactions: recentTx.map((t) => ({
          id: t._id,
          code: t.code,
          amount: t.amount,
          method: t.method,
          collective: t.collective?.name || "Unknown",
          farmerGroup: t.farmerGroup?.name || "Unknown",
          paymentDate: t.paymentDate,
          createdAt: t.createdAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── Extended platform analytics ───────────────────────────────────────────────
const getPlatformAnalytics = async (req, res, next) => {
  try {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const [userReg, issuesByPriority, issuesByType, issuesByStatus, contactsByStatus] =
      await Promise.all([
        // Monthly user registrations
        User.aggregate([
          { $match: { createdAt: { $gte: twelveMonthsAgo } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
              count: { $sum: 1 },
            },
          },
        ]),
        // Issues grouped by priority
        Issue.aggregate([
          { $group: { _id: "$priority", count: { $sum: 1 } } },
        ]),
        // Issues grouped by type
        Issue.aggregate([
          { $group: { _id: "$type", count: { $sum: 1 } } },
        ]),
        // Issues grouped by status
        Issue.aggregate([
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        // Contact submissions by status
        Contact.aggregate([
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
      ]);

    // Build full 12-month registration chart
    const regMap = new Map(userReg.map((r) => [r._id, r.count]));
    const monthlyRegistrations = last12Months().map((m) => ({
      month: m.month,
      count: regMap.get(m.key) || 0,
    }));

    res.status(200).json({
      success: true,
      analytics: {
        monthlyRegistrations,
        issuesByPriority,
        issuesByType,
        issuesByStatus,
        contactsByStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── Master crop list management ───────────────────────────────────────────────
const createCrop = async (req, res, next) => {
  try {
    const { name, category, season, image } = req.body;
    if (!name || !name.trim()) return throwErr(400, "Crop name is required !!");

    // Check duplicate name
    const existing = await Crop.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, "i") } });
    if (existing) return throwErr(400, `A crop named "${name.trim()}" already exists !!`);

    // Auto generate crop code
    const code = await generateId("crop");

    let imageUrl = image || "";
    // Upload image to Cloudinary if file provided (folder: Farmfresh/crops, public_id: crop code)
    if (req.file) {
      const fileName = `${code}`;
      const result = await uploadFile(req.file.buffer, "Farmfresh/crops", fileName, { overwrite: true });
      imageUrl = result.secure_url;
    }

    const crop = await Crop.create({
      code,
      name: name.trim(),
      category: category || "None",
      season: season || "Kharif",
      image: imageUrl,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "Crop created successfully !!",
      crop,
    });
  } catch (error) {
    next(error);
  }
};

const getCrops = async (req, res, next) => {
  try {
    const crops = await Crop.find().sort({ name: 1 }).lean();
    // Enrich each crop with usage stats
    const cropIds = crops.map((c) => c._id);
    const [farmerUsage, collectiveUsage] = await Promise.all([
      FarmerCrop.aggregate([
        { $match: { crop: { $in: cropIds }, status: "ACTIVE" } },
        { $group: { _id: "$crop", count: { $sum: 1 } } },
      ]),
      CollectedCrop.aggregate([
        { $match: { crop: { $in: cropIds }, status: "ACTIVE" } },
        { $group: { _id: "$crop", count: { $sum: 1 } } },
      ]),
    ]);
    const farmerUsageMap = new Map(farmerUsage.map((f) => [String(f._id), f.count]));
    const colUsageMap = new Map(collectiveUsage.map((c) => [String(c._id), c.count]));

    const enriched = crops.map((c) => ({
      ...c,
      farmerGroupsUsing: farmerUsageMap.get(String(c._id)) || 0,
      collectivesUsing: colUsageMap.get(String(c._id)) || 0,
    }));
    res.status(200).json({ success: true, crops: enriched });
  } catch (error) {
    next(error);
  }
};

const updateCrop = async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const { category, season, image, isActive } = body;

    const targetCrop = await Crop.findById(id);
    if (!targetCrop) return throwErr(404, "Crop not found");

    const update = {};
    if (category !== undefined) update.category = category;
    if (season !== undefined) update.season = season;
    if (isActive !== undefined) {
      update.isActive = String(isActive) === "true";
    }

    if (req.file) {
      const cropCode = targetCrop.code || `CP${id.slice(-6)}`;
      const fileName = `${cropCode}`;
      const result = await uploadFile(req.file.buffer, "Farmfresh/crops", fileName, { overwrite: true });
      update.image = result.secure_url;
    } else if (image !== undefined && image !== "") {
      update.image = image;
    }

    const crop = await Crop.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true });
    res.status(200).json({ success: true, message: "Crop updated successfully !!", crop });
  } catch (error) {
    next(error);
  }
};

// ── Platform relations explorer ───────────────────────────────────────────────
const getPlatformRelations = async (req, res, next) => {
  try {
    const { collectiveId, farmerGroupId, status } = req.query;
    const filter = {};
    if (collectiveId) filter.collective = collectiveId;
    if (farmerGroupId) filter.farmer = farmerGroupId;
    if (status) filter.status = status;

    const memberships = await Membership.find(filter)
      .sort({ createdAt: -1 })
      .populate("farmer", "name email phone leadFarmer farmerCount profile")
      .populate("collective", "name email phone manager profile")
      .populate("zone", "name color")
      .lean();

    const membershipIds = memberships.map((m) => m._id);

    // Get all crop deals for these memberships
    const deals = await CropDeal.find({ membership: { $in: membershipIds } })
      .populate({ path: "crop", populate: { path: "crop", select: "name code category image" } })
      .select("membership crop status agreedPrice demandedPrice schedule.paymentStatus schedule.totalCollected schedule.pickupCount growth.stage")
      .lean();

    const dealsByMembership = new Map();
    for (const d of deals) {
      const key = String(d.membership);
      if (!dealsByMembership.has(key)) dealsByMembership.set(key, []);
      dealsByMembership.get(key).push({
        dealId: d._id,
        cropName: d.crop?.crop?.name || "Unknown",
        cropCode: d.crop?.crop?.code || "",
        cropCategory: d.crop?.crop?.category || "",
        cropImage: d.crop?.crop?.image || "",
        status: d.status,
        agreedPrice: d.agreedPrice,
        demandedPrice: d.demandedPrice,
        paymentStatus: d.schedule?.paymentStatus,
        totalCollected: d.schedule?.totalCollected || 0,
        pickupCount: d.schedule?.pickupCount || 0,
        growthStage: d.growth?.stage,
      });
    }

    const rows = memberships.map((m) => ({
      membershipId: m._id,
      status: m.status,
      balance: m.balance,
      totalEarnings: m.totalEarnings,
      memberSince: m.memberSince,
      route: m.route,
      distance: m.distance,
      farmerGroup: m.farmer ? {
        id: m.farmer._id,
        name: m.farmer.name,
        email: m.farmer.email,
        phone: m.farmer.phone,
        leadFarmer: m.farmer.leadFarmer,
        farmerCount: m.farmer.farmerCount,
        profile: m.farmer.profile,
      } : null,
      collective: m.collective ? {
        id: m.collective._id,
        name: m.collective.name,
        email: m.collective.email,
        phone: m.collective.phone,
        manager: m.collective.manager,
        profile: m.collective.profile,
      } : null,
      zone: m.zone ? { name: m.zone.name, color: m.zone.color } : null,
      deals: dealsByMembership.get(String(m._id)) || [],
      createdAt: m.createdAt,
    }));

    res.status(200).json({ success: true, relations: rows, total: rows.length });
  } catch (error) {
    next(error);
  }
};

// ── Pending payments summary ──────────────────────────────────────────────────
const getPendingPayments = async (req, res, next) => {
  try {
    const items = await ScheduleItem.find({ paymentStatus: "PENDING", status: "COLLECTED" })
      .sort({ createdAt: -1 })
      .populate("farmerGroup", "name email profile leadFarmer")
      .populate("collective", "name email profile manager")
      .populate("schedule", "code pickupDate status")
      .lean();

    // Group by collective → farmerGroup
    const grouped = {};
    let grandTotal = 0;
    for (const item of items) {
      const colId = String(item.collective?._id);
      const fgId = String(item.farmerGroup?._id);
      if (!grouped[colId]) {
        grouped[colId] = {
          collective: item.collective,
          farmerGroups: {},
          totalPending: 0,
        };
      }
      if (!grouped[colId].farmerGroups[fgId]) {
        grouped[colId].farmerGroups[fgId] = {
          farmerGroup: item.farmerGroup,
          items: [],
          totalPending: 0,
        };
      }
      grouped[colId].farmerGroups[fgId].items.push({
        scheduleItemId: item._id,
        schedule: item.schedule,
        cropName: item.cropName,
        cropCode: item.cropCode,
        plannedQuantity: item.plannedQuantity,
        collectedQuantity: item.collectedQuantity,
        agreedPrice: item.agreedPrice,
        totalAmount: item.totalAmount,
        createdAt: item.createdAt,
      });
      grouped[colId].farmerGroups[fgId].totalPending += item.totalAmount;
      grouped[colId].totalPending += item.totalAmount;
      grandTotal += item.totalAmount;
    }

    // Convert to array
    const result = Object.values(grouped).map((g) => ({
      ...g,
      farmerGroups: Object.values(g.farmerGroups),
    }));

    res.status(200).json({ success: true, pendingPayments: result, grandTotal });
  } catch (error) {
    next(error);
  }
};

export default {
  getStats,
  getFarmerGroups,
  getCollectives,
  getUsers,
  updateUserStatus,
  getIssues,
  updateIssueStatus,
  getContacts,
  deleteUser,
  getPaymentOverview,
  getPlatformAnalytics,
  getCrops,
  createCrop,
  updateCrop,
  getPlatformRelations,
  getPendingPayments,
  getCollectionData,
};
