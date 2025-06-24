import { z } from "zod";
import { commonSchemas } from "./common";

/**
 * Application validation schemas
 */

const statusEnum = z.enum(
  ["applied", "assessment", "interview", "offer", "rejected", "withdrawn"],
  {
    errorMap: () => ({ message: "Invalid application status" }),
  }
);

export const applicationSchemas = {
  // Status enum validation
  status: statusEnum,

  // Base application schema (for creation)
  create: z.object({
    company: commonSchemas.nonEmptyString.max(
      100,
      "Company name too long (max 100 characters)"
    ),
    position: commonSchemas.nonEmptyString.max(
      100,
      "Position title too long (max 100 characters)"
    ),
    status: statusEnum.default("applied"),
    appliedDate: commonSchemas.timestamp,
    nextDate: commonSchemas.timestamp.optional(),
    nextEvent: z
      .string()
      .max(100, "Event description too long (max 100 characters)")
      .optional(),
    cvVersion: z
      .string()
      .max(50, "CV version too long (max 50 characters)")
      .optional(),
    notes: z
      .string()
      .max(2000, "Notes too long (max 2000 characters)")
      .optional(),
    jobUrl: commonSchemas.url,
  }),

  // Update schema (all fields optional except protected ones)
  update: z
    .object({
      company: z
        .string()
        .min(1, "Company name is required")
        .max(100, "Company name too long (max 100 characters)")
        .optional(),
      position: z
        .string()
        .min(1, "Position title is required")
        .max(100, "Position title too long (max 100 characters)")
        .optional(),
      status: statusEnum.optional(),
      appliedDate: commonSchemas.timestamp.optional(),
      nextDate: commonSchemas.timestamp.nullable().optional(),
      nextEvent: z
        .string()
        .max(100, "Event description too long (max 100 characters)")
        .nullable()
        .optional(),
      cvVersion: z
        .string()
        .max(50, "CV version too long (max 50 characters)")
        .nullable()
        .optional(),
      notes: z
        .string()
        .max(2000, "Notes too long (max 2000 characters)")
        .nullable()
        .optional(),
      jobUrl: z.string().url("Invalid URL format").nullable().optional(),
    })
    .strict(), // Prevent additional properties

  // ID validation for params
  id: commonSchemas.uuid,
} as const;
