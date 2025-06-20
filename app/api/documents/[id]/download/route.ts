import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  withValidation,
  createErrorResponse,
} from "@/lib/validation/api-utils";
import { requireAuth } from "@/lib/auth-helpers";
import { getDocumentById } from "@/lib/data-access/documents";
import {
  downloadDocument,
  generateDocumentPath,
} from "@/lib/storage/documents";
import { documentSchemas } from "@/lib/validation/schemas/documents";

// Route parameters schema
const paramsSchema = z.object({
  id: documentSchemas.id,
});

// Query parameters for download options
const querySchema = z.object({
  inline: z.coerce.boolean().default(false), // true = display in browser, false = force download
});

export const GET = withValidation(
  async (request: NextRequest, { params, query }) => {
    // Require authentication
    const user = await requireAuth();

    try {
      // Get document metadata
      const document = await getDocumentById(user.id, params!.id);
      if (!document) {
        return createErrorResponse(
          new Error("Document not found"),
          "Document not found"
        );
      }

      // Generate file path for download using shared helper to ensure consistency
      const filePath = generateDocumentPath(
        user.id,
        document.applicationId,
        params!.id,
        document.name
      );

      // Download file from storage
      const fileData = await downloadDocument(filePath);

      // Prepare response headers
      const headers = new Headers();

      // Set content type
      if (fileData.contentType) {
        headers.set("Content-Type", fileData.contentType);
      } else if (document.mimeType) {
        headers.set("Content-Type", document.mimeType);
      } else {
        headers.set("Content-Type", "application/octet-stream");
      }

      // Set content length
      headers.set("Content-Length", fileData.data.byteLength.toString());

      // Set disposition based on query parameter
      const disposition = query?.inline ? "inline" : "attachment";
      headers.set(
        "Content-Disposition",
        `${disposition}; filename="${document.name}"`
      );

      // Add cache headers
      headers.set("Cache-Control", "private, max-age=3600"); // 1 hour

      // Add security headers
      headers.set("X-Content-Type-Options", "nosniff");

      // Return file data
      return new NextResponse(fileData.data, {
        status: 200,
        headers,
      });
    } catch (error: any) {
      console.error("Document download error:", error);

      if (error.message?.includes("not found")) {
        return createErrorResponse(
          new Error("File not found in storage"),
          "File not found"
        );
      }

      return createErrorResponse(error, "Failed to download document");
    }
  },
  {
    paramsSchema,
    querySchema,
  }
);
