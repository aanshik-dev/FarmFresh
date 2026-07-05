import mongoose from "mongoose";

const pendingSignupSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["FARMER_GROUP", "COLLECTIVE"],
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    phone: {
      type: String,
      unique: true,
      required: true,
    },
    hashOtp: {
      type: String,
      required: true,
    },
    expiry: {
      type: Date,
      default: Date.now() + 10 * 60 * 1000,
    },
  },
  { timestamps: true },
);

const PendingSignup = mongoose.model("PendingSignup", pendingSignupSchema);

export default PendingSignup;
