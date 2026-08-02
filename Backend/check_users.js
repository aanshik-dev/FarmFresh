import mongoose from "mongoose";
import "dotenv/config";
import dbConnect from "./src/config/dbConnect.js";
import User from "./src/models/user.model.js";

async function run() {
  await dbConnect();
  
  const users = await User.find({ role: "FARMER_GROUP" }).limit(5).lean();
  console.log("Farmers users:", users.map(u => ({ id: u._id, username: u.username, role: u.role, uid: u.uid })));
  
  await mongoose.disconnect();
}

run().catch(console.error);
