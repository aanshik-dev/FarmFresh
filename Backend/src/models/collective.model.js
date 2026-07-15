import mongoose from "mongoose";

const collectiveSchema = new mongoose.Schema(
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
    manager: {
      type: String,
      required: true,
      trim: true,
    },
    desc: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    workers: {
      type: Number,
      default: 0,
      min: 0,
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
        default: "",
        trim: true,
      },
      long: {
        type: Number,
        default: "",
        trim: true,
      },
    },
    ratingAvg: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },
  { timestamps: true },
);

const Collective = mongoose.model("Collective", collectiveSchema);

export default Collective;
