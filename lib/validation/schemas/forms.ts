import { z } from "zod";
import { applicationSchemas } from "./applications";
import { userSettingsSchemas } from "./settings";

/**
 * Form validation schemas (for client-side)
 */
export const formSchemas = {
  // Application form
  application: applicationSchemas.create.extend({
    // Allow string dates for form inputs
    appliedDate: z
      .string()
      .min(1, "Applied date is required")
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    nextDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      .optional()
      .or(z.literal("")),
  }),

  // Settings form
  settings: userSettingsSchemas.update,
} as const;
