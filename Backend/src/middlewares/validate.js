import { z } from "zod";

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      const messages = err.errors.map(
        (e) => `${e.path.join(".")}: ${e.message}`,
      );
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: messages,
      });
    }
    next(err);
  }
};

export default validate;
