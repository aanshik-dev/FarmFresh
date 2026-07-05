import Counter from "../models/counter.model.js";
import idConfig from "../config/idConfig.js";

const generateId = async (type) => {
  const { prefix } = idConfig[type];

  const counter = await Counter.findOneAndUpdate(
    { _id: type },
    { $inc: { sequence: 1 } },
    {
      returnDocument: "after",
    },
  );

  if (!counter) {
    throw new Error(`Counter "${type}" not found. Run the seed script first.`);
  }

  return `${prefix}${counter.sequence}`;
};

export default generateId;
