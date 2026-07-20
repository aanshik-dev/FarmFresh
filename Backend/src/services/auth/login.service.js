import User from "../../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import throwErr from "../../utils/throwErr.js";

const loginUser = async (email, password, role) => {
  const user = await User.findOne({ username: email }).select("+password");

  if (!user) {
    throwErr(401, "No user registered with this email !!");
  }

  if (user.role !== role) {
    throwErr(403, "Invalid role selected.");
  }

  if (!user.isActive) {
    throwErr(
      403,
      "Your account is deactivated. Please contact admin for more details.",
    );
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throwErr(401, "Invalid password !!");
  }

  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );

  const refreshToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" },
  );

  await User.updateOne({ _id: user._id }, { $set: { lastLogin: Date.now() } });

  return {
    success: true,
    message: "Login successful.",
    accessToken,
    refreshToken,
    user: {
      uid: user.uid,
      username: user.username,
      role: user.role,
    },
  };
};

export default loginUser;
