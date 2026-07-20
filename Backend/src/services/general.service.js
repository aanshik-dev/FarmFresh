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
  const fields = [
    user.name,
    user.phone,
    user.address.district,
    user.address.state,
    user.address.pinCode,
    user.coord.lat,
    user.coord.long,
  ];
  if (fields.some((field) => !field)) {
    return false;
  }
  return true;
};

export default isProfileComplete;
