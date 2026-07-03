import mongoose from "mongoose";

const zoneSchema = new mongoose.Schema({
  collective: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Collective",
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  area: {
    type: Number,
    required: true
  },
  direction: {
    type: String,
    enum: ["EAST", "WEST", "NORTH", "SOUTH", "NORTHEAST", "NORTHWEST", "SOUTHEAST", "SOUTHWEST"],
    required: true
  }
})

const Zone = mongoose.model("Zone", zoneSchema);
export default Zone;