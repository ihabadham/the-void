import { NextRequest } from "next/server";
import { GmailService } from "@/lib/gmail-service";
import {
  withValidation,
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/validation/api-utils";
import { apiSchemas } from "@/lib/validation/schemas/api";

export const GET = withValidation(
  async (request: NextRequest, { query }) => {
    try {
      // Create Gmail service for current authenticated user
      const gmailService = await GmailService.forCurrentUser();

      if (!gmailService) {
        return createErrorResponse(
          new Error("Gmail not connected"),
          "Gmail not connected"
        );
      }

      // Query is already validated by withValidation
      const { q, maxResults } = query!;

      // Search emails
      const emails = await gmailService.searchEmails(q, maxResults);

      return createSuccessResponse({
        query: q,
        totalResults: emails.length,
        emails: emails.map((email) => ({
          id: email.id,
          threadId: email.threadId,
          subject:
            email.payload?.headers?.find(
              (h: any) => h.name.toLowerCase() === "subject"
            )?.value || "No Subject",
          from:
            email.payload?.headers?.find(
              (h: any) => h.name.toLowerCase() === "from"
            )?.value || "Unknown Sender",
          date: new Date(parseInt(email.internalDate)),
          snippet: email.snippet || "",
          labels: email.labelIds || [],
        })),
      });
    } catch (error) {
      console.error("Gmail search API error:", error);

      // Handle specific Gmail API errors
      if (error instanceof Error) {
        if (error.message.includes("invalid query")) {
          return createErrorResponse(
            new Error("Invalid search query format"),
            "Invalid search query format"
          );
        }

        if (error.message.includes("quota")) {
          return createErrorResponse(
            new Error("Gmail API quota exceeded"),
            "Gmail API quota exceeded"
          );
        }
      }

      return createErrorResponse(error, "Failed to search emails");
    }
  },
  {
    querySchema: apiSchemas.gmail.search,
  }
);
