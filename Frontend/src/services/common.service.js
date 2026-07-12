import api from "./axios.js";

export const getAllCrops = async () => {
  const response = await api.get("/data/crops");
  return response.data;
};
