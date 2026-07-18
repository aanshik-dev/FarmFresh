import Crop from "../../models/crop.model.js";
import CollectedCrop from "../../models/collectedCrops.model.js";
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
    return throwErr(400, `${crop.name} is already added !!`);
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
const editCropData = async (id, price, quantity, status, collectiveId) => {
  const collectCrop = await CollectedCrop.findOne({
    _id: id,
    collective: collectiveId,
  });
  if (!collectCrop) {
    return throwErr(404, "Crop not found");
  }
  if (quantity !== undefined) {
    collectCrop.quantity = quantity;
  }
  if (price !== undefined) {
    collectCrop.price = price;
  }
  if (status) {
    collectCrop.status = status;
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

export { addCropData, editCropData, getCropData };
