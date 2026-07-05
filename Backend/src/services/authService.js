import User from "../models/user.model.js";
import PendingSignup from "../models/pendingSignup.model.js";
import generateOTP from "../utils/otpGenerate.js";
import sendVerificationMail from "./emailService.js";
import generateId from "./idGenerator.js";
import bcrypt from "bcryptjs";


const sendOtp = async (data) => {
  const { role, name, phone, email } = data;

    const userEmailExists = await User.findOne({ username: email });


  if (userEmailExists) {
    const err = new Error("User already exists with given email or phone !!");
    err.statusCode = 409;
    throw err;
  }

  const otp = generateOTP();
  const hashOtp = await bcrypt.hash(otp, 10);
  const expiry = Date.now() + 10 * 60 * 1000;

  const pendingSignup = new PendingSignup({
    role,
    email,
    phone,
    hashOtp,
    expiry,
  });

  await pendingSignup.save();
  await sendVerificationMail({ name, email, otp });

  return {
    message: "OTP sent successfully",
  };
};

const registerUser = async (data) => {
  const {
    role,
    profileUrl,
    farmerGroup,
    leadFarmer,
    numberOfFarmers,
    phone,
    email,
    password,
    crops,
    area,
    city,
    state,
    pinCode,
    lat,
    long,
    otp,
  } = data;

  const pendingSignup = await PendingSignup.findOne({
    $or: [{ email }, { phone }],
  });

  if (!pendingSignup) {
    const err = new Error("OTP expired or OTP email mismatched.");
    err.statusCode = 403;
    throw err;
  }

  const isOtpValid = await bcrypt.compare(otp, pendingSignup.hashOtp);

  if (!isOtpValid) {
    const err = new Error("Invalid OTP !!");
    err.statusCode = 403;
    throw err;
  }

  const hashPassword = await bcrypt.hash(password, 10);
  const uid = await generateId("user");

  const newUser = new User({});
};

export default {sendOtp, registerUser };
