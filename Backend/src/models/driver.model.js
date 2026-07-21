import mongoose from "mongoose";

const driverSchema = new mongoose.Schema(
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
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, "Invalid phone number format"],
    },
    license: {
      type: String,
      required: true,
      trim: true,
    },
    vehicleNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 0,
    },
    zones: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Zone",
      },
    ],
    totalDeliveries: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["AVAILABLE", "ASSIGNED", "ONROUTE", "INACTIVE"],
      default: "AVAILABLE",
    },
  },
  { timestamps: true },
);

const Driver = mongoose.model("Driver", driverSchema);
export default Driver;