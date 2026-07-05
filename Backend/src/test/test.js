import mongoose from "mongoose";
import dotenv from "dotenv";

import generateId from "../services/idGenerator.js";

dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);

console.log(await generateId("user"));

await mongoose.disconnect();
