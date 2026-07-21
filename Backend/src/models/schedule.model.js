import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema(
  {
    collective: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collective",
      required: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },
    zone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Zone",
      required: true,
    },
    pickupDate: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      trim: true,
      default: "09:00",
    },
    status: {
      type: String,
      enum: ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "POSTPONED"],
      default: "SCHEDULED",
      required: true,
    },
    // Auto-calculated sum of all ScheduleItem.totalAmount
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
  },
  { timestamps: true },
);

scheduleSchema.index({ collective: 1, pickupDate: -1 });
scheduleSchema.index({ collective: 1, status: 1 });

const Schedule = mongoose.model("Schedule", scheduleSchema);
export default Schedule;