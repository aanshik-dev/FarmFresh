import mongoose from "mongoose";

const pendingOTPSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    hashOtp: {
      type: String,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    expiry: {
      type: Date,
      required: true,
    },
    blockedUntil: {
      type: Date,
      default: null,
    },
    goal: {
      type: String,
      enum: ["REGISTER", "FORGOT_PASS", "CHANGE_PASS"],
      required: true,
    },
  },
  { timestamps: true },
);

pendingOTPSchema.index({ email: 1, goal: 1 }, { unique: true });
pendingOTPSchema.index({ blockedUntil: 1 }, { expireAfterSeconds: 0 });

const PendingOTP = mongoose.model("PendingOTP", pendingOTPSchema);

export default PendingOTP;
