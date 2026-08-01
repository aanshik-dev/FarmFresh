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
    growth: {
      stage: {
        type: String,
        enum: ["SOWING", "GROWING", "MATURE", "READY", "HARVESTED", "OTHER"],
        default: "SOWING",
      },
      expectedQuantity: {
        type: Number,
        min: 0,
        default: 0,
      },
      queryStatus: {
        type: String,
        enum: ["OPEN", "CLOSED"],
        default: "CLOSED",
      },
      lastUpdated: {
        type: Date,
        default: null,
      },
      images: [
        {
          type: String,
          trim: true,
        },
      ],
      message: {
        type: String,
        trim: true,
        default: "",
      },
    },
    schedule: {
      expectedPickupDate: {
        type: Date,
        default: null,
      },
      // Quantity planned in the currently open pickup (if any)
      collectedQuantity: {
        type: Number,
        min: 0,
        default: 0,
      },
      // Lifetime quantity actually picked up across all completed pickups
      totalCollected: {
        type: Number,
        min: 0,
        default: 0,
      },
      // Set while the deal sits in an open (SCHEDULED/IN_PROGRESS) pickup so the
      // same crop cannot be added to two pickups at once.
      activeSchedule: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Schedule",
        default: null,
      },
      lastPickupDate: {
        type: Date,
        default: null,
      },
      pickupCount: {
        type: Number,
        min: 0,
        default: 0,
      },
      paymentStatus: {
        type: String,
        enum: ["PENDING", "PARTIAL", "PAID"],
        default: "PENDING",
      },
    },
  },
  { timestamps: true },
);

const CropDeal = mongoose.model("CropDeal", cropDealSchema);
export default CropDeal;
