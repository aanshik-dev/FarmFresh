import mongoose from "mongoose";

const farmerCropSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FarmerGroup",
      required: true,
    },
    crop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crop",
      required: true,
    },
    yield: {
      type: Number,
      default: 0,
      required: true,
    },
    plantedDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
      required: true,
    },
  },
  { timestamps: true },
);

farmerCropSchema.index({ fid: 1, crop: 1 }, { unique: true });

const FarmerCrop = mongoose.model("FarmerCrop", farmerCropSchema);
export default FarmerCrop;
