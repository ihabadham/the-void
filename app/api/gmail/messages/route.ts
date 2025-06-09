import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createGmailClient } from "@/lib/gmail";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const gmail = await createGmailClient(session.accessToken);

    // Search for job-related emails
    const messages = await gmail.searchJobApplicationEmails();

    return NextResponse.json({
      success: true,
      count: messages.length,
      messages: messages.slice(0, 10), // Limit to first 10 for demo
    });
  } catch (error) {
    console.error("Gmail API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch emails",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
