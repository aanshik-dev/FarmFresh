import mongoose from "mongoose";

const zoneSchema = new mongoose.Schema(
  {
    collective: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collective",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    area: {
      type: String,
      trim: true,
      default: "",
    },
    direction: {
      type: String,
      trim: true,
      default: "",
    },
    color: {
      type: String,
      default: "#10b981",
      trim: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  { timestamps: true },
);

const Zone = mongoose.model("Zone", zoneSchema);
export default Zone;