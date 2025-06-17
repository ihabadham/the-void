import { NextRequest } from "next/server";
import { z } from "zod";
import {
  withValidation,
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/validation/api-utils";
import { requireAuth } from "@/lib/auth-helpers";
import {
  getApplicationById,
  updateApplication,
  deleteApplication,
} from "@/lib/data-access/applications";
import { applicationSchemas } from "@/lib/validation/schemas/applications";

// Route parameters schema
const paramsSchema = z.object({
  id: applicationSchemas.id,
});

// Request body schema for PUT requests
const updateBodySchema = applicationSchemas.update;

export const GET = withValidation(
  async (request: NextRequest, { params }) => {
    // Require authentication
    const user = await requireAuth();

    // Get the specific application
    const application = await getApplicationById(user.id, params!.id);

    if (!application) {
      return createErrorResponse(
        new Error("Application not found"),
        "Application not found"
      );
    }

    return createSuccessResponse(
      application,
      "Application retrieved successfully"
    );
  },
  {
    paramsSchema,
  }
);

export const PUT = withValidation(
  async (request: NextRequest, { params, body }) => {
    // Require authentication
    const user = await requireAuth();

    // Check if application exists and belongs to user
    const existingApplication = await getApplicationById(user.id, params!.id);
    if (!existingApplication) {
      return createErrorResponse(
        new Error("Application not found"),
        "Application not found"
      );
    }

    // Update the application
    const updatedApplication = await updateApplication(
      user.id,
      params!.id,
      body!
    );

    if (!updatedApplication) {
      return createErrorResponse(
        new Error("Failed to update application"),
        "Failed to update application"
      );
    }

    return createSuccessResponse(
      updatedApplication,
      "Application updated successfully"
    );
  },
  {
    paramsSchema,
    bodySchema: updateBodySchema,
  }
);

export const DELETE = withValidation(
  async (request: NextRequest, { params }) => {
    // Require authentication
    const user = await requireAuth();

    // Check if application exists and belongs to user
    const existingApplication = await getApplicationById(user.id, params!.id);
    if (!existingApplication) {
      return createErrorResponse(
        new Error("Application not found"),
        "Application not found"
      );
    }

    // Delete the application
    const deleted = await deleteApplication(user.id, params!.id);

    if (!deleted) {
      return createErrorResponse(
        new Error("Failed to delete application"),
        "Failed to delete application"
      );
    }

    return createSuccessResponse(
      { id: params!.id },
      "Application deleted successfully"
    );
  },
  {
    paramsSchema,
  }
);
