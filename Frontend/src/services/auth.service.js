import api from "./axios";

export const login = async (email, password, role) => {
  const response = await api.post("/auth/login", {
    email,
    password,
    role,
  });

  return response.data;
};

export const register = async (formData) => {
  const response = await api.post("/auth/register", formData);
  return response.data;
};

export const registerOtp = async (name, email) => {
  const response = await api.post("/auth/get-otp", {
    name,
    email,
  });
  return response.data;
};

export const forgotPasswordOtp = async (email) => {
  const response = await api.post("/auth/forgot-otp", {
    email,
  });

  return response.data;
};

export const resetPassword = async (email, otp, password) => {
  const response = await api.post("/auth/resetpassword", {
    email,
    otp,
    password,
  });

  return response.data;
};

export const refreshToken = async () => {
  const response = await api.post("/auth/refresh");

  return response.data;
};