import Counter from "../models/counter.model";
import idConfig from "../config/idConfig";

const generateId = async (type) => {
  const { prefix, offset } = idConfig[type];

  const count = await Counter.findOneAndUpdate(
    { _id: type },
    {
      $inc: { sequence: 1 },
      $setOnInsert: { sequence: start }
    },
    {
      new: true,
      upsert: true
    }
  );

  return `${prefix}${count.sequence}`;
};

export default generateId;