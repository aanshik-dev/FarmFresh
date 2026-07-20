import mongoose from "mongoose";
import Crop from "../../models/crop.model.js";
import CollectedCrop from "../../models/collectedCrops.model.js";
import CropDeal from "../../models/cropDeal.model.js";
import Membership from "../../models/membership.model.js";
import throwErr from "../../utils/throwErr.js";

// Adds collective crops
const addCropData = async (code, price, collectiveId) => {
  const crop = await Crop.findOne({ code });
  if (!crop) {
    return throwErr(404, `No Crop found with code ${code}`);
  }
  const existingCrop = await CollectedCrop.findOne({
    collective: collectiveId,
    crop: crop._id,
  });

  if (existingCrop) {
    if (existingCrop.status === "ACTIVE") {
      throwErr(400, `${crop.name} is already added !!`);
    } else {
      existingCrop.status = "ACTIVE";
      await existingCrop.save();
      return {
        success: true,
        message: "Crop added successfully !!",
        crop: existingCrop,
      };
    }
  }

  const collectedCrop = new CollectedCrop({
    collective: collectiveId,
    crop: crop._id,
    price,
  });
  await collectedCrop.save();

  return {
    success: true,
    message: "Crop added successfully",
    crop: collectedCrop,
  };
};

// Edit collective Crops
const editCropData = async (id, price, quantity, collectiveId) => {
  const collectCrop = await CollectedCrop.findOne({
    _id: id,
    collective: collectiveId,
  }).populate("crop");
  if (!collectCrop) {
    return throwErr(404, "Crop not found");
  }
  if (collectCrop.status !== "ACTIVE") {
    return throwErr(
      403,
      `You no longer collect this crop (${collectCrop.crop.name}) !!`,
    );
  }
  if (quantity !== undefined) {
    collectCrop.quantity = quantity;
  }
  if (price !== undefined) {
    collectCrop.price = price;
  }

  await collectCrop.save();
  return {
    success: true,
    message: "Crop updated successfully",
    data: collectCrop,
  };
};

// gets collective crops
const getCropData = async (collectiveId) => {
  const collectedCrops = await CollectedCrop.find({
    collective: collectiveId,
  }).populate("crop");

  const totalCrops = collectedCrops.length;
  const totalQuantity = collectedCrops.reduce(
    (acc, crop) => acc + crop.quantity,
    0,
  );
  const totalAmount = collectedCrops.reduce(
    (acc, crop) => acc + crop.price * crop.quantity,
    0,
  );

  const inventory = collectedCrops.map((crop) => {
    return {
      _id: crop._id,
      name: crop.crop.name,
      code: crop.crop.code,
      category: crop.crop.category,
      season: crop.crop.season,
      image: crop.crop.image,
      price: crop.price,
      quantity: crop.quantity,
      status: crop.status,
    };
  });
  const data = {
    totalCrops,
    totalQuantity,
    totalAmount,
    inventory,
  };

  return {
    success: true,
    message: "Crops data fetched successfully !!",
    data,
  };
};

const deleteCropData = async (collectiveId, cropId) => {
  if (!collectiveId) {
    return throwErr(404, "Collective not found !!");
  }
  if (!cropId) {
    return throwErr(404, "Crop not found !!");
  }
  const collectCrop = await CollectedCrop.findOne({
    _id: cropId,
    collective: collectiveId,
  }).populate("crop");
  if (!collectCrop) {
    return throwErr(404, "You do not collect this Crop!!");
  }
  if (collectCrop.status !== "ACTIVE") {
    throwErr(
      403,
      `You no longer collect this crop (${collectCrop.crop.name}) !!`,
    );
  }
  const memberships = await Membership.find({ collective: collectiveId });

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const membershipIds = memberships.map((m) => m._id);

      if (membershipIds.length > 0) {
        await CropDeal.updateMany(
          {
            membership: { $in: membershipIds },
            crop: cropId,
            status: "REQUESTED",
          },
          { $set: { status: "REJECTED" } },
          { session },
        );
        await CropDeal.updateMany(
          {
            membership: { $in: membershipIds },
            crop: cropId,
            status: "APPROVED",
          },
          { $set: { status: "C_TERMINATE" } },
          { session },
        );
      }
      collectCrop.status = "INACTIVE";
      await collectCrop.save({ session });
    });
  } catch (error) {
    throw error;
  } finally {
    session.endSession();
  }

  return {
    success: true,
    message: "Crop deleted successfully !!",
  };
};

export { addCropData, editCropData, getCropData, deleteCropData };
