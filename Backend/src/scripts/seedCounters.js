import Counter from "../models/counter.model.js";
import idConfig from "../config/idConfig.js";

const seedCounters = async () => {
  try {
    for (const [type, config] of Object.entries(idConfig)) {
      const exists = await Counter.exists({ _id: type });

      if (!exists) {
        await Counter.create({
          _id: type,
          sequence: config.start,
        });
      }
    }

    console.log("✅ counters seeded successfully");
  } catch (err) {
    console.error("Failed to seed counters !!", err);
  }
};

export default seedCounters;
