import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FarmerGroup",
      required: true,
    },
    collective: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collective",
      required: true,
    },
    zone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Zone",
      default: null,
    },
    route: {
      type: String,
      trim: true,
      default: null,
    },
    distance: {
      type: Number,
      min: 0,
      default: 0,
    },
    estTime: {
      type: Number,
      min: 0,
      default: 0,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "REJECTED", "INACTIVE"],
      default: "PENDING",
    },
  },
  { timestamps: true },
);

const Membership = mongoose.model("Membership", membershipSchema);
export default Membership;
