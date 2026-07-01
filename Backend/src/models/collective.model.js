import mongoose from "mongoose";

const collectiveScheme = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  }




})


const Collective = mongoose.model("Collective", collectiveScheme);

export default Collective;