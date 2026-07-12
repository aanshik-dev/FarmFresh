import Crop from "../models/crop.model.js";

const getAllCrops = async (req, res) => {
  try {
    const crops = await Crop.find().sort({ name: 1 });
    return res.status(200).json({
      success: true,
      message: "Crops fetched successfully.",
      crops,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export default getAllCrops;
