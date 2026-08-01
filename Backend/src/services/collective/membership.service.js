import mongoose from "mongoose";
import Membership from "../../models/membership.model.js";
import CropDeal from "../../models/cropDeal.model.js";
import Collective from "../../models/collective.model.js";
import Notification from "../../models/notification.model.js";
import Zone from "../../models/zone.model.js";
import throwErr from "../../utils/throwErr.js";
import isProfileComplete from "../general.service.js";

// ── GET all memberships for a collective
const getMemberships = async (collectiveID) => {
  if (!collectiveID) throwErr(400, "Collective Id is required !!");

  const collective = await Collective.findById(collectiveID);
  if (!collective) throwErr(404, "Collective not found !!");

  const memberships = await Membership.find({ collective: collectiveID })
    .populate("farmer")
    .populate("zone")
    .lean();

  const memberData = {
    requests: {},
    approved: {},
    rejected: {},
    cancelled: {},
    terminated: {},
  };

  if (!memberships || memberships.length === 0) {
    return {
      success: true,
      message: "No farmer group is associated with your collective",
      memberData,
    };
  }

  const membershipIds = memberships.map((m) => m._id);
  const deals = await CropDeal.find({
    membership: { $in: membershipIds },
  })
    .populate({
      path: "crop",
      populate: { path: "crop", select: "name code category season image" },
    })
    .lean();

  const membershipMap = {};
  for (const m of memberships) {
    membershipMap[m._id.toString()] = m;
  }

  for (const deal of deals) {
    const member = membershipMap[deal.membership.toString()];
    if (!member || !member.farmer) continue;

    // if crop inactive, then skip
    if (!deal.crop || deal.crop.status === "INACTIVE") continue;

    const farmerId = member.farmer._id.toString();
    const status = deal.status;

    const categoryMap = {
      REQUESTED: "requests",
      APPROVED: "approved",
      REJECTED: "rejected",
      CANCELLED: "cancelled",
      F_TERMINATE: "terminated",
      C_TERMINATE: "terminated",
    };

    const category = categoryMap[status];
    if (category) {
      if (!memberData[category][farmerId]) {
        memberData[category][farmerId] = {
          ...member.farmer,
          membership: {
            _id: member._id,
            zone: member.zone || null,
            route: member.route || "",
            distance: member.distance || 0,
            estTime: member.estTime || 0,
            balance: member.balance || 0,
            note: member.note || "",
            memberSince: member.memberSince || null,
          },
          deals: {},
        };
      }
      memberData[category][farmerId].deals[deal._id.toString()] = deal;
    }
  }

  for (const key of Object.keys(memberData)) {
    memberData[key] = Object.values(memberData[key]).map((item) => ({
      ...item,
      deals: Object.values(item.deals),
    }));
  }

  return {
    success: true,
    message: "Memberships fetched successfully",
    memberData,
  };
};

// ── REJECT membership requests
const rejectMemberRequest = async (
  collectiveId,
  { farmerId, dealIds, rejectedCrops, reason },
) => {
  let rejectList = [];
  if (Array.isArray(rejectedCrops) && rejectedCrops.length > 0) {
    rejectList = rejectedCrops;
  } else if (Array.isArray(dealIds) && dealIds.length > 0) {
    rejectList = dealIds.map((id) => ({ dealId: id, reason: reason || "" }));
  }

  if (rejectList.length === 0)
    throwErr(400, "Deal IDs or rejected crops list is required to reject !!");

  if (!(await isProfileComplete(collectiveId, "COLLECTIVE")))
    throwErr(
      403,
      "Please complete your profile before reviewing farmer group requests !!",
    );

  const targetIds = rejectList.map((r) => r.dealId);
  const deals = await CropDeal.find({
    _id: { $in: targetIds },
    status: "REQUESTED",
  }).populate({
    path: "membership",
    match: { collective: collectiveId },
    populate: { path: "farmer", select: "name groupName" },
  });

  const validDeals = deals.filter((d) => d.membership !== null);
  if (validDeals.length === 0)
    throwErr(403, "No valid requested deals found to reject !!");

  const targetFarmerId = farmerId || validDeals[0].membership.farmer._id;
  const collective = await Collective.findById(collectiveId)
    .select("name")
    .lean();
  const collectiveName = collective?.name || "The collective";

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const bulkOps = rejectList.map(({ dealId, reason }) => ({
        updateOne: {
          filter: { _id: dealId, status: "REQUESTED" },
          update: {
            $set: {
              status: "REJECTED",
              rejectionReason: reason || "Rejected by collective",
            },
          },
        },
      }));
      await CropDeal.bulkWrite(bulkOps, { session });
    });
  } finally {
    await session.endSession();
  }

  // Notify farmer group
  await Notification.create({
    recipient: targetFarmerId,
    recipientRole: "FARMER_GROUP",
    type: "REQUEST",
    title: "Membership Request Rejected",
    body: `${collectiveName} has rejected your crop partnership request.`,
    data: { rejectedCount: validDeals.length },
    sender: collectiveId,
  });

  return {
    success: true,
    message: "Membership request(s) rejected successfully !!",
  };
};

// ── ACCEPT / REVIEW membership requests (with partial accept/reject, price & zone)
const acceptMembershipRequest = async (collectiveId, payload) => {
  const {
    farmerId,
    crops = [],
    rejectedCrops = [],
    zoneId,
    route,
    distance,
    estTime,
  } = payload || {};

  if (!(await isProfileComplete(collectiveId, "COLLECTIVE")))
    throwErr(
      403,
      "Please complete your profile before partnering with any farmer group !!",
    );

  if (!farmerId) throwErr(400, "Farmer Group Id is required !!");
  if (crops.length === 0 && rejectedCrops.length === 0)
    throwErr(400, "Please specify crops to accept or reject !!");

  // Validate approved crops
  for (const { dealId, agreedPrice } of crops) {
    if (!dealId) throwErr(400, "Each accepted crop must have a dealId !!");
    if (!agreedPrice || agreedPrice <= 0)
      throwErr(400, "Valid agreed price is required for each accepted crop !!");
  }

  const approvedDealIds = crops.map((c) => c.dealId);
  const rejectedDealIds = rejectedCrops.map((c) => c.dealId);
  const allDealIds = [...approvedDealIds, ...rejectedDealIds];

  // Fetch membership first to reliably match farmer and collective
  const membership = await Membership.findOne({
    collective: collectiveId,
    farmer: farmerId,
  });
  if (!membership) throwErr(404, "Farmer group membership request not found !!");

  const deals = await CropDeal.find({
    _id: { $in: allDealIds },
    membership: membership._id,
    status: "REQUESTED",
  });

  if (deals.length !== allDealIds.length)
    throwErr(403, "Some crop deals are invalid or not in REQUESTED state !!");

  const membershipId = membership._id;

  // Validate zone if provided
  let assignedZone = null;
  if (zoneId) {
    assignedZone = await Zone.findOne({
      _id: zoneId,
      collective: collectiveId,
    });
    if (!assignedZone) throwErr(404, "Selected zone not found !!");
  }

  const session = await mongoose.startSession();
  const writeOptions = session && !session.isMock ? { session } : {};
  try {
    await session.withTransaction(async () => {
      // 1. Process Approved Crops
      if (crops.length > 0) {
        const approveBulk = crops.map(({ dealId, agreedPrice }) => ({
          updateOne: {
            filter: { _id: dealId, status: "REQUESTED" },
            update: {
              $set: {
                status: "APPROVED",
                agreedPrice,
                approvalDate: new Date(),
              },
            },
          },
        }));
        await CropDeal.bulkWrite(approveBulk, writeOptions);
      }

      // 2. Process Rejected Crops
      if (rejectedCrops.length > 0) {
        const rejectBulk = rejectedCrops.map(({ dealId, reason }) => ({
          updateOne: {
            filter: { _id: dealId, status: "REQUESTED" },
            update: {
              $set: {
                status: "REJECTED",
                rejectionReason: reason || "Rejected by collective",
              },
            },
          },
        }));
        await CropDeal.bulkWrite(rejectBulk, writeOptions);
      }

      // 3. Update Membership status and zone
      const updateData = {};
      if (crops.length > 0) {
        updateData.status = "ACTIVE";
        if (!membership.memberSince) {
          updateData.memberSince = new Date();
        }
      } else {
        updateData.status = "REJECTED";
      }

      if (assignedZone) updateData.zone = assignedZone._id;
      if (route) updateData.route = route;
      if (distance !== undefined) updateData.distance = distance;
      if (estTime !== undefined) updateData.estTime = estTime;

      await Membership.findByIdAndUpdate(
        membershipId,
        { $set: updateData },
        writeOptions,
      );
    });
  } finally {
    await session.endSession();
  }

  // Build notification body for farmer group
  const collective = await Collective.findById(collectiveId)
    .select("name")
    .lean();
  const collectiveName = collective?.name || "The collective";

  const approvedSummary =
    crops.length > 0 ? `${crops.length} crop(s) approved` : "";
  const rejectedSummary =
    rejectedCrops.length > 0 ? `${rejectedCrops.length} crop(s) rejected` : "";
  const zoneSummary = assignedZone ? ` in zone ${assignedZone.name}` : "";

  const summary = [approvedSummary, rejectedSummary].filter(Boolean).join(", ");

  await Notification.create({
    recipient: farmerId,
    recipientRole: "FARMER_GROUP",
    type: "REQUEST",
    title: `Membership Request Processed by ${collectiveName}`,
    body: `Your partnership request has been reviewed: ${summary}${zoneSummary}. Check your deals section for full details.`,
    data: {
      approvedCount: crops.length,
      rejectedCount: rejectedCrops.length,
      zoneId,
    },
    sender: collectiveId,
  });

  return {
    success: true,
    message: "Membership request processed successfully !!",
  };
};

// ── TERMINATE an approved deal (by collective) ────────────────────────────────
const terminateDeal = async (collectiveId, dealId, reason = "") => {
  if (!dealId) throwErr(400, "Deal Id is required !!");

  const deal = await CropDeal.findById(dealId).populate({
    path: "membership",
    match: { collective: collectiveId },
  });

  if (!deal || !deal.membership)
    throwErr(404, "Deal not found or does not belong to your collective !!");

  if (deal.status !== "APPROVED")
    throwErr(400, "Only APPROVED deals can be terminated !!");

  if (deal.schedule?.activeSchedule)
    throwErr(
      400,
      "This deal is locked into an open pickup and cannot be terminated yet !!",
    );

  deal.status = "C_TERMINATE";
  if (reason) deal.terminationReason = reason;
  await deal.save();

  return { success: true, message: "Deal terminated successfully !!" };
};

export default {
  getMemberships,
  acceptMembershipRequest,
  rejectMemberRequest,
  terminateDeal,
};
