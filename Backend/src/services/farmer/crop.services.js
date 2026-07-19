import Crop from "../../models/crop.model.js";
import CropDeal from "../../models/cropDeal.model.js";
import FarmerCrop from "../../models/farmerCrop.model.js";
import Membership from "../../models/membership.model.js";
import throwErr from "../../utils/throwErr.js";
import mongoose from "mongoose";
const addCropData = async (code, yld, farmerId) => {
  const crop = await Crop.findOne({ code });
  if (!crop) {
    return throwErr(404, `No Crop found with code ${code}`);
  }
  const existingCrop = await FarmerCrop.findOne({
    farmer: farmerId,
    crop: crop._id,
  });

  if (existingCrop) {
    return throwErr(400, `${crop.name} is already added !!`);
  }

  const farmerCrop = new FarmerCrop({
    farmer: farmerId,
    crop: crop._id,
    yield: yld,
  });
  await farmerCrop.save();
  return {
    success: true,
    message: "Crop added successfully !!",
    crop: farmerCrop,
  };
};

const editCropData = async (id, yld, plantedDate, status, farmerId) => {
  const farmerCrop = await FarmerCrop.findOne({
    _id: id,
    farmer: farmerId,
  });
  if (!farmerCrop) {
    return throwErr(404, "Crop not found !!");
  }
  if (yld !== undefined) {
    farmerCrop.yield = yld;
  }
  if (plantedDate !== undefined) {
    farmerCrop.plantedDate = plantedDate;
  }
  if (status !== undefined) {
    farmerCrop.status = status;
  }
  await farmerCrop.save();
  return {
    success: true,
    message: "Crop updated successfully !!",
    crop: farmerCrop,
  };
};

const getCropData = async (farmerId) => {
  const farmerCrop = await FarmerCrop.find({ farmer: farmerId }).populate(
    "crop",
  );

  return {
    success: true,
    message: "Crop data fetched successfully !!",
    crop: farmerCrop,
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
  });
  if (!farmerCrop) {
    return throwErr(404, "You do not grow this Crop!!");
  }

  const farmerMember = await Membership.find({
    farmer: farmerId,
  });

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const membershipIds = farmerMember.map((fm) => fm._id);
      if (membershipIds.length > 0) {
        await CropDeal.updateMany(
          { membership: { $in: membershipIds }, crop: cropId },
          { $set: { status: "ABANDONED" } },
          { session },
        );
      }
      farmerCrop.status = "INACTIVE";
      await farmerCrop.save({ session });
    });
  } catch (err) {
    return err;
  } finally {
    session.endSession();
  }

  return {
    success: true,
    message: "Crop deleted successfully !!",
  };
};

export { addCropData, editCropData, getCropData, deleteCropData };
