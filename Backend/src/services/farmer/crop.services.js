import Crop from "../../models/crop.model.js";
import FarmerCrop from "../../models/farmerCrop.model.js";
import throwErr from "../../utils/throwErr.js";

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

export { addCropData, editCropData, getCropData };
