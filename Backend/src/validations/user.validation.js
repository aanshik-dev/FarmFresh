import { z } from "zod";

export const updateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  phone: z
    .string()
    .regex(/^[0-9]{10}$/, "Phone must be a valid 10-digit number")
    .optional(),
  desc: z.string().optional(),
  leader: z
    .string()
    .min(2, "Leader/Manager name must be at least 2 characters")
    .optional(),
  farmerCount: z.number().int().min(1).optional(),
  workers: z.number().int().min(0).optional(),
  address: z
    .object({
      locality: z.string().optional(),
      area: z.string().optional(),
      town: z.string().optional(),
      district: z.string().optional(),
      state: z.string().optional(),
      pinCode: z.string().optional(),
    })
    .optional(),
  coord: z
    .object({
      lat: z.number().optional(),
      long: z.number().optional(),
    })
    .optional(),
});
