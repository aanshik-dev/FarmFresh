import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema(
  {
    // Human readable pickup id (SC700001) — shown on pickup cards & history
    code: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
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
    // Sum of ScheduleItem.collectedQuantity (kg)
    totalQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Amount already settled with farmer groups for this pickup
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Denormalised counts so list views don't need an extra aggregation
    farmerCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    itemCount: {
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
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    // Audit trail of every postpone so farmers can see why a pickup moved
    postponeHistory: [
      {
        from: { type: Date },
        to: { type: Date },
        reason: { type: String, trim: true, maxlength: 500, default: "" },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

scheduleSchema.index({ collective: 1, pickupDate: -1 });
scheduleSchema.index({ collective: 1, status: 1 });

const Schedule = mongoose.model("Schedule", scheduleSchema);
export default Schedule;
