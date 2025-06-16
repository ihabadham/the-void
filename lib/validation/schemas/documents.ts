import { z } from "zod";
import { commonSchemas } from "./common";

/**
 * Document validation schemas
 */

export const documentSchemas = {
  // Document type enum
  type: z.enum(["cv", "cover-letter", "portfolio", "other"], {
    errorMap: () => ({ message: "Invalid document type" }),
  }),

  // Create document
  create: z.object({
    name: commonSchemas.nonEmptyString.max(
      255,
      "Document name too long (max 255 characters)"
    ),
    type: z.enum(["cv", "cover-letter", "portfolio", "other"]).default("other"),
    url: commonSchemas.url, // Validate URL format while keeping it optional
    size: z
      .number()
      .int("File size must be a whole number")
      .min(0, "File size cannot be negative")
      .max(50 * 1024 * 1024, "File size cannot exceed 50MB"), // 50MB limit
    applicationId: commonSchemas.uuid, // Required field
    mimeType: z.string().optional(),
  }),

  // ID validation
  id: commonSchemas.uuid,
} as const;
