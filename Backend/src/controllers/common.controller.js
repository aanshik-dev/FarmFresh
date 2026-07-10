import Crop from "../models/crop.model";

const getAllCrops = async () => {
  const crops = await Crop.find().sort({ name: 1 });

  return {
    success: true,
    message: "Crops fetched successfully.",
    crops,
  };
};
