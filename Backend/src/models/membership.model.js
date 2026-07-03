import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema({
  fid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FarmerGroup",
    required: true
  },
  cid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Collective",
    required: true
  },
  approvalDate: {
    type: Date,
    default: null
  },
  zone: {
    type: String,
    trim: true,
  },
  route: {
    type: String,
    trim: true
  },
  distance: {
    type: Number,
    min: 0
  },
  estTime: {
    type: Number,
    min: 1
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const Membership = mongoose.model("Membership", membershipSchema);
export default Membership;