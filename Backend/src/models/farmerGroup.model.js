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
      required: true,
      unique: true,
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
    },
    leadFarmer: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    address: {
      village: {
        type: String,
        trim: true,
      },
      area: {
        type: String,
        trim: true,
      },
      city: {
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

const FarmerGroup = mongoose.model("FarmerGroup", farmerGroupSchema);
export default FarmerGroup;
