import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["FARMER_GROUP", "COLLECTIVE", "ADMIN"]).optional(),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["FARMER_GROUP", "COLLECTIVE"]),
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^[0-9]{10}$/, "Phone must be a valid 10-digit number"),
  state: z.string().min(2, "State is required"),
  city: z.string().min(2, "City is required"),
  area: z.string().min(2, "Area/District is required"),
  village: z.string().min(2, "Village is required"),
  pinCode: z.string().regex(/^[0-9]{6}$/, "Pincode must be 6 digits"),
  lat: z.coerce.number().min(-90).max(90),
  long: z.coerce.number().min(-180).max(180),
  otp: z.string().length(6, "OTP must be 6 digits"),
  // Optional/role-specific fields
  leadFarmer: z.string().optional(),
  farmerCount: z.coerce.number().optional(),
  workers: z.coerce.number().optional(),
  crops: z.string().optional(), // sent as JSON stringified array
});
