import Crop from "../models/crop.model.js";
import throwErr from "../utils/throwErr.js";

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
    throwErr(500, "Internal server error");
  }
};

export default getAllCrops;
