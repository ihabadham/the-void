import { z } from "zod";
import { commonSchemas } from "./common";

/**
 * Outreach validation schemas
 */

export const outreachSchemas = {
  // Status enum validation
  status: z.enum(["pending", "accepted", "ignored", "other"], {
    errorMap: () => ({ message: "Invalid outreach status" }),
  }),

  /** Contact creation */
  contactCreate: z.object({
    fullName: z
      .string()
      .min(1, "Full name is required")
      .max(100, "Full name too long (max 100 characters)")
      .optional(),
    headline: z
      .string()
      .max(150, "Headline too long (max 150 characters)")
      .optional(),
    linkedinUrl: z
      .string()
      .url("Invalid LinkedIn URL format")
      .min(1, "LinkedIn URL is required"),
    avatarUrl: commonSchemas.url.optional(),
  }),

  /** Message body */
  messageUpsert: z.object({
    applicationId: commonSchemas.uuid,
    body: z
      .string()
      .min(1, "Message body is required")
      .max(1000, "Message too long (max 1000 characters)"),
  }),

  /** Log outreach action */
  actionCreate: z.object({
    contactId: commonSchemas.uuid,
    applicationId: commonSchemas.uuid.optional(),
    company: z
      .string()
      .max(100, "Company name too long (max 100 characters)")
      .optional(),
    messageId: commonSchemas.uuid.optional(),
    status: z
      .enum(["pending", "accepted", "ignored", "other"])
      .default("pending"),
    sentAt: commonSchemas.timestamp.optional(),
    respondedAt: commonSchemas.timestamp.optional().nullable(),
    notes: z
      .string()
      .max(2000, "Notes too long (max 2000 characters)")
      .optional(),
  }),

  // ID validation
  id: commonSchemas.uuid,
} as const;
