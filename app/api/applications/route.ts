import { NextRequest } from "next/server";
import { z } from "zod";
import {
  withValidation,
  createSuccessResponse,
  createPaginatedResponse,
} from "@/lib/validation/api-utils";
import { requireAuth } from "@/lib/auth-helpers";
import {
  getApplicationsByUserId,
  createApplication,
} from "@/lib/data-access/applications";
import { applicationSchemas } from "@/lib/validation/schemas/applications";

// Query parameters schema for GET requests
const querySchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20),
  status: applicationSchemas.status.optional(),
  search: z.string().max(100).optional(),
  sortBy: z
    .enum(["createdAt", "appliedDate", "company", "position"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Request body schema for POST requests
const createBodySchema = applicationSchemas.create;

export const GET = withValidation(
  async (request: NextRequest, { query }) => {
    // Require authentication
    const user = await requireAuth();

    // Use unified function with optional pagination
    const result = await getApplicationsByUserId(user.id, query || {});

    // Check if result is paginated or simple array
    if (Array.isArray(result)) {
      // Simple array result - create basic pagination info
      return createPaginatedResponse(
        result,
        {
          page: 1,
          limit: result.length,
          total: result.length,
        },
        "Applications retrieved successfully"
      );
    } else {
      // Paginated result
      return createPaginatedResponse(
        result.applications,
        result.pagination,
        "Applications retrieved successfully"
      );
    }
  },
  {
    querySchema,
  }
);

export const POST = withValidation(
  async (request: NextRequest, { body }) => {
    // Require authentication
    const user = await requireAuth();

    // Create application with user ID - body is guaranteed to be validated by this point
    const applicationData = {
      ...body!,
      userId: user.id,
    };

    const newApplication = await createApplication(applicationData);

    return createSuccessResponse(
      newApplication,
      "Application created successfully",
      201
    );
  },
  {
    bodySchema: createBodySchema,
  }
);
