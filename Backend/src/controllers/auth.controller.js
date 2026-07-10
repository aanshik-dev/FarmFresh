import otp from "../services/auth/otp.service.js";
import register from "../services/auth/register.service.js";
import login from "../services/auth/login.service.js";
import refreshAccessToken from "../services/auth/refresh.service.js";

const verifyEmail = async (req, res) => {
  try {
    const response = await otp.registerOtp(req.body);
    res.status(201).json(response);
  } catch (err) {
    console.error("GET_OTP Error", err);
    res.status(err.statusCode || 500).json({
      success: err.success,
      message: err.message,
      unblockAt: err.unblockAt || null,
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const response = await otp.forgotPassOtp(req.body);
    res.status(201).json(response);
  } catch (err) {
    console.error("FORGOT_PASSWORD Error", err);
    res.status(err.statusCode || 500).json({
      success: err.success,
      message: err.message,
      unblockAt: err.unblockAt || null,
    });
  }
};

const registerUser = async (req, res) => {
  try {
    const response = await register(req.body, req.file);
    res.status(201).json(response);
  } catch (err) {
    console.error("REGISTER_USER Error", err);
    res.status(err.statusCode || 500).json({
      success: err.success,
      message: err.message,
    });
  }
};

const loginUser = async (req, res, next) => {
  try {
    const result = await login(req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    const result = await refreshAccessToken(refreshToken);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export { verifyEmail, forgotPassword, loginUser, registerUser, refreshToken };
