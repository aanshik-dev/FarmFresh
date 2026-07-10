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
      required: true,
      trim: true,
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
    workers: {
      type: Number,
      default: 0,
      min: 0,
    },
    address: {
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
        type: Number,
        trim: true,
      },
      long: {
        type: Number,
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
