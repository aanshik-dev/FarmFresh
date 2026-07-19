import mongoose from "mongoose";

const cropDealSchema = new mongoose.Schema(
  {
    membership: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Membership",
      required: true,
    },
    crop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FarmerCrop",
      required: true,
    },
    agreedPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: ["REQUESTED", "APPROVED", "REJECTED", "CANCELLED", "ABANDONED"],
      default: "REQUESTED",
    },
    approvalDate: {
      type: Date,
      default: null,
    },

    // This section is for tracking the status of crop
    expectedQuantity: {
      type: Number,
      min: 0,
      default: 0,
    },
    expectedDate: {
      type: Date,
      default: null,
    },
    stage: {
      type: String,
      enum: ["SOWING", "PLANTING", "MATURE", "REAPING", "HARVEST", "OTHER"],
      default: "OTHER",
      required: true,
    },
    message: {
      type: String,
      maxlength: 1000,
      trim: true,
      default: null,
    },
    imgUrl: {
      type: String,
      trim: true,
      default: "",
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    queryStatus: {
      type: String,
      enum: ["OPEN", "CLOSED"],
      default: "OPEN",
      required: true,
    },
    ///////////////////////////////
  },
  { timestamps: true },
);

cropDealSchema.pre("save", function (next) {
  this.lastUpdated = new Date();
  next();
});

const CropDeal = mongoose.model("CropDeal", cropDealSchema);
export default CropDeal;
