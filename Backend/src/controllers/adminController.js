import User from "../models/user.model.js";
import FarmerGroup from "../models/farmerGroup.model.js";
import Collective from "../models/collective.model.js";

// Static-enriched data that can't yet come from DB (crops, zone, yield, etc.)
// These mirror InterfaceData.jsx and are merged with real DB records.
const STATIC_FG_EXTRAS = {
  "FG-001": { zone: "Zone C · High Alpine", yield: "450 kg", crops: ["Rajma", "Red Rice", "Amaranth"], rating: 4.8, reviews: 14, collective: "Mandakini Organic Collective", status: "active", memberSince: "March 2022" },
  "FG-002": { zone: "Zone B", yield: "390 kg", crops: ["Potato", "Buckwheat", "Peas"], rating: 4.5, reviews: 9, collective: "Kedarnath Valley Organics", status: "active", memberSince: "January 2023" },
  "FG-003": { zone: "Zone D", yield: "620 kg", crops: ["Rajma", "Barley", "Amaranth"], rating: 4.9, reviews: 21, collective: "Mandakini Organic Collective", status: "active", memberSince: "June 2021" },
  "FG-004": { zone: "Zone A", yield: "510 kg", crops: ["Spinach", "Cabbage", "Potato"], rating: 4.6, reviews: 17, collective: "Rudraprayag Farmers Alliance", status: "active", memberSince: "September 2022" },
  "FG-005": { zone: "Zone C", yield: "580 kg", crops: ["Rajma", "Turmeric", "Millets"], rating: 4.7, reviews: 12, collective: "Mandakini Organic Collective", status: "active", memberSince: "November 2021" },
};

const STATIC_COL_EXTRAS = {
  "COL-001": { zones: ["Zone B", "Zone C", "Zone D"], farmerGroups: 14, totalHarvest: "18.4t", isVerified: true, established: "2018", reviews: 62 },
  "COL-002": { zones: ["Zone A", "Zone B"], farmerGroups: 8, totalHarvest: "9.8t", isVerified: true, established: "2020", reviews: 38 },
  "COL-003": { zones: ["Zone A"], farmerGroups: 6, totalHarvest: "7.2t", isVerified: false, established: "2019", reviews: 29 },
};

// Static issues data (no model yet — matches IssueResolution.jsx expectations)
const STATIC_ISSUES = [
  { id: "iss_001", title: "Payment dispute — Zone C pickup July 3", type: "payment", priority: "high", status: "open", reportedBy: "Debendra Semwal", reportedByRole: "FARMER_GROUP", assignedTo: null, createdAt: "2026-07-03", description: "The payment for 120 kg of Rajma (₹14,400) has not been credited 48 hours after pickup." },
  { id: "iss_002", title: "Driver Mohan Rawat – vehicle breakdown", type: "operational", priority: "medium", status: "in_progress", reportedBy: "Ravi Kumar Sharma", reportedByRole: "COLLECTIVE", assignedTo: "Admin", createdAt: "2026-07-02", description: "Vehicle breakdown on the Kedarnath route during Zone D pickup. Alternate driver arranged." },
  { id: "iss_003", title: "Wrong crop quantity recorded in history", type: "data", priority: "low", status: "resolved", reportedBy: "Anita Rawat", reportedByRole: "FARMER_GROUP", assignedTo: "Admin", createdAt: "2026-06-29", description: "Schedule sch_004 shows 200 kg but actual was 185 kg." },
  { id: "iss_004", title: "Collective profile details incorrect", type: "account", priority: "low", status: "resolved", reportedBy: "Priya Negi", reportedByRole: "COLLECTIVE", assignedTo: "Admin", createdAt: "2026-06-25", description: "Phone number and address need to be updated for Kedarnath Valley Organics." },
];

const STATIC_MONTHLY_HARVEST = [
  { month: "Jan", kg: 1180 }, { month: "Feb", kg: 1340 }, { month: "Mar", kg: 1620 },
  { month: "Apr", kg: 1890 }, { month: "May", kg: 2210 }, { month: "Jun", kg: 2550 },
  { month: "Jul", kg: 2330 }, { month: "Aug", kg: 2680 }, { month: "Sep", kg: 2940 },
  { month: "Oct", kg: 3120 }, { month: "Nov", kg: 2780 }, { month: "Dec", kg: 2105 },
];

