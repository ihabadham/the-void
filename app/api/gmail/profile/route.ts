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

    // Get Gmail profile
    const profile = await gmailService.getUserProfile();

    return NextResponse.json({
      success: true,
      profile: {
        emailAddress: profile.emailAddress,
        messagesTotal: profile.messagesTotal,
        threadsTotal: profile.threadsTotal,
        historyId: profile.historyId,
      },
    });
  } catch (error) {
    console.error("Gmail profile API error:", error);

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
      { error: "Failed to get Gmail profile" },
      { status: 500 }
    );
  }
}
