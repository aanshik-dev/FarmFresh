import mongoose from "mongoose";

const scheduleItemSchema = new mongoose.Schema({

  schedule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Schedule",
    required: true
  },
  pickupQuantity: {
    type: Number,
    required: true
  },
  status: { //////////////////
    type: String,
    enum: ["OPEN", "CLOSED"],
    default: "OPEN",
    required: true
  },
  remark: {
    type: String,
    trim: true,
    maxlength: 1000
  }

})

const ScheduleItem = mongoose.model("ScheduleItem", scheduleItemSchema);
export default ScheduleItem;