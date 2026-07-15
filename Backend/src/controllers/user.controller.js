import { updateSchema } from "../validations/auth.validation.js";
import uploadImage from "../utils/uploadImage.js";
import User from "../models/user.model.js";
import Collective from "../models/collective.model.js";
import FarmerGroup from "../models/farmerGroup.model.js";
import throwErr from "../utils/throwErr.js";
import Admin from "../models/admin.model.js";

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
      profile = await Admin.findById(id);
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

const updateCurrentUser = async (req, res, next) => {
  try {
    const { id, role } = req.user;

    let data = { ...req.body };
    if (data.address && typeof data.address === "string")
      data.address = JSON.parse(data.address);
    if (data.coord && typeof data.coord === "string")
      data.coord = JSON.parse(data.coord);
    if (data.farmerCount && typeof data.farmerCount === "string")
      data.farmerCount = parseInt(data.farmerCount);
    if (data.workers && typeof data.workers === "string")
      data.workers = parseInt(data.workers);

    const parsedData = updateSchema.parse(data);

    const user = await User.findById(id);
    if (!user) return throwErr(404, "User not found");

    let profileUrl;
    if (req.file) {
      const uploadedImage = await uploadImage(
        req.file.buffer,
        "farmfresh/userProfiles",
        user.uid,
      );
      profileUrl = uploadedImage.secure_url;
    }

    let profileModel;
    if (role === "COLLECTIVE") profileModel = Collective;
    else if (role === "FARMER_GROUP") profileModel = FarmerGroup;
    else if (role === "ADMIN") profileModel = Admin;

    if (!profileModel) return throwErr(400, "Invalid role");

    const updatePayload = { ...parsedData };
    if (profileUrl) {
      updatePayload.profile = profileUrl;
    }

    if (role === "COLLECTIVE" && updatePayload.leader) {
      updatePayload.manager = updatePayload.leader;
      delete updatePayload.leader;
    }
    if (role === "FARMER_GROUP" && updatePayload.leader) {
      updatePayload.leadFarmer = updatePayload.leader;
      delete updatePayload.leader;
    }

    const updatedProfile = await profileModel.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true, runValidators: true },
    );

    if (!updatedProfile) return throwErr(404, "Profile not found");

    let result = {
      name: updatedProfile.name,
      phone: updatedProfile.phone,
      profile: updatedProfile.profile,
    };
    if (role !== "ADMIN") {
      if (role === "COLLECTIVE") {
        result.leader = updatedProfile.manager;
        result.workers = updatedProfile.workers;
      } else if (role === "FARMER_GROUP") {
        result.leader = updatedProfile.leadFarmer;
        result.farmerCount = updatedProfile.farmerCount;
      }
      result.desc = updatedProfile.desc;
      result.address = updatedProfile.address;
      result.coord = updatedProfile.coord;
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: result,
    });
  } catch (error) {
    if (error.name === "ZodError") {
      return res
        .status(400)
        .json({ success: false, message: error.errors[0].message });
    }
    next(error);
  }
};

const deactivateCurrentUser = async (req, res, next) => {
  try {
    const { id } = req.user;
    const user = await User.findById(id);
    if (!user) return throwErr(404, "User not found");

    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Account deactivated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export default { getCurrentUser, updateCurrentUser, deactivateCurrentUser };
