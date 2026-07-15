import User from "../models/user.model.js";
import Collective from "../models/collective.model.js";
import FarmerGroup from "../models/farmerGroup.model.js";
import throwErr from "../utils/throwErr.js";

const getCurrentUser = async (req, res) => {
  try {
    const { id, role } = req.user;

    const user = await User.findById(id);
    if (!user) {
      throwErr(404, "User not found");
    }
    let profile = null;
    if (role === "COLLECTIVE") {
      profile = await Collective.findById(id);
    } else if (role === "FARMER_GROUP") {
      profile = await FarmerGroup.findById(id);
    } else if (role === "ADMIN") {
      profile = await admin.findById(id);
    }

    if (!user && !profile) {
      return res.status(404).json({ message: "User not found" });
    }

    let result = {
      id: user._id,
      uid: user.uid,
      email: user.username,
      provider: user.provider,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      creation: user.createdAt,
      name: profile.name,
      phone: profile.phone,
      profile: profile.profile,
    };
    if (role !== "ADMIN") {
      if (role === "COLLECTIVE") {
        result.leader = profile.manager;
        result.workers = profile.workers;
        result.rating = profile.ratingAvg;
      } else if (role === "FARMER_GROUP") {
        result.leader = profile.leadFarmer;
        result.farmerCount = profile.farmerCount;
      }
      result.desc = profile.desc;
      result.address = profile.address;
      result.coord = profile.coord;
    }
    console.log(result);
    res.status(200).json({
      success: true,
      user: result,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching user data" });
  }
};

export default { getCurrentUser };
