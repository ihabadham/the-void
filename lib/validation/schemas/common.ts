import { z } from "zod";

/**
 * Common validation patterns
 */

export const commonSchemas = {
  uuid: z.string().uuid("Invalid UUID format"),
  email: z.string().email("Invalid email format"),
  url: z.string().url("Invalid URL format").optional(),
  nonEmptyString: z.string().min(1, "This field is required"),
  positiveNumber: z.number().positive("Must be a positive number"),
  dateString: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  timestamp: z.coerce.date(),
} as const;
