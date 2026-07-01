import mongoose from "mongoose";

const counterScheme = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  sequence: {
    type: Number,
    default: 100000
  }
});

const Counter = mongoose.model("Counter", counterScheme);
export default Counter;