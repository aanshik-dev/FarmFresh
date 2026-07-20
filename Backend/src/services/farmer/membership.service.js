import mongoose from "mongoose";
import Membership from "../../models/membership.model.js";
import CropDeal from "../../models/cropDeal.model.js";
import Collective from "../../models/collective.model.js";
import User from "../../models/user.model.js";
import throwErr from "../../utils/throwErr.js";
import FarmerCrop from "../../models/farmerCrop.model.js";
import CollectedCrop from "../../models/collectedCrops.model.js";
import FarmerGroup from "../../models/farmerGroup.model.js";
import isProfileComplete from "../general.service.js";

const validRequest = async (farmerId, collectiveID, crops) => {
  if (!farmerId) {
    throwErr(404, "Farmer Group not found");
  }
  if (!collectiveID) {
    throwErr(404, "Collective not found");
  }
  if (!crops || crops.length === 0) {
    throwErr(400, "Crops are required");
  }
};

const sendMemberRequest = async (farmerId, collectiveID, crops) => {
  await validRequest(farmerId, collectiveID, crops);

  if (!(await isProfileComplete(farmerId, "FARMER_GROUP"))) {
    throwErr(
      403,
      "Please complete your profile before joining a collective !!",
    );
  }
  const collective = await Collective.findById(collectiveID);
  if (!collective) {
    throwErr(404, "Collective not found");
  }
  const collectiveUser = await User.findById(collectiveID);
  if (!collectiveUser || !collectiveUser.isActive) {
    throwErr(400, "Collective is currently inactive !!");
  }

  const farmerCrops = await FarmerCrop.find({
    _id: { $in: crops },
    farmer: farmerId,
  }).populate("crop");

  if (farmerCrops.length !== crops.length) {
    throwErr(403, "Some crops are invalid !!");
  }

  const collectedCrops = await CollectedCrop.find({
    collective: collectiveID,
    status: "ACTIVE",
  }).populate("crop");

  const collectiveCropCodes = new Set(collectedCrops.map((cc) => cc.crop.code));

  for (const fCrop of farmerCrops) {
    const cropCode = fCrop.crop.code;
    const cropName = fCrop.crop.name;

    if (fCrop.status !== "ACTIVE") {
      throwErr(400, `You no more grow this crop: (${cropName}) !!`);
    }

    if (!collectiveCropCodes.has(cropCode)) {
      throwErr(409, `Collective does not deal in this crop (${cropName}) !!`);
    }
  }

  let membership = await Membership.findOne({
    farmer: farmerId,
    collective: collectiveID,
  });

  if (membership) {
    const existingDeals = await CropDeal.find({
      membership: membership._id,
      crop: { $in: crops },
      status: { $in: ["REQUESTED", "APPROVED"] },
    });

    if (existingDeals.length > 0) {
      throwErr(
        409,
        "You have already requested or are part of this collective for one or many crops",
      );
    }
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      if (!membership) {
        membership = new Membership({
          farmer: farmerId,
          collective: collectiveID,
        });
        await membership.save({ session });
      }

      // Upsert all crop deals
      const bulkOps = crops.map((cropId) => ({
        updateOne: {
          filter: { membership: membership._id, crop: cropId },
          update: {
            $set: {
              status: "REQUESTED",
            },
          },
          upsert: true,
        },
      }));

      await CropDeal.bulkWrite(bulkOps, { session });
    });
  } finally {
    await session.endSession();
  }

  return {
    success: true,
    message: "Membership request sent successfully",
  };
};

const getMemberData = async (farmerId) => {
  if (!farmerId) {
    throwErr(404, "Farmer Group Id is required !!");
  }
  const farmer = await FarmerGroup.findById(farmerId);
  if (!farmer) {
    throwErr(404, "Farmer Group not found !!");
  }

  const memberships = await Membership.find({
    farmer: farmerId,
  })
    .populate("collective")
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
      message: "No collective is associated with your farmer group",
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
    if (!member || !member.collective) continue;

    const collectiveId = member.collective._id.toString();
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
      if (!memberData[category][collectiveId]) {
        memberData[category][collectiveId] = {
          ...member.collective,
          deals: {},
        };
      }
      memberData[category][collectiveId].deals[deal._id.toString()] = deal;
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
    message: "Membership request fetched successfully",
    memberData,
  };
};

const cancelMemberRequest = async (dealIds) => {
  if (!dealIds || dealIds.length === 0) {
    throwErr(400, "request Id is required to cancel the request !!");
  }

  const dealCrops = await CropDeal.find({
    _id: { $in: dealIds },
    status: "REQUESTED",
  });
  if (!dealCrops || dealCrops.length !== dealIds.length) {
    throwErr(403, "Some requests can not be cancelled !!");
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const bulkOps = dealIds.map((dealId) => ({
        updateOne: {
          filter: {
            _id: dealId,
            status: "REQUESTED",
          },
          update: {
            $set: {
              status: "CANCELLED",
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
    message: "Request cancelled successfully !!",
  };
};

export default { sendMemberRequest, getMemberData, cancelMemberRequest };
