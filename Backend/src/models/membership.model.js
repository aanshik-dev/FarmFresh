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
      min: 1,
      default: 1,
    },
  },
  { timestamps: true },
);

const Membership = mongoose.model("Membership", membershipSchema);
export default Membership;
