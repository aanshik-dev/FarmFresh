import mongoose from "mongoose";

const farmerGroupSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    fid: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    desc: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    farmerCount: {
      type: Number,
      default: 1,
    },
    leadfarmer: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    profile: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    phone: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },
    address: {
      area: {
        type: String,
        trim: true,
      },
      village: {
        type: String,
        trim: true,
      },
      district: {
        type: String,
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
      pinCode: {
        type: String,
        trim: true,
      },
    },
    coord: {
      lat: {
        type: String,
        trim: true,
      },
      long: {
        type: String,
        trim: true,
      },
    },
  },
  { timestamps: true },
);

farmerGroupSchema.index({ fid: 1 }, { unique: true });
farmerGroupSchema.index({ email: 1 }, { unique: true });
farmerGroupSchema.index({ phone: 1 }, { unique: true });

const FarmerGroup = mongoose.model("FarmerGroup", farmerGroupSchema);
export default FarmerGroup;
