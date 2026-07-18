import Groq from "groq-sdk";
import throwErr from "../utils/throwErr.js";

export const getCropAdvice = async (req, res, next) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return throwErr(400, "Prompt is required !!");
    }

    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured on the server.");
    }

    // Initialize Groq API client inside the function to ensure env is loaded
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const systemPrompt = `You are FarmAssist, a friendly, farmer-focused AI agricultural advisor.
You help farmers with crop recommendations, pest control, soil management, and weather-related advice.
CRITICAL INSTRUCTIONS:
- ALWAYS provide brief, actionable, and step-based answers.
- Use simple bullet points. Keep it short and easy to read for a farmer on a mobile device.
- Do not give unsafe or non-agricultural advice.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      model: "llama-3.1-8b-instant", // Fast and free-tier friendly model on Groq
      temperature: 0.7,
      max_tokens: 1024,
    });

    const advice = chatCompletion.choices[0]?.message?.content || "No response generated.";

    return res.status(200).json({
      success: true,
      message: "Advice generated successfully",
      data: {
        advice,
      },
    });
  } catch (error) {
    console.error("Groq API Error:", error);
    
    // If it's a rate limit error from Groq
    if (error.status === 429) {
      const err = new Error("Rate limit exceeded. Please try again later.");
      err.statusCode = 429;
      return next(err);
    }
    
    // For our own validation errors or other errors
    if (error.statusCode) {
      return next(error);
    }

    // Default 500 error
    const err = new Error(error.message || "Failed to get AI advice");
    err.statusCode = 500;
    next(err);
  }
};
