import { z } from "zod";

export const addCropSchema = z.object({
  code: z.string().trim().min(1, "Crop Code is required !!"),

  price: z.coerce
    .number({
      required_error: "Price is required !!",
      invalid_type_error: "Price must be a number !!",
    })
    .positive("Price must be greater than 0 !!"),
});

export const farmerCropAddSchema = z.object({
  code: z.string().trim().min(1, "Crop Code is required !!"),
  yld: z.coerce
    .number({
      required_error: "Yield is required !!",
      invalid_type_error: "Yield must be a number !!",
    })
    .positive("Yield must be greater than 0 !!"),
});

export const editCropSchema = z.object({
  id: z.string().trim().min(1, "Crop ID is required !!"),

  price: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce
      .number({
        required_error: "Price is required !!",
        invalid_type_error: "Price must be a number !!",
      })
      .positive("Price must be greater than 0 !!")
      .optional(),
  ),
  quantity: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce
      .number({
        required_error: "Quantity is required !!",
        invalid_type_error: "Quantity must be a number !!",
      })
      .positive("Quantity must be greater than 0 !!")
      .optional(),
  ),

  status: z
    .enum(["ACTIVE", "INACTIVE"], {
      required_error: "Status is required !!",
      invalid_type_error: "Invalid Status !!",
    })
    .optional(),
});

export const editFarmerCropSchema = z.object({
  id: z.string().trim().min(1, "Crop ID is required !!"),

  yld: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce
      .number({
        required_error: "Yield is required !!",
        invalid_type_error: "Yield must be a number !!",
      })
      .positive("Yield must be greater than 0 !!")
      .optional(),
  ),
  plantedDate: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid Date Format !!")
      .optional(),
  ),
  status: z
    .enum(["ACTIVE", "INACTIVE"], {
      required_error: "Status is required !!",
      invalid_type_error: "Invalid Status !!",
    })
    .optional(),
});
