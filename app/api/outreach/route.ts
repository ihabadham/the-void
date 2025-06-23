import { NextRequest } from "next/server";
import { z } from "zod";
import {
  withValidation,
  createSuccessResponse,
} from "@/lib/validation/api-utils";
import { requireAuth } from "@/lib/auth-helpers";
import { logOutreachBatch } from "@/lib/data-access/outreach";
import { commonSchemas } from "@/lib/validation/schemas/common";

// Request body validation
const bodySchema = z.object({
  applicationId: commonSchemas.uuid.optional(),
  company: z.string().max(100).optional(),
  messageBody: z.string().min(1).max(1000),
  contacts: z.array(z.string().url()).min(1).max(20),
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
