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

      // Handle Gmail API errors -> cc https://developers.google.com/workspace/gmail/api/guides/handle-errors
      const apiErr = error as any; // Gmail API error from googleapis
      const status = apiErr.response?.status;
      const reason = apiErr.response?.data?.error?.errors?.[0]?.reason;

      // Invalid query → 400 Bad Request or reason="badRequest"
      if (status === 400 || reason === "badRequest") {
        return createErrorResponse(
          new Error("Invalid search query format"),
          "Invalid search query format"
        );
      }

      // Quota exceeded → 403 Forbidden or userRateLimitExceeded/dailyLimitExceeded
      if (
        status === 403 ||
        [
          "userRateLimitExceeded",
          "dailyLimitExceeded",
          "rateLimitExceeded",
        ].includes(reason)
      ) {
        return createErrorResponse(
          new Error("Gmail API quota exceeded"),
          "Gmail API quota exceeded"
        );
      }

      // Fallback for any other errors
      return createErrorResponse(error, "Failed to search emails");
    }
  },
  {
    querySchema: apiSchemas.gmail.search,
  }
);
