import Collective from "../models/collective.model.js";
import FarmerGroup from "../models/farmerGroup.model.js";
import throwErr from "../utils/throwErr.js";

const isProfileComplete = async (id, role) => {
  let user;
  if (role === "FARMER_GROUP") {
    user = await FarmerGroup.findById(id);
  } else if (role === "COLLECTIVE") {
    user = await Collective.findById(id);
  } else {
    throwErr(404, "Invalid role !!");
  }
  if (!user) {
    return throwErr(404, "User not found !!");
  }
  const requiredFields = [
    user.name,
    user.phone,
    user.address?.district,
    user.address?.state,
    user.address?.pinCode,
  ];

  // Check if any required string field is empty or undefined
  if (requiredFields.some((field) => !field || field.toString().trim() === "")) {
    return false;
  }

  // Check coordinates only if they are undefined/null, but allow 0
  if (user.coord?.lat == null || user.coord?.long == null) {
    return false;
  }
  return true;
};

export default isProfileComplete;
