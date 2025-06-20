import { z } from "zod";
import { commonSchemas } from "./common";

/**
 * API request validation schemas
 */
export const apiSchemas = {
  // Gmail search parameters
  gmail: {
    search: z.object({
      q: z
        .string()
        .min(1, "Search query is required")
        .max(500, "Search query too long (max 500 characters)"),
      maxResults: z.coerce
        .number()
        .int("Max results must be a whole number")
        .min(1, "Max results must be at least 1")
        .max(50, "Max results cannot exceed 50")
        .default(20),
    }),
  },

  // Pagination parameters
  pagination: z.object({
    page: z.coerce
      .number()
      .int("Page must be a whole number")
      .min(1, "Page must be at least 1")
      .default(1),
    limit: z.coerce
      .number()
      .int("Limit must be a whole number")
      .min(1, "Limit must be at least 1")
      .max(100, "Limit cannot exceed 100")
      .default(20),
  }),

  // Generic ID parameter
  params: {
    id: z.object({
      id: commonSchemas.uuid,
    }),
  },
} as const;
