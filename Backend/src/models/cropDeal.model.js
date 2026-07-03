import mongoose from "mongoose";

const cropDealSchema = new mongoose.Schema({
  membership: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Membership",
    required: true
  },
  crop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FarmerCrop",
    required: true
  },
  yield: {
    type: Number,
    required: true,
    min: 0
  },
  agreedPrice: {
    type: Number,
    required: true,
    min: 0
  },
  expectedQuantity: {
    type: Number,
    min: 0,
  },

  expectedDate: {
    type: Date,
  },
  stage: {
    type: String,
    enum: ["SOWING", "PLANTING", "MATURE", "REAPING", "HARVEST", "OTHER"],
    default: "OTHER",
    required: true
  },
  message: {
    type: String,
    maxlength: 1000,
    trim: true
  },
  imgUrl: {
    type: String,
    trim: true
  },
  queryStatus: {
    type: String,
    enum: ["OPEN", "CLOSED"],
    default: "OPEN",
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

cropDealSchema.pre("save", function (next) {
  this.lastUpdated = new Date();
  next();
});

const CropDeal = mongoose.model("CropDeal", cropDealSchema);
export default CropDeal;