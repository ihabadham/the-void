import { NextRequest, NextResponse } from "next/server";
import { GmailService } from "@/lib/gmail-service";

export async function GET(req: NextRequest) {
  try {
    // Create Gmail service for current authenticated user
    const gmailService = await GmailService.forCurrentUser();

    if (!gmailService) {
      return NextResponse.json(
        { error: "Gmail not connected", needsConnection: true },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const maxResults = parseInt(searchParams.get("maxResults") || "20");

    if (!query) {
      return NextResponse.json(
        { error: "Search query 'q' parameter is required" },
        { status: 400 }
      );
    }

    // Validate and sanitize query
    if (query.length > 500) {
      return NextResponse.json(
        { error: "Search query too long (max 500 characters)" },
        { status: 400 }
      );
    }

    // Search emails
    const emails = await gmailService.searchEmails(
      query,
      Math.min(maxResults, 50) // Cap at 50 for performance
    );

    return NextResponse.json({
      success: true,
      query,
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
        return NextResponse.json(
          { error: "Invalid search query format" },
          { status: 400 }
        );
      }

      if (error.message.includes("quota")) {
        return NextResponse.json(
          { error: "Gmail API quota exceeded", retryAfter: 3600 },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to search emails" },
      { status: 500 }
    );
  }
}
