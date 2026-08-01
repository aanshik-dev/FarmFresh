import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    fid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FarmerGroup",
      required: true,
    },
    cid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collective",
      required: true,
    },
    comment: {
      type: String,
      maxlength: 1000,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
  },
  { timestamps: true },
);

// One review per farmer group per collective — submitting again updates it.
reviewSchema.index({ fid: 1, cid: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);
export default Review;
