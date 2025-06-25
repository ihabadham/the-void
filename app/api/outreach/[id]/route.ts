import { NextRequest } from "next/server";
import { z } from "zod";
import {
  withValidation,
  createSuccessResponse,
} from "@/lib/validation/api-utils";
import { requireAuth } from "@/lib/auth-helpers";
import { updateOutreachStatus } from "@/lib/data-access/outreach";
import { commonSchemas } from "@/lib/validation/schemas/common";

const paramsSchema = z.object({
  id: commonSchemas.uuid,
});

const bodySchema = z.object({
  status: z.enum(["pending", "accepted", "ignored", "other"]),
  respondedAt: commonSchemas.timestamp.optional(),
});

export const PATCH = withValidation(
  async (request: NextRequest, { params, body }) => {
    const user = await requireAuth();

    const action = await updateOutreachStatus(
      user.id,
      params!.id,
      body!.status,
      body!.respondedAt
    );

    return createSuccessResponse(action, "Outreach status updated");
  },
  {
    paramsSchema,
    bodySchema,
  }
);
