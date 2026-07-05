import crypto from "crypto";

const generateOTP = () => {
  let otp = crypto.randomInt(100000, 999999).toString();
  return otp;
};

export default generateOTP;
