import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver",
    required: true
  },
  collective: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Collective",
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  zone: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ["SCHEDULED", "ASSIGNED", "COMPLETED", "DELAYED", "CANCELLED"],
    default: "SCHEDULED",
    required: true
  }
}, { timestamps: true });

const Schedule = mongoose.model("Schedule", scheduleSchema);
export default Schedule;