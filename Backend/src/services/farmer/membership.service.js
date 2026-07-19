import mongoose from "mongoose";
import Membership from "../../models/membership.model.js";
import CropDeal from "../../models/cropDeal.model.js";
import Collective from "../../models/collective.model.js";
import throwErr from "../../utils/throwErr.js";
import FarmerCrop from "../../models/farmerCrop.model.js";
import CollectedCrop from "../../models/collectedCrops.model.js";

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
  const collective = await Collective.findById(collectiveID);
  if (!collective) {
    throwErr(404, "Collective not found");
  }
};

const sendMembershipRequest = async (farmerId, collectiveID, crops) => {
  await validRequest(farmerId, collectiveID, crops);

  const farmerCrops = await FarmerCrop.find({
    _id: { $in: crops },
    farmer: farmerId,
  }).populate("crop");

  if (farmerCrops.length !== crops.length) {
    throwErr(404, "Not all crops are valid !!");
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
      throwErr(400, `You no more grow this crop:  (${cropName}) !!`);
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

const cancelMembershipRequest = async (farmerId, collectiveID, crops) => {
  await validRequest(farmerId, collectiveID, crops);

  const membership = await Membership.findOne({
    farmer: farmerId,
    collective: collectiveID,
  });
  if (!membership) {
    throwErr(404, "No such request found !!");
  }
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const bulkOps = crops.map((cropId) => ({
        updateOne: {
          filter: {
            membership: membership._id,
            crop: cropId,
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
  } finally {
    await session.endSession();
  }
  return {
    success: true,
    message: "Membership request cancelled successfully",
  };
};
export default { sendMembershipRequest, cancelMembershipRequest };
