import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import Admin from "../models/admin.model.js";
import mongoose from "mongoose";

const admin = {
  uid: "AD101",
  email: process.env.ADMIN_MAIL,
  password: process.env.ADMIN_PASSWORD,
  role: "ADMIN",
  provider: "LOCAL",
};

const seedAdmin = async () => {
  const session = await mongoose.startSession();
  try {
    const user = await User.findOne({ username: admin.email });
    if (user) {
      console.log("⚠️  Admin already exists !!");
    } else {
      await session.withTransaction(async () => {
        const hass = await bcrypt.hash(admin.password, 10);
        const adminUser = new User({
          uid: admin.uid,
          username: admin.email,
          password: hass,
          role: admin.role,
          provider: admin.provider,
        });
        await adminUser.save({ session });

        const adminProfile = new Admin({
          _id: adminUser._id,
          name: "Administrator",
          phone: "9426XX1024",
          profile:
            "https://res.cloudinary.com/aanshik-dev-cloud/image/upload/v1784106164/farmfresh/userProfiles/AD101.png",
          desc: "I am admin and developer of farmfresh",
        });
        await adminProfile.save({ session });
        console.log("✅ Admin created successfully !!");
      });
    }
  } catch (error) {
    console.log(error);
  } finally {
    session.endSession();
  }
};

export default seedAdmin;
