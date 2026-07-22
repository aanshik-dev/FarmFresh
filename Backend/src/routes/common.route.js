import express from "express";
import Crop from "../models/crop.model.js";
import Collective from "../models/collective.model.js";
import CollectedCrop from "../models/collectedCrops.model.js";
import Membership from "../models/membership.model.js";
import Zone from "../models/zone.model.js";
import { haversineDistance } from "../utils/haversine.js";

const router = express.Router();

// ── Get all crops (directory) ─────────────────────────────────────────────────
router.get("/crops", async (req, res, next) => {
  try {
    const crops = await Crop.find().lean();
    res.status(200).json({ success: true, crops });
  } catch (err) {
    next(err);
  }
});

// ── Get nearby collectives (for farmer browse) ────────────────────────────────
// Query: ?lat=<number>&long=<number>&radius=<km, default 100>
router.get("/collectives", async (req, res, next) => {
  try {
    const { lat, long, radius = 100 } = req.query;
    const farmerLat = parseFloat(lat);
    const farmerLong = parseFloat(long);

    const collectives = await Collective.find().lean();

    let result = collectives;

    // If farmer has coords, sort by distance and filter by radius
    if (!isNaN(farmerLat) && !isNaN(farmerLong)) {
      result = collectives
        .map((c) => {
          const cLat = parseFloat(c.coord?.lat);
          const cLong = parseFloat(c.coord?.long);
          const distance =
            !isNaN(cLat) && !isNaN(cLong)
              ? haversineDistance(farmerLat, farmerLong, cLat, cLong)
              : null;
          return { ...c, distance };
        })
        .filter((c) => c.distance === null || c.distance <= parseFloat(radius))
        .sort((a, b) => {
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });
    }

    // For each collective, attach what crops they deal in (with prices)
    const collectiveIds = result.map((c) => c._id);
    const collectedCrops = await CollectedCrop.find({
      collective: { $in: collectiveIds },
      status: "ACTIVE",
    })
      .populate("crop", "name code category season image")
      .lean();

    const cropsByCollective = {};
    for (const cc of collectedCrops) {
      const key = cc.collective.toString();
      if (!cropsByCollective[key]) cropsByCollective[key] = [];
      cropsByCollective[key].push({
        ...cc.crop,
        price: cc.price || 0,
        quantity: cc.quantity || 0,
      });
    }

    // Aggregate farmer group count and zone count per collective
    const [memberCounts, zoneCounts] = await Promise.all([
      Membership.aggregate([
        { $match: { collective: { $in: collectiveIds }, status: { $in: ["ACTIVE", "PENDING"] } } },
        { $group: { _id: "$collective", count: { $sum: 1 } } },
      ]),
      Zone.aggregate([
        { $match: { collective: { $in: collectiveIds }, status: "ACTIVE" } },
        { $group: { _id: "$collective", count: { $sum: 1 } } },
      ]),
    ]);

    const memberCountMap = {};
    for (const m of memberCounts) {
      memberCountMap[m._id.toString()] = m.count;
    }
    const zoneCountMap = {};
    for (const z of zoneCounts) {
      zoneCountMap[z._id.toString()] = z.count;
    }

    const enriched = result.map((c) => ({
      ...c,
      crops: cropsByCollective[c._id.toString()] || [],
      farmerGroupsCount: memberCountMap[c._id.toString()] || 0,
      zonesCount: zoneCountMap[c._id.toString()] || 0,
    }));

    res.status(200).json({
      success: true,
      message: "Collectives fetched successfully",
      collectives: enriched,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
