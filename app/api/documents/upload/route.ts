import { NextRequest } from "next/server";
import { z } from "zod";
import {
  withValidation,
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/validation/api-utils";
import { requireAuth } from "@/lib/auth-helpers";
import { getApplicationById } from "@/lib/data-access/applications";
import { validateFile } from "@/lib/storage/documents";
import { commonSchemas } from "@/lib/validation/schemas/common";

// Query parameters schema
const querySchema = z.object({
  applicationId: commonSchemas.uuid,
  validate: z.coerce.boolean().default(true),
});

/**
 * Direct file upload endpoint
 * This endpoint handles file uploads and returns upload metadata
 * Useful for frontend file upload components that need to validate files before submission
 */
export const POST = withValidation(
  async (request: NextRequest, { query }) => {
    // Require authentication
    const user = await requireAuth();

    try {
      // Verify the application exists and belongs to the user
      const application = await getApplicationById(
        user.id,
        query!.applicationId
      );
      if (!application) {
        return createErrorResponse(
          new Error("Application not found"),
          "Application not found or access denied"
        );
      }

      // Parse form data for file upload
      const formData = await request.formData();

      // Extract file
      const fileField = formData.get("file");
      if (!(fileField instanceof File)) {
        return createErrorResponse(
          new Error("No file provided"),
          "File is required"
        );
      }
      const file = fileField as File;

      // Validate file if requested
      if (query?.validate !== false) {
        validateFile(file);
      }
      // Return file metadata for client-side processing
      const fileMetadata = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified || Date.now(),
        applicationId: query!.applicationId,
        isValid: true,
      };

      return createSuccessResponse(fileMetadata, "File validated successfully");
    } catch (error: any) {
      console.error("File upload validation error:", error);

      if (error.message?.includes("File size too large")) {
        return createErrorResponse(error, "File size too large");
      }

      if (error.message?.includes("not allowed")) {
        return createErrorResponse(error, "File type not allowed");
      }

      if (error.message?.includes("Invalid file name")) {
        return createErrorResponse(error, "Invalid file name");
      }

      return createErrorResponse(error, "File validation failed");
    }
  },
  {
    querySchema,
  }
);
