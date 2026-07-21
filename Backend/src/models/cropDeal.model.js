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
    demandedPrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    requestedQuantity: {
      type: Number,
      min: 0,
      default: 0,
    },
    agreedPrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },
    terminationReason: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: [
        "REQUESTED",
        "APPROVED",
        "REJECTED",
        "CANCELLED",
        "ABANDONED",
        "F_TERMINATE",
        "C_TERMINATE",
      ],
      default: "REQUESTED",
    },
    approvalDate: {
      type: Date,
      default: null,
    },
    latestStage: {
      type: String,
      enum: ["SOWING", "GROWING", "MATURE", "READY", "HARVESTED", "OTHER"],
      default: "SOWING",
    },
    expectedQuantity: {
      type: Number,
      min: 0,
      default: 0,
    },
    collectedQuantity: {
      type: Number,
      min: 0,
      default: 0,
    },
    expectedPickupDate: {
      type: Date,
      default: null,
    },
    queryPending: {
      type: Boolean,
      default: false,
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PARTIAL", "PAID"],
      default: "PENDING",
    },
  },
  { timestamps: true },
);

const CropDeal = mongoose.model("CropDeal", cropDealSchema);
export default CropDeal;
