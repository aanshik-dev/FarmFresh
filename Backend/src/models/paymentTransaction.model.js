import mongoose from "mongoose";

const paymentTransactionSchema = new mongoose.Schema(
  {
    // Human readable receipt id (PM1000001)
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
    farmerGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FarmerGroup",
      required: true,
    },
    membership: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Membership",
      default: null,
    },
    schedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Schedule",
      required: true,
    },
    // Exact schedule items settled by this payment
    items: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ScheduleItem",
      },
    ],
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    // Membership balance left after this payment — proof trail for the farmer
    balanceAfter: {
      type: Number,
      default: 0,
      min: 0,
    },
    method: {
      type: String,
      enum: ["UPI", "BANK_TRANSFER", "CASH", "CHEQUE", "OTHER"],
      default: "OTHER",
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
