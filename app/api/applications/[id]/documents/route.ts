import { NextRequest } from "next/server";
import { z } from "zod";
import {
  withValidation,
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/validation/api-utils";
import { requireAuth } from "@/lib/auth-helpers";
import { getApplicationById } from "@/lib/data-access/applications";
import { getDocumentsByApplicationId } from "@/lib/data-access/documents";
import { applicationSchemas } from "@/lib/validation/schemas/applications";

// Route parameters schema
const paramsSchema = z.object({
  id: applicationSchemas.id,
});

export const GET = withValidation(
  async (request: NextRequest, { params }) => {
    // Require authentication
    const user = await requireAuth();

    // First verify the application exists and belongs to the user
    const application = await getApplicationById(user.id, params!.id);
    if (!application) {
      return createErrorResponse(
        new Error("Application not found"),
        "Application not found"
      );
    }

    // Get documents for this application
    const documents = await getDocumentsByApplicationId(user.id, params!.id);

    return createSuccessResponse(
      {
        applicationId: params!.id,
        documents,
      },
      "Documents retrieved successfully"
    );
  },
  {
    paramsSchema,
  }
);
