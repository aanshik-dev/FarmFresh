import jwt from "jsonwebtoken";

const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    const err = new Error("Refresh token is required.");
    err.statusCode = 401;
    throw err;
  }

  let decoded;

  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    const err = new Error("Invalid or expired refresh token.");
    err.statusCode = 401;
    throw err;
  }

  const accessToken = jwt.sign(
    { id: decoded.id, role: decoded.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );

  return {
    success: true,
    message: "Access token refreshed successfully.",
    token: accessToken,
  };
};

export default refreshAccessToken;
