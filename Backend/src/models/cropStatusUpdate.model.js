import mongoose from "mongoose";

const cropStatusUpdateSchema = new mongoose.Schema(
  {
    cropDeal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CropDeal",
      required: true,
    },
    stage: {
      type: String,
      enum: ["SOWING", "GROWING", "MATURE", "READY", "HARVESTED", "OTHER"],
      default: "OTHER",
      required: true,
    },
    message: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    imgUrl: {
      type: String,
      trim: true,
      default: "",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FarmerGroup",
      required: true,
    },
    // true = farmer is responding to a collective's status query
    isQueryResponse: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const CropStatusUpdate = mongoose.model("CropStatusUpdate", cropStatusUpdateSchema);
export default CropStatusUpdate;
