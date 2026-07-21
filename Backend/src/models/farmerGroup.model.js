import mongoose from "mongoose";

const farmerGroupSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      auto: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
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
      unique: true,
      sparse: true,
    },
    profile: {
      type: String,
      default: "",
    },
    desc: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    farmerCount: {
      type: Number,
      default: 1,
      required: true,
    },
    leadFarmer: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      locality: {
        type: String,
        default: "",
        trim: true,
      },
      area: {
        type: String,
        default: "",
        trim: true,
      },
      town: {
        type: String,
        default: "",
        trim: true,
      },
      district: {
        type: String,
        default: "",
        trim: true,
      },
      state: {
        type: String,
        default: "",
        trim: true,
      },
      pinCode: {
        type: String,
        default: "",
        trim: true,
      },
    },
    coord: {
      lat: {
        type: Number,
        default: 0,
      },
      long: {
        type: Number,
        default: 0,
      },
    },
  },
  { timestamps: true },
);

const FarmerGroup = mongoose.model("FarmerGroup", farmerGroupSchema);
export default FarmerGroup;
