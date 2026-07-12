import mongoose from "mongoose";
import uploadImage from "../../utils/uploadImage.js";

import User from "../../models/user.model.js";
import PendingOTP from "../../models/pendingOTP.model.js";
import FarmerGroup from "../../models/farmerGroup.model.js";
import Collective from "../../models/collective.model.js";
import FarmerCrop from "../../models/farmerCrop.model.js";
import Crop from "../../models/crop.model.js";
import CollectedCrop from "../../models/collectedCrops.model.js";

import otpService from "./otp.service.js";
import generateId from "../idGenerator.service.js";
import bcrypt from "bcryptjs";

const addCrops = async ({
  ownerId,
  crops,
  MappingModel,
  ownerField,
  session,
}) => {
  if (!crops || crops.length === 0) return;

  const cropsArray = Array.isArray(crops) ? crops : [crops];

  const cropDocs = await Crop.find({
    code: { $in: cropsArray },
  }).session(session);

  const cropMap = new Map(cropDocs.map((crop) => [crop.code, crop._id]));

  const mappings = [];

  for (const cropCode of cropsArray) {
    const cropId = cropMap.get(cropCode);

    if (!cropId) {
      const err = new Error(`Crop with id: '${cropCode}' not found !!`);
      err.statusCode = 404;
      err.success = false;
      throw err;
    }

    mappings.push({
      [ownerField]: ownerId,
      crop: cropId,
    });
  }

  await MappingModel.insertMany(mappings, { session });
};

const registerUser = async (data, file) => {
  let {
    role,
    name,
    email,
    phone,
    workers,
    leadFarmer,
    farmerCount,
    password,
    crops = [],
    village,
    area,
    city,
    state,
    pinCode,
    lat,
    long,
    otp,
  } = data;

  if (typeof crops === "string") {
    try {
      crops = JSON.parse(crops);
    } catch {
      const err = new Error("Invalid crops format.");
      err.statusCode = 400;
      err.success = false;
      throw err;
    }
  }

  const existingUser = await User.findOne({
    username: email,
  });

  if (existingUser) {
    const err = new Error("User already exists with this email !!");
    err.statusCode = 409;
    err.success = false;
    throw err;
  }
  const farmerPhone = await FarmerGroup.findOne({
    phone,
  });

  const collectivePhone = await Collective.findOne({
    phone,
  });

  if (farmerPhone || collectivePhone) {
    const err = new Error(
      "This phone is already linked with some other account !!",
    );
    err.statusCode = 409;
    err.success = false;
    throw err;
  }

  await otpService.verifyOtp(email, otp, "REGISTER");

  let uid;
  let newUserId;
  let profileUrl = "";

  const hashPassword = await bcrypt.hash(password, 10);

  const session = await mongoose.startSession();

  try {
    const roleMap = {
      FARMER_GROUP: "farmergroup",
      COLLECTIVE: "collective",
    };
    if (!roleMap[role]) {
      const err = new Error("Invalid role.");
      err.statusCode = 400;
      err.success = false;
      throw err;
    }

    await session.withTransaction(async () => {
      uid = await generateId(roleMap[role], session);
      const newUser = new User({
        uid,
        username: email,
        password: hashPassword,
        role,
        isActive: true,
        lastLogin: null,
      });
      await newUser.save({ session });
      newUserId = newUser._id;

      if (role === "FARMER_GROUP") {
        const farmerGroup = new FarmerGroup({
          _id: newUser._id,
          name,
          email,
          phone,
          profile: profileUrl,
          farmerCount,
          leadFarmer,
          address: {
            village,
            area,
            city,
            state,
            pinCode,
          },
          coord: {
            lat,
            long,
          },
        });
        await farmerGroup.save({ session });

        await addCrops({
          ownerId: farmerGroup._id,
          crops,
          MappingModel: FarmerCrop,
          ownerField: "fid",
          session,
        });
      } else if (role === "COLLECTIVE") {
        const newCollective = new Collective({
          _id: newUser._id,
          name,
          email,
          phone,
          profile: profileUrl,
          workers,
          address: {
            area,
            city,
            state,
            pinCode,
          },
          coord: {
            lat,
            long,
          },
          ratingAvg: 0,
        });
        await newCollective.save({ session });

        await addCrops({
          ownerId: newCollective._id,
          crops,
          MappingModel: CollectedCrop,
          ownerField: "cid",
          session,
        });
      }
      await PendingOTP.deleteOne({ email, goal: "REGISTER" }, { session });
    });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0] || "email/phone";
      const error = new Error(`User already exists with this ${field}.`);
      error.statusCode = 409;
      error.success = false;
      throw error;
    }
    throw err;
  } finally {
    await session.endSession();
  }

  if (file) {
    try {
      const uploadedImage = await uploadImage(
        file.buffer,
        "farmfresh/userProfiles",
        uid,
      );

      profileUrl = uploadedImage.secure_url;

      if (role === "FARMER_GROUP") {
        await FarmerGroup.updateOne(
          { _id: newUserId },
          { $set: { profile: profileUrl } },
        );
      } else if (role === "COLLECTIVE") {
        await Collective.updateOne(
          { _id: newUserId },
          { $set: { profile: profileUrl } },
        );
      }
    } catch (uploadError) {
      console.error(
        `Registration succeeded, but image upload failed for UID ${uid}:`,
        uploadError,
      );
    }
  }

  return {
    success: true,
    message: "Registration successful.",
    res: {
      uid,
      name,
      email,
      phone,
      profileUrl,
    },
  };
};

export default registerUser;
