import User from "../models/user.model.js";
import Admin from "../models/admin.model.js";
import FarmerGroup from "../models/farmerGroup.model.js";
import Collective from "../models/collective.model.js";
import Membership from "../models/membership.model.js";
import Schedule from "../models/schedule.model.js";
import Zone from "../models/zone.model.js";
import Review from "../models/review.model.js";
import Issue from "../models/issue.model.js";
import throwErr from "../utils/throwErr.js";

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

// ── Farmer groups with membership/zone/rating aggregates ─────────────────────
const getFarmerGroups = async (req, res, next) => {
  try {
    const groups = await FarmerGroup.find().sort({ createdAt: -1 }).lean();
    const groupIds = groups.map((g) => g._id);

    const [userRows, membershipAgg, ratingAgg, zoneAgg] = await Promise.all([
      User.find({ _id: { $in: groupIds } }).select("isActive").lean(),
      Membership.aggregate([
        { $match: { farmer: { $in: groupIds } } },
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
        { $match: { fid: { $in: groupIds } } },
        {
          $group: {
            _id: "$fid",
            rating: { $avg: "$rating" },
            reviews: { $sum: 1 },
          },
        },
      ]),
      Membership.aggregate([
        { $match: { farmer: { $in: groupIds }, status: "ACTIVE", zone: { $ne: null } } },
        { $lookup: { from: "zones", localField: "zone", foreignField: "_id", as: "z" } },
        { $unwind: "$z" },
        { $group: { _id: "$farmer", zones: { $addToSet: "$z.name" } } },
      ]),
    ]);

    const userMap = new Map(userRows.map((u) => [String(u._id), u]));
    const memMap = new Map(membershipAgg.map((m) => [String(m._id), m]));
    const rateMap = new Map(ratingAgg.map((r) => [String(r._id), r]));
    const zoneMap = new Map(zoneAgg.map((z) => [String(z._id), z.zones]));

    const rows = groups.map((g) => {
      const mem = memMap.get(String(g._id));
      const rate = rateMap.get(String(g._id));
      return {
        id: g._id,
        name: g.name,
        leadFarmer: g.leadFarmer,
        farmerCount: g.farmerCount,
        email: g.email,
        phone: g.phone,
        profile: g.profile,
        status: userMap.get(String(g._id))?.isActive === false ? "inactive" : "active",
        totalPickups: g.totalPickups,
        totalEarnings: g.totalEarnings,
        pendingBalance: g.pendingBalance,
        memberships: mem?.total || 0,
        activeMemberships: mem?.active || 0,
        zones: zoneMap.get(String(g._id)) || [],
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

// ── Collectives with zone/membership/harvest aggregates ──────────────────────
const getCollectives = async (req, res, next) => {
  try {
    const collectives = await Collective.find().sort({ createdAt: -1 }).lean();
    const collectiveIds = collectives.map((c) => c._id);

    const [userRows, zoneAgg, memberAgg, harvestAgg] = await Promise.all([
      User.find({ _id: { $in: collectiveIds } }).select("isActive").lean(),
      Zone.aggregate([
        { $match: { collective: { $in: collectiveIds }, status: "ACTIVE" } },
        { $group: { _id: "$collective", zones: { $addToSet: "$name" } } },
      ]),
      Membership.aggregate([
        { $match: { collective: { $in: collectiveIds } } },
        {
          $group: {
            _id: "$collective",
            total: { $sum: 1 },
            active: {
              $sum: { $cond: [{ $eq: ["$status", "ACTIVE"] }, 1, 0] },
            },
          },
        },
      ]),
      Schedule.aggregate([
        { $match: { collective: { $in: collectiveIds }, status: "COMPLETED" } },
        {
          $group: {
            _id: "$collective",
            kg: { $sum: { $ifNull: ["$totalQuantity", 0] } },
          },
        },
      ]),
    ]);

    const userMap = new Map(userRows.map((u) => [String(u._id), u]));
    const zoneMap = new Map(zoneAgg.map((z) => [String(z._id), z.zones]));
    const memMap = new Map(memberAgg.map((m) => [String(m._id), m]));
    const harvestMap = new Map(harvestAgg.map((h) => [String(h._id), h.kg]));

    const rows = collectives.map((c) => {
      const mem = memMap.get(String(c._id));
      return {
        id: c._id,
        name: c.name,
        manager: c.manager,
        workers: c.workers,
        email: c.email,
        phone: c.phone,
        profile: c.profile,
        status: userMap.get(String(c._id))?.isActive === false ? "inactive" : "active",
        rating: c.ratingAvg,
        zones: zoneMap.get(String(c._id)) || [],
        memberships: mem?.total || 0,
        activeGroups: mem?.active || 0,
        totalHarvestKg: harvestMap.get(String(c._id)) || 0,
        createdAt: c.createdAt,
      };
    });

    res.status(200).json({ success: true, collectives: rows });
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

export default {
  getStats,
  getFarmerGroups,
  getCollectives,
  getUsers,
  updateUserStatus,
  getIssues,
  updateIssueStatus,
};
