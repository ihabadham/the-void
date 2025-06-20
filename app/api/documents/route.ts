import { NextRequest } from "next/server";
import { z } from "zod";
import {
  withValidation,
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/validation/api-utils";
import { requireAuth } from "@/lib/auth-helpers";
import {
  getDocumentsByUserId,
  createDocumentWithFile,
} from "@/lib/data-access/documents";
import { getApplicationById } from "@/lib/data-access/applications";
import { documentSchemas } from "@/lib/validation/schemas/documents";
import { commonSchemas } from "@/lib/validation/schemas/common";

// Query parameters schema for GET requests
const querySchema = z.object({
  applicationId: commonSchemas.uuid.optional(),
  type: documentSchemas.type.optional(),
});

export const GET = withValidation(
  async (request: NextRequest, { query }) => {
    // Require authentication
    const user = await requireAuth();

    // Get documents for user with filtering
    const documents = await getDocumentsByUserId(user.id, {
      applicationId: query?.applicationId,
      type: query?.type,
    });

    return createSuccessResponse(documents, "Documents retrieved successfully");
  },
  {
    querySchema,
  }
);

export const POST = withValidation(async (request: NextRequest) => {
  // Require authentication
  const user = await requireAuth();

  try {
    // Parse form data for file upload
    const formData = await request.formData();

    // Extract file
    const file = formData.get("file") as File;
    if (!file) {
      return createErrorResponse(
        new Error("No file provided"),
        "File is required"
      );
    }

    // Extract and validate document metadata
    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const applicationId = formData.get("applicationId") as string;

    // Validate required fields
    const documentData = {
      name: name || file.name,
      type: type || "other",
      applicationId,
    };

    const validatedData = {
      name: documentData.name,
      type: documentSchemas.type.parse(documentData.type),
      applicationId: commonSchemas.uuid.parse(documentData.applicationId),
    };

    // Verify the application exists and belongs to the user
    const application = await getApplicationById(
      user.id,
      validatedData.applicationId
    );
    if (!application) {
      return createErrorResponse(
        new Error("Application not found"),
        "Application not found or access denied"
      );
    }

    // Create document with file
    const newDocument = await createDocumentWithFile(
      file,
      {
        ...validatedData,
        userId: user.id,
      },
      user.id,
      validatedData.applicationId
    );

    return createSuccessResponse(
      newDocument,
      "Document uploaded successfully",
      201
    );
  } catch (error: any) {
    console.error("Document upload error:", error);

    if (error.message?.includes("File size too large")) {
      return createErrorResponse(error, "File size too large");
    }

    if (error.message?.includes("not allowed")) {
      return createErrorResponse(error, "File type not allowed");
    }

    return createErrorResponse(error, "Failed to upload document");
  }
});
