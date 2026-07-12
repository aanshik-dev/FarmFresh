import User from "../../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const loginUser = async (email, password, role) => {
  const user = await User.findOne({ username: email }).select("+password");
  console.log(user);
  if (!user) {
    const err = new Error("No user registered with this email !!");
    err.statusCode = 401;
    err.success = false;
    throw err;
  }

  if (user.role !== role) {
    const err = new Error("Invalid role selected.");
    err.statusCode = 403;
    err.success = false;
    throw err;
  }

  if (!user.isActive) {
    const err = new Error(
      "Your account is deactivated. Please contact admin for more details.",
    );
    err.statusCode = 403;
    err.success = false;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    const err = new Error("Invalid password !!");
    err.statusCode = 401;
    err.success = false;
    throw err;
  }

  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "30m" },
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
