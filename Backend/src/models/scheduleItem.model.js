import mongoose from "mongoose";

const scheduleItemSchema = new mongoose.Schema(
  {
    schedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Schedule",
      required: true,
    },
    farmerGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FarmerGroup",
      required: true,
    },
    cropDeal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CropDeal",
      required: true,
    },
    collectedQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    // Copied from CropDeal.agreedPrice at the time of scheduling (immutable record)
    agreedPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    // Auto-calculated: collectedQuantity * agreedPrice
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID"],
      default: "PENDING",
    },
    paymentProof: {
      type: String,
      trim: true,
      default: "",
    },
    remark: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
  },
  { timestamps: true },
);

scheduleItemSchema.index({ schedule: 1, farmerGroup: 1 });
scheduleItemSchema.index({ farmerGroup: 1, createdAt: -1 });

const ScheduleItem = mongoose.model("ScheduleItem", scheduleItemSchema);
export default ScheduleItem;