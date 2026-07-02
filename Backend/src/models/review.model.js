import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
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
  comment:{
    type: String,
    maxlength: 1000,
    required: true
  },
  rating: {
    type: Number,
    required: true
  }

})

const Review = mongoose.model("Review", reviewSchema);
export default Review;