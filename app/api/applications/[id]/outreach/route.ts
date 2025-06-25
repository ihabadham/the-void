import { NextRequest } from "next/server";
import {
  withValidation,
  createSuccessResponse,
} from "@/lib/validation/api-utils";
import { requireAuth } from "@/lib/auth-helpers";
import { z } from "zod";
import { applicationSchemas } from "@/lib/validation/schemas/applications";
import { getOutreachByApplicationId } from "@/lib/data-access/outreach";

const paramsSchema = z.object({
  id: applicationSchemas.id,
});

export const GET = withValidation(
  async (request: NextRequest, { params }) => {
    const user = await requireAuth();

    const actions = await getOutreachByApplicationId(user.id, params!.id);

    return createSuccessResponse(actions, "Outreach actions fetched");
  },
  { paramsSchema }
);
