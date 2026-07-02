import mongoose from "mongoose";

const cropSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    default: "None"
  },
  season: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: ""
  }
})

const Crop = mongoose.model("Crop", cropSchema);
export default Crop;