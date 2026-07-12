import bcrypt from "bcryptjs";

import User from "../../models/user.model.js";
import PendingOTP from "../../models/pendingOTP.model.js";
import FarmerGroup from "../../models/farmerGroup.model.js";
import Collective from "../../models/collective.model.js";

import generateOTP from "../../utils/otpGenerate.js";
import sendVerificationMail from "../email.service.js";

// Reusable function to send OTP
const sendOtp = async (name, email, goal) => {
  const otp = generateOTP();
  const hashOtp = await bcrypt.hash(otp, 10);
  const expiry = new Date(Date.now() + 20 * 60 * 1000);
  const unblockAt = new Date(Date.now() + 6 * 60 * 60 * 1000);
  let attempts = 0;

  const pendingOTP = await PendingOTP.findOne({ email, goal });

  if (pendingOTP) {
    const now = new Date();
    if (
      pendingOTP.blockedUntil &&
      pendingOTP.blockedUntil > now &&
      pendingOTP.attempts >= 5
    ) {
      const err = new Error(
        "Too many attempts. Please try again after 6 hours.",
      );
      err.success = false;
      err.statusCode = 429;
      err.unblockAt = pendingOTP.blockedUntil;
      throw err;
    }

    if (pendingOTP.blockedUntil && pendingOTP.blockedUntil <= now) {
      pendingOTP.attempts = 0;
      pendingOTP.blockedUntil = null;
      await pendingOTP.save();
    }
  }

  // await sendVerificationMail({ name, email, otp, goal });

  if (pendingOTP) {
    pendingOTP.hashOtp = hashOtp;
    pendingOTP.expiry = expiry;
    pendingOTP.attempts += 1;
    pendingOTP.blockedUntil = unblockAt;
    await pendingOTP.save();
    attempts = pendingOTP.attempts;
  } else {
    const pendingOTP = new PendingOTP({
      email,
      hashOtp,
      attempts: 1,
      expiry,
      blockedUntil: unblockAt,
      goal,
    });
    await pendingOTP.save();
    attempts = 1;
  }

  return {
    message: "OTP sent successfully !!",
    attempts: attempts,
    otp: otp,
  };
};

// Reusable function to verify OTP
const verifyOtp = async (email, otp, goal) => {
  const pendingOTP = await PendingOTP.findOne({ email, goal });

  if (!pendingOTP) {
    const err = new Error("OTP not requested with this email !!");
    err.statusCode = 404;
    err.success = false;
    throw err;
  }
  if (pendingOTP.expiry < new Date()) {
    const err = new Error("OTP has expired !!");
    err.statusCode = 401;
    err.success = false;
    throw err;
  }
  if (!otp) {
    const err = new Error("OTP is required");
    err.statusCode = 400;
    err.success = false;
    throw err;
  }
  const isOtpValid = await bcrypt.compare(otp, pendingOTP.hashOtp);
  if (!isOtpValid) {
    const err = new Error("Invalid OTP !!");
    err.statusCode = 403;
    err.success = false;
    throw err;
  }
};

// Sends OTP email for registration - verification is done in register service
const registerOtp = async (data) => {
  const { name, email } = data;
  const userEmailExists = await User.findOne({ username: email });

  if (userEmailExists) {
    const err = new Error("User already exists with the given email !!");
    err.statusCode = 409;
    throw err;
  }
  const result = await sendOtp(name, email, "REGISTER");
  return result;
};

// Sends an OTP email to reset password
const forgotPassOtp = async (data) => {
  const { email } = data;
  const userExists = await User.findOne({ username: email });
  if (!userExists) {
    const err = new Error("No user found with the given email !!");
    err.statusCode = 404;
    throw err;
  }
  let name = "";
  if (userExists.role == "FARMER_GROUP") {
    const farmerGroup = await FarmerGroup.findOne({ _id: userExists._id });
    name = farmerGroup.name;
  } else if (userExists.role == "COLLECTIVE") {
    const collective = await Collective.findOne({ _id: userExists._id });
    name = collective.name;
  }
  const result = await sendOtp(name, email, "FORGOT_PASS");
  return result;
};

// Verify reset password otp
const forgotOtpVerify = async (data) => {
  const { email, otp } = data;

  await verifyOtp(email, otp, "FORGOT_PASS");
  await PendingOTP.deleteOne({ email, goal: "FORGOT_PASS" });

  return { success: true, message: "OTP verified successfully !!" };
};

export default { registerOtp, forgotPassOtp, verifyOtp, forgotOtpVerify };
