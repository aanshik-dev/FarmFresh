import mongoose from "mongoose";

const farmerCrop = new mongoose.Schema({
  fid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FarmerGroup",
    required: true
  },
  crop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Crop",
    required: true
  },
  yield: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["OPEN", "CLOSED"],
    default: "OPEN",
    required: true
  }
}, { timestamps: true });

farmerCropSchema.index(
  { farmerGroup: 1, crop: 1 },
  { unique: true }
);

const FarmerCrop = mongoose.model("FarmerCrop", farmerCrop);
export default FarmerCrop;