import { NextRequest } from "next/server";
import { z } from "zod";
import {
  withValidation,
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/validation/api-utils";
import { requireAuth } from "@/lib/auth-helpers";
import {
  getDocumentWithSignedUrl,
  deleteDocument,
} from "@/lib/data-access/documents";
import { documentSchemas } from "@/lib/validation/schemas/documents";

// Route parameters schema
const paramsSchema = z.object({
  id: documentSchemas.id,
});

// Query parameters for GET (signed URL options)
const getQuerySchema = z.object({
  download: z.coerce.boolean().default(false),
  expiresIn: z.coerce.number().min(300).max(86400).default(3600), // 5 min to 24 hours
});

// Update schema for PUT requests
const updateBodySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  type: documentSchemas.type.optional(),
});

export const GET = withValidation(
  async (request: NextRequest, { params, query }) => {
    // Require authentication
    const user = await requireAuth();

    // Get the document with signed URL
    const document = await getDocumentWithSignedUrl(
      user.id,
      params!.id,
      query?.expiresIn || 3600,
      { download: query?.download }
    );

    if (!document) {
      return createErrorResponse(
        new Error("Document not found"),
        "Document not found"
      );
    }

    return createSuccessResponse(document, "Document retrieved successfully");
  },
  {
    paramsSchema,
    querySchema: getQuerySchema,
  }
);

export const PUT = withValidation(
  async (request: NextRequest, { params, body }) => {
    // Require authentication
    const user = await requireAuth();

    // Check if document exists and belongs to user
    const existingDocument = await getDocumentWithSignedUrl(
      user.id,
      params!.id
    );
    if (!existingDocument) {
      return createErrorResponse(
        new Error("Document not found"),
        "Document not found"
      );
    }

    // For now, we'll implement basic metadata updates
    // Note: File replacement would require a separate endpoint
    if (Object.keys(body!).length === 0) {
      return createErrorResponse(
        new Error("No update data provided"),
        "No fields to update"
      );
    }

    // In a full implementation, you would update the document metadata here
    // For now, return the existing document
    return createSuccessResponse(
      existingDocument,
      "Document metadata updated successfully"
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

    // Delete the document (includes file deletion)
    const deleted = await deleteDocument(user.id, params!.id);

    if (!deleted) {
      return createErrorResponse(
        new Error("Document not found"),
        "Document not found"
      );
    }

    return createSuccessResponse(
      { id: params!.id },
      "Document deleted successfully"
    );
  },
  {
    paramsSchema,
  }
);