// ─── GET /api/admin/summary ─────────────────────────────────────────────────
// Returns: platformStats counts, recent farmer groups, open issues, harvest chart
export const getAdminSummary = async (req, res) => {
  try {
    const [farmerGroupCount, collectiveCount, totalUsers, farmerGroupDocs] = await Promise.all([
      FarmerGroup.countDocuments(),
      Collective.countDocuments(),
      User.countDocuments(),
      FarmerGroup.find().sort({ createdAt: -1 }).limit(4).lean(),
    ]);

    const openIssues = STATIC_ISSUES.filter((i) => i.status === "open");

    // Enrich recent farmer group records with static extras
    const recentFarmerGroups = farmerGroupDocs.map((g) => {
      const extras = STATIC_FG_EXTRAS[g.fid] || {};
      return {
        id: g.fid,
        groupName: g.name,
        leadFarmer: g.leadfarmer,
        numberOfFarmers: g.farmerCount,
        profilePhoto: g.profile,
        zone: extras.zone || "Unknown",
        crops: extras.crops || [],
        rating: extras.rating || 0,
        yield: extras.yield || "—",
        collective: extras.collective || "—",
        status: extras.status || "active",
      };
    });

    const summary = {
      stats: {
        farmerGroupCount,
        collectiveCount,
        openIssuesCount: openIssues.length,
        totalUsers,
      },
      recentFarmerGroups,
      openIssues,
      monthlyHarvest: STATIC_MONTHLY_HARVEST,
    };

    console.log("\n📊 [GET /api/admin/summary] Sending:", JSON.stringify(summary, null, 2));
    res.status(200).json(summary);
  } catch (error) {
    console.error("Admin summary error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ─── GET /api/admin/farmer-groups ──────────────────────────────────────────
// Returns all farmer groups merged with static extra fields (crops, zone, rating, etc.)
export const getAdminFarmerGroups = async (req, res) => {
  try {
    const groups = await FarmerGroup.find().sort({ createdAt: -1 }).lean();

    const enriched = groups.map((g) => {
      const extras = STATIC_FG_EXTRAS[g.fid] || {};
      return {
        id: g.fid,
        groupName: g.name,
        leadFarmer: g.leadfarmer,
        numberOfFarmers: g.farmerCount,
        profilePhoto: g.profile,
        email: g.email,
        phone: g.phone,
        address: `${g.address?.village || ""} · ${g.address?.district || ""}`,
        zone: extras.zone || "Unknown",
        crops: extras.crops || [],
        rating: extras.rating || 0,
        reviews: extras.reviews || 0,
        yield: extras.yield || "—",
        collective: extras.collective || "—",
        status: extras.status || "active",
        memberSince: extras.memberSince || "—",
        desc: g.desc || "",
      };
    });

    console.log("\n🌾 [GET /api/admin/farmer-groups] Sending:", JSON.stringify(enriched, null, 2));
    res.status(200).json(enriched);
  } catch (error) {
    console.error("Admin farmer groups error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ─── GET /api/admin/collectives ─────────────────────────────────────────────
// Returns all collectives merged with static extra fields (zones, farmerGroups count, etc.)
export const getAdminCollectives = async (req, res) => {
  try {
    const cols = await Collective.find().sort({ createdAt: -1 }).lean();

    const enriched = cols.map((c) => {
      const extras = STATIC_COL_EXTRAS[c.cid] || {};
      return {
        id: c.cid,
        name: c.name,
        email: c.email,
        phone: c.phone,
        profilePhoto: c.profile,
        address: `${c.address?.area || ""}, ${c.address?.state || ""}`,
        workers: c.workers,
        rating: c.ratingAvg,
        reviews: extras.reviews || 0,
        zones: extras.zones || [],
        farmerGroups: extras.farmerGroups || 0,
        totalHarvest: extras.totalHarvest || "—",
        isVerified: extras.isVerified || false,
        established: extras.established || "—",
        desc: c.desc || "",
      };
    });

    console.log("\n🏢 [GET /api/admin/collectives] Sending:", JSON.stringify(enriched, null, 2));
    res.status(200).json(enriched);
  } catch (error) {
    console.error("Admin collectives error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ─── GET /api/admin/issues ──────────────────────────────────────────────────
// Returns all issues (static for now, no model yet)
export const getAdminIssues = async (req, res) => {
  console.log("\n⚠️  [GET /api/admin/issues] Sending:", JSON.stringify(STATIC_ISSUES, null, 2));
  res.status(200).json(STATIC_ISSUES);
};
