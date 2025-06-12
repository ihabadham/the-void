import { NextRequest, NextResponse } from "next/server";
import { GmailService, type GmailServiceOptions } from "@/lib/gmail-service";

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
    const maxResults = parseInt(searchParams.get("maxResults") || "50");
    const daysBack = parseInt(searchParams.get("daysBack") || "30");
    const includeSpam = searchParams.get("includeSpam") === "true";
    const includeTrash = searchParams.get("includeTrash") === "true";

    const options: GmailServiceOptions = {
      maxResults: Math.min(maxResults, 100), // Cap at 100 for performance
      daysBack: Math.min(daysBack, 365), // Cap at 1 year
      includeSpam,
      includeTrash,
    };

    // Fetch job-related emails
    const emails = await gmailService.fetchJobEmails(options);

    // Group emails by category for better frontend handling
    const emailsByCategory = emails.reduce(
      (acc, email) => {
        if (!acc[email.category]) {
          acc[email.category] = [];
        }
        acc[email.category].push(email);
        return acc;
      },
      {} as Record<string, typeof emails>
    );

    // Calculate summary statistics
    const summary = {
      totalEmails: emails.length,
      categoryCounts: Object.keys(emailsByCategory).reduce(
        (acc, category) => {
          acc[category] = emailsByCategory[category].length;
          return acc;
        },
        {} as Record<string, number>
      ),
      averageConfidence:
        emails.length > 0
          ? emails.reduce((sum, email) => sum + email.confidence, 0) /
            emails.length
          : 0,
      dateRange: {
        from: daysBack,
        oldest: emails.length > 0 ? emails[emails.length - 1].date : null,
        newest: emails.length > 0 ? emails[0].date : null,
      },
    };

    return NextResponse.json({
      success: true,
      summary,
      emails,
      emailsByCategory,
      options,
    });
  } catch (error) {
    console.error("Gmail emails API error:", error);

    // Handle specific Gmail API errors
    if (error instanceof Error) {
      if (error.message.includes("insufficient authentication scopes")) {
        return NextResponse.json(
          { error: "Gmail permissions insufficient", needsReconnection: true },
          { status: 403 }
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
      { error: "Failed to fetch emails from Gmail" },
      { status: 500 }
    );
  }
}
