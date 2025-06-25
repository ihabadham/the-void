import { NextRequest } from "next/server";
import { z } from "zod";
import {
  withValidation,
  createSuccessResponse,
} from "@/lib/validation/api-utils";
import { requireAuth } from "@/lib/auth-helpers";
import {
  logOutreachBatch,
  getAllUserOutreach,
} from "@/lib/data-access/outreach";
import { commonSchemas } from "@/lib/validation/schemas/common";

// Request body validation for POST
const bodySchema = z.object({
  applicationId: commonSchemas.uuid.optional(),
  company: z.string().max(100).optional(),
  messageBody: z.string().min(1).max(1000),
  contacts: z.array(z.string().url()).min(1).max(20),
});

// Query params validation for GET
const querySchema = z.object({
  status: z.enum(["pending", "accepted", "ignored", "other"]).optional(),
  company: z.string().max(100).optional(),
});

export const POST = withValidation(
  async (request: NextRequest, { body }) => {
    const user = await requireAuth();

    const actions = await logOutreachBatch({
      userId: user.id,
      applicationId: body?.applicationId,
      company: body?.company,
      messageBody: body!.messageBody,
      contactUrls: body!.contacts,
    });

    return createSuccessResponse(actions, "Outreach logged successfully", 201);
  },
  {
    bodySchema,
  }
);

export const GET = withValidation(
  async (request: NextRequest, { query }) => {
    const user = await requireAuth();

    const filters = query
      ? {
          status: query.status,
          company: query.company,
        }
      : undefined;

    const actions = await getAllUserOutreach(user.id, filters);

    return createSuccessResponse(actions, "Outreach actions fetched");
  },
  {
    querySchema,
  }
);
