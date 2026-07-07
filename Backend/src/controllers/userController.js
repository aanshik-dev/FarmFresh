import User from "../models/user.model.js";
import FarmerGroup from "../models/farmerGroup.model.js";
import Collective from "../models/collective.model.js";

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    
    // Fetch details for each user based on their role
    const unifiedUsers = await Promise.all(
      users.map(async (u) => {
        let details = {};
        let name = "Unknown";
        let subName = "";
        let role = u.role;
        
        if (u.role === "FARMER") {
          details = await FarmerGroup.findOne({ _id: u._id }) || {};
          name = details.name || "Unknown Farmer Group";
          subName = details.leadfarmer || "No Lead Farmer";
          role = "FARMER_GROUP"; // map for frontend
        } else if (u.role === "COLLECTIVE") {
          details = await Collective.findOne({ _id: u._id }) || {};
          name = details.name || "Unknown Collective";
          subName = details.workers ? `${details.workers} workers` : "0 workers";
        } else if (u.role === "ADMIN") {
          name = "FarmFresh Admin";
          subName = "Platform administrator";
        }
        
        return {
          id: u._id,
          name,
          subName,
          role,
          photo: details.profile || null,
          email: u.username,
          status: u.isActive ? "active" : "inactive",
        };
      })
    );

    res.status(200).json(unifiedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
