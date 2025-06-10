import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGmailTokensSecurely } from "@/lib/gmail-token-store";
import { createAuthenticatedGmailClient } from "@/lib/gmail-server";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Retrieve tokens securely from server-side storage
    const tokens = await getGmailTokensSecurely(session.user.email);

    if (!tokens) {
      return NextResponse.json(
        { error: "Gmail not connected" },
        { status: 400 }
      );
    }

    // Create authenticated Gmail client
    const gmail = createAuthenticatedGmailClient(tokens);

    // Example: Get recent messages (this would be expanded for real functionality)
    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults: 10,
    });

    return NextResponse.json({
      success: true,
      messages: response.data.messages || [],
      resultSizeEstimate: response.data.resultSizeEstimate || 0,
    });
  } catch (error) {
    console.error("Gmail emails API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch emails",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
