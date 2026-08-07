import Counter from "../models/counter.model.js";
import idConfig from "../config/idConfig.js";

const generateId = async (type, session) => {
  const { prefix } = idConfig[type];

  let counter = await Counter.findOneAndUpdate(
    { _id: type },
    { $inc: { sequence: 1 } },
    {
      returnDocument: "after",
      ...(session ? { session } : {}),
    },
  );

  if (!counter) {
    const startVal = idConfig[type]?.start || 300000;
    counter = await Counter.create([{ _id: type, sequence: startVal }], ...(session ? [{ session }] : {}));
    counter = counter[0];
  }

  return `${prefix}${counter.sequence}`;
};

export default generateId;
