import api from "./axios";

export const getAIAdvice = async (messages) => {
  const response = await api.post("/ai/advise", { messages });
  return response.data;
};
