import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import fs from "node:fs";
const env = fs.readFileSync(".env", "utf8");
for (const line of env.split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  const k = line.slice(0, i).trim();
  const v = line.slice(i + 1).trim();
  process.env[k] = v;
}
await mongoose.connect(process.env.MONGODB_URI);
const u = await mongoose.connection.collection("users").findOne({ role: "ADMIN" });
const t = jwt.sign({ id: u._id.toString(), role: "ADMIN" }, process.env.JWT_SECRET, { expiresIn: "1d" });
console.log(t);
await mongoose.disconnect();