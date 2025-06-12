import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createGmailClient } from "@/lib/gmail";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get limit from query params with default
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 100);

    const gmail = await createGmailClient(session.accessToken);
    const messages = await gmail.searchJobApplicationEmails();

    return NextResponse.json({
      success: true,
      count: messages.length,
      messages: messages.slice(0, limit),
    });
  } catch (error) {
    console.error("Gmail API error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      {
        error: "Failed to fetch emails",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
