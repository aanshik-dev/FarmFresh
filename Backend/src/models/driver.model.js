import mongoose from "mongoose";
const driverSchema = new mongoose.Schema({
  cid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Collective",
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: /^[6-9]\d{9}$/
  },
  license: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  vehicleNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  capacity: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ["AVAILABLE", "ASSIGNED", "ONROUTE", "INACTIVE"],
    default: "AVAILABLE"
  }
})

const Driver = mongoose.model("Driver", driverSchema);
export default Driver;