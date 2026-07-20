import mongoose from "mongoose";
import Membership from "../../models/membership.model.js";
import CropDeal from "../../models/cropDeal.model.js";
import Collective from "../../models/collective.model.js";
import User from "../../models/user.model.js";
import throwErr from "../../utils/throwErr.js";
import isProfileComplete from "../general.service.js";

const getMemberships = async (collectiveID) => {
  if (!collectiveID) {
    throwErr(404, "Collective Id is required !!");
  }
  const collective = await Collective.findById(collectiveID);
  if (!collective) {
    throwErr(404, "Collective not found !!");
  }

  const memberships = await Membership.find({
    collective: collectiveID,
  })
    .populate("farmer")
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
  }).lean();

  const membershipMap = {};
  for (const m of memberships) {
    membershipMap[m._id.toString()] = m;
  }

  for (const deal of deals) {
    const member = membershipMap[deal.membership.toString()];
    if (!member || !member.farmer) continue;

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

const rejectMemberRequest = async (dealIds) => {
  if (!dealIds || dealIds.length === 0) {
    throwErr(400, "request Id is required !!");
  }

  const dealCrops = await CropDeal.find({
    _id: { $in: dealIds },
    status: "REQUESTED",
  });
  if (!dealCrops || dealCrops.length !== dealIds.length) {
    throwErr(403, "Some requests can not be rejected !!");
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const bulkOps = crops.map((dealId) => ({
        updateOne: {
          filter: {
            membership: memberId,
            _id: dealId,
            status: "REQUESTED",
          },
          update: {
            $set: {
              status: "REJECTED",
            },
          },
        },
      }));
      await CropDeal.bulkWrite(bulkOps, { session });
    });
  } catch (err) {
    throw err;
  } finally {
    await session.endSession();
  }

  return {
    success: true,
    message: "Request rejected successfully !!",
  };
};

const acceptMemberRequest = async (collectiveId, dealId, agreedPrice) => {
  if (!(await isProfileComplete(collectiveId, "COLLECTIVE"))) {
    throwErr(
      403,
      "Please complete your profile before partnering with any farmer group !!",
    );
  }
  if (!dealId) {
    throwErr(404, "Request id is required !!");
  }
  const dealCrop = await CropDeal.findById(dealId);
  if (!dealCrop) {
    throwErr(404, "Deal not found");
  }
  if (!agreedPrice || agreedPrice <= 0) {
    throwErr(404, "Valid agreed price is required !!");
  }
  if (dealCrop.status !== "REQUESTED") {
    throwErr(404, "Invalid deal status !!");
  }
  dealCrop.agreedPrice = agreedPrice;
  dealCrop.status = "APPROVED";
  dealCrop.approvalDate = new Date();
  await dealCrop.save();

  return {
    success: true,
    message: "Membership request approved successfully",
  };
};

export default { getMemberships, acceptMemberRequest, rejectMemberRequest };
