import { z } from "zod";

/**
 * User settings validation schemas
 */

const exportFormatEnum = z.enum(["json", "csv"], {
  errorMap: () => ({ message: "Export format must be 'json' or 'csv'" }),
});

export const userSettingsSchemas = {
  // Export format enum
  exportFormat: exportFormatEnum,

  // Create user settings
  create: z.object({
    notifications: z.boolean().default(true),
    autoSync: z.boolean().default(false),
    darkMode: z.boolean().default(true),
    emailReminders: z.boolean().default(true),
    exportFormat: exportFormatEnum.default("json"),
    dataRetention: z
      .number()
      .int("Data retention must be a whole number")
      .min(1, "Data retention must be at least 1 day")
      .max(3650, "Data retention cannot exceed 10 years")
      .default(365),
  }),

  // Update user settings (all optional)
  update: z
    .object({
      notifications: z.boolean().optional(),
      autoSync: z.boolean().optional(),
      darkMode: z.boolean().optional(),
      emailReminders: z.boolean().optional(),
      exportFormat: exportFormatEnum.optional(),
      dataRetention: z
        .number()
        .int("Data retention must be a whole number")
        .min(1, "Data retention must be at least 1 day")
        .max(3650, "Data retention cannot exceed 10 years")
        .optional(),
    })
    .strict(),
} as const;
