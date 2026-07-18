import api from "./axios.js";

export const getCurrentUser = async () => {
  const response = await api.get("/user/me");
  return response.data.user;
};

export const updateProfile = async (formData) => {
  const response = await api.patch("/user/me/update", formData);
  return response;
};

export const deactivateAccount = async () => {
  const response = await api.patch("/user/me/deactivate");
  return response;
};

export const resetPassword = async (oldPass, newPass) => {
  const response = await api.patch("/user/me/change-password", { oldPass, newPass });
  return response;
};
