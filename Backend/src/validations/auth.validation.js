import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z
    .enum(["FARMER_GROUP", "COLLECTIVE", "ADMIN"], {
      message: "Invalid Role !!",
    })
    .optional(),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["FARMER_GROUP", "COLLECTIVE"]),
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .regex(/^[0-9]{10}$/, "Phone must be a valid 10-digit number"),
  otp: z.string().length(6, "OTP must be 6 digits"),
  leader: z
    .string()
    .min(2, "Leader/Manager name must be at least 2 characters"),
});
