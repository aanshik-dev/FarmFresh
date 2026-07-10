import crypto from "crypto";

// Generates a 6 digit OTP
const generateOTP = () => {
  let otp = crypto.randomInt(100000, 999999).toString();
  return otp;
};

export default generateOTP;
