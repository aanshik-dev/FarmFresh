import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import mongoose from "mongoose";
import Zone from "./src/models/zone.model.js";


const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, ".env") });

async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(
      `\n✅ DB Connected: ${conn.connection.host} / ${conn.connection.name}\n`,
    );
  } catch (err) {
    console.error("❌ DB connection failed:", err.message);
    process.exit(1);
  }
}

import { getCropData } from "./src/services/farmer/crop.service.js";
import members from "./src/services/collective/membership.service.js";

async function run() {
  // const result = await getCropData("6a5751bb3407f2cbaf0ed03e");

  const result = await members.getMemberships("6a5752123407f2cbaf0ed040");

  return result;
}

(async () => {
  await connectDB();
  try {
    console.log("▶  Running test...\n");
    const result = await run();
    console.log("✅ Result:\n");
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("\n❌ Error:\n");
    console.error(err?.message || err);
    if (err?.stack) console.error("\nStack:\n" + err.stack);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 DB Disconnected.");
  }
})();
