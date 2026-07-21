import mongoose from "mongoose";

const paymentTransactionSchema = new mongoose.Schema(
  {
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
    schedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Schedule",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentProof: {
      type: String,
      trim: true,
      default: "",
    },
    utrNumber: {
      type: String,
      trim: true,
      default: "",
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

paymentTransactionSchema.index({ collective: 1, createdAt: -1 });
paymentTransactionSchema.index({ farmerGroup: 1, createdAt: -1 });
paymentTransactionSchema.index({ schedule: 1, farmerGroup: 1 });

const PaymentTransaction = mongoose.model("PaymentTransaction", paymentTransactionSchema);
export default PaymentTransaction;
