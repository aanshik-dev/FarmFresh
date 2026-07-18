import api from "./axios";

export const getAIAdvice = async (prompt) => {
  const response = await api.post("/ai/advise", { prompt });
  return response.data;
};
