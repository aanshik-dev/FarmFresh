import mongoose from "mongoose";

const scheduleItemSchema = new mongoose.Schema(
  {
    schedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Schedule",
      required: true,
    },
    // Denormalised so farmer/collective ledgers can be queried without a join
    collective: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collective",
      required: true,
    },
    farmerGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FarmerGroup",
      required: true,
    },
    membership: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Membership",
      required: true,
    },
    cropDeal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CropDeal",
      required: true,
    },
    // Immutable crop snapshot — the FarmerCrop may go INACTIVE later
    cropName: {
      type: String,
      trim: true,
      default: "Crop",
    },
    cropCode: {
      type: String,
      trim: true,
      default: "",
    },
    // Planned at scheduling time, corrected when the pickup is completed
    plannedQuantity: {
      type: Number,
      required: true,
      min: 0,
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
    // Outcome of the physical pickup for this crop line
    status: {
      type: String,
      enum: ["PENDING", "COLLECTED", "SKIPPED", "CANCELLED"],
      default: "PENDING",
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
    paidAt: {
      type: Date,
      default: null,
    },
    paymentTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentTransaction",
      default: null,
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
scheduleItemSchema.index({ collective: 1, paymentStatus: 1 });
scheduleItemSchema.index({ cropDeal: 1 });

const ScheduleItem = mongoose.model("ScheduleItem", scheduleItemSchema);
export default ScheduleItem;
