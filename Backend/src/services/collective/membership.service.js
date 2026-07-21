import mongoose from "mongoose";
import Membership from "../../models/membership.model.js";
import CropDeal from "../../models/cropDeal.model.js";
import Collective from "../../models/collective.model.js";
import throwErr from "../../utils/throwErr.js";
import isProfileComplete from "../general.service.js";

// ── GET all memberships for a collective
const getMemberships = async (collectiveID) => {
  // validate collective
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
            balance: member.balance || 0,
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
const rejectMemberRequest = async (dealIds, reason = "") => {
  if (!dealIds || dealIds.length === 0)
    throwErr(400, "Deal Ids are required to reject !!");

  // Verify all deals exist and are in REQUESTED state
  const dealCrops = await CropDeal.find({
    _id: { $in: dealIds },
    status: "REQUESTED",
  });

  if (dealCrops.length !== dealIds.length)
    throwErr(
      403,
      "Some requests cannot be rejected, Invalid State!!",
    );

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const bulkOps = dealIds.map((dealId) => ({
        updateOne: {
          filter: { _id: dealId, status: "REQUESTED" },
          update: {
            $set: { status: "REJECTED", rejectionReason: reason || "" },
          },
        },
      }));
      await CropDeal.bulkWrite(bulkOps, { session });
    });
  } finally {
    await session.endSession();
  }

  return { success: true, message: "Request(s) rejected successfully!!" };
};

// ── ACCEPT membership requests
const acceptMembershipRequest = async (collectiveId, farmerId, crops) => {
  if (!(await isProfileComplete(collectiveId, "COLLECTIVE")))
    throwErr(
      403,
      "Please complete your profile before partnering with any farmer group !!",
    );

  if (!farmerId) throwErr(400, "Farmer Group Id is required !!");
  if (!crops || crops.length === 0)
    throwErr(400, "Crops with agreed prices are required !!");

  // Validate every crop entry
  for (const { dealId, agreedPrice } of crops) {
    if (!dealId) throwErr(400, "Each crop must have a dealId !!");
    if (!agreedPrice || agreedPrice <= 0)
      throwErr(400, `Valid agreed price is required for deal ${dealId} !!`);
  }

  const dealIds = crops.map((c) => c.dealId);

  // Fetch all deals and make sure they belong to a membership of this collective + the given farmer
  const deals = await CropDeal.find({
    _id: { $in: dealIds },
    status: "REQUESTED",
  }).populate({
    path: "membership",
    match: { collective: collectiveId, farmer: farmerId },
  });

  // Filter out any that don't belong (populate returns null when match fails)
  const validDeals = deals.filter((d) => d.membership !== null);
  if (validDeals.length !== crops.length)
    throwErr(403, "Some deals are invalid or not in REQUESTED state !!");

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const bulkOps = crops.map(({ dealId, agreedPrice }) => ({
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
      await CropDeal.bulkWrite(bulkOps, { session });

      // Update Membership status to ACTIVE
      const membershipId = validDeals[0].membership._id;
      await Membership.findByIdAndUpdate(
        membershipId,
        { status: "ACTIVE" },
        { session },
      );
    });
  } finally {
    await session.endSession();
  }

  return {
    success: true,
    message: "Membership request(s) approved successfully",
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
