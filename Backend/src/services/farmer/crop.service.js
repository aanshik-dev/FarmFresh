import Crop from "../../models/crop.model.js";
import CropDeal from "../../models/cropDeal.model.js";
import FarmerCrop from "../../models/farmerCrop.model.js";
import Membership from "../../models/membership.model.js";
import Collective from "../../models/collective.model.js";
import throwErr from "../../utils/throwErr.js";
import mongoose from "mongoose";

const addCropData = async (code, yld, plantedDate, farmerId, farmland) => {
  const crop = await Crop.findOne({ code });
  if (!crop) {
    throwErr(404, `No Crop found with code ${code}`);
  }
  // Reject if admin has deactivated this crop from the platform
  if (crop.isActive === false) {
    throwErr(400, `"${crop.name}" is currently not available on the platform`);
  }
  const existingCrop = await FarmerCrop.findOne({
    farmer: farmerId,
    crop: crop._id,
  });

  if (existingCrop) {
    if (existingCrop.status === "ACTIVE") {
      throwErr(400, `${crop.name} is already added !!`);
    } else {
      existingCrop.status = "ACTIVE";
      if (yld !== undefined) existingCrop.yield = yld;
      if (plantedDate !== undefined) existingCrop.plantedDate = plantedDate;
      if (farmland !== undefined) existingCrop.farmland = farmland;
      await existingCrop.save();
      return { success: true, message: "Crop added successfully !!", crop: existingCrop };
    }
  }

  const farmerCrop = new FarmerCrop({
    farmer: farmerId,
    crop: crop._id,
    yield: yld !== undefined ? yld : 0,
    farmland: farmland !== undefined ? farmland : 0,
  });
  if (plantedDate != undefined) farmerCrop.plantedDate = plantedDate;
  await farmerCrop.save();

  return { success: true, message: "Crop added successfully !!", crop: farmerCrop };
};

const editCropData = async (id, yld, plantedDate, farmerId, farmland) => {
  const farmerCrop = await FarmerCrop.findOne({ _id: id, farmer: farmerId }).populate("crop");
  if (!farmerCrop) throwErr(404, "Crop not found !!");
  if (farmerCrop.status !== "ACTIVE")
    throwErr(403, `You no longer grow this crop (${farmerCrop.crop.name}) !!`);

  if (yld !== undefined) farmerCrop.yield = yld;
  if (plantedDate !== undefined) farmerCrop.plantedDate = plantedDate;
  if (farmland !== undefined) farmerCrop.farmland = farmland;

  await farmerCrop.save();
  return { success: true, message: "Crop updated successfully !!", crop: farmerCrop };
};

const getCropData = async (farmerId) => {
  if (!farmerId) throwErr(404, "Farmer not found !!");

  // Only return ACTIVE crops — inactive are treated as deleted
  const farmerCrops = await FarmerCrop.find({ farmer: farmerId, status: "ACTIVE" })
    .select("-farmer -__v -createdAt -updatedAt")
    .populate({
      path: "crop",
      select: "-_id name code category season image",
    });

  if (!farmerCrops || farmerCrops.length === 0) {
    return { success: true, message: "No crop data found !!", crop: [] };
  }

  const dealCrops = await CropDeal.find({
    crop: { $in: farmerCrops.map((c) => c._id) },
    status: "APPROVED",
  })
    .select("-__v -createdAt -updatedAt")
    .populate({
      path: "membership",
      select: "collective",
      populate: {
        path: "collective",
        select: "name phone email manager leadFarmer address profile",
      },
    })
    .populate({
      path: "schedule.activeSchedule",
      select: "code pickupDate time status driver notes",
    })
    .lean();

  const dealMap = new Map(
    dealCrops.map((deal) => {
      const { crop, membership, ...dealData } = deal;
      return [
        crop.toString(),
        { collective: membership.collective, ...dealData },
      ];
    }),
  );

  const cropData = farmerCrops.map((crop) => ({
    ...crop.toObject(),
    dealCrop: dealMap.get(crop._id.toString()) || null,
  }));

  return {
    success: true,
    message: "Crop data fetched successfully !!",
    data: {
      farmerId,
      cropData,
    },
  };
};

const deleteCropData = async (farmerId, cropId) => {
  if (!farmerId) {
    throwErr(404, "Farmer not found !!");
  }
  if (!cropId) {
    throwErr(404, "Crop not found !!");
  }
  const farmerCrop = await FarmerCrop.findOne({
    _id: cropId,
    farmer: farmerId,
  }).populate("crop");
  if (!farmerCrop) {
    return throwErr(404, "You do not grow this Crop!!");
  }
  if (farmerCrop.status !== "ACTIVE") {
    return throwErr(
      403,
      `You no longer grow this crop (${farmerCrop.crop.name}) !!`,
    );
  }

  const farmerMember = await Membership.find({
    farmer: farmerId,
  });

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const membershipIds = farmerMember.map((fm) => fm._id);
      if (membershipIds.length > 0) {
        // A crop locked into an open pickup cannot be removed — the pickup
        // would still collect and pay for a terminated deal.
        const lockedDeals = await CropDeal.find({
          membership: { $in: membershipIds },
          crop: cropId,
          status: "APPROVED",
          "schedule.activeSchedule": { $type: "objectId" },
        });
        if (lockedDeals.length > 0) {
          throwErr(
            400,
            "This crop is part of an upcoming pickup and cannot be deleted. Cancel the pickup or wait for it to finish first !!",
          );
        }
        await CropDeal.updateMany(
          {
            membership: { $in: membershipIds },
            crop: cropId,
            status: "REQUESTED",
          },
          { $set: { status: "CANCELLED" } },
          { session },
        );
        await CropDeal.updateMany(
          {
            membership: { $in: membershipIds },
            crop: cropId,
            status: "APPROVED",
          },
          { $set: { status: "F_TERMINATE" } },
          { session },
        );
      }
      farmerCrop.status = "INACTIVE";
      await farmerCrop.save({ session });
    });
  } catch (err) {
    throw err;
  } finally {
    session.endSession();
  }

  return {
    success: true,
    message: "Crop deleted successfully !!",
  };
};

export { addCropData, editCropData, getCropData, deleteCropData };
