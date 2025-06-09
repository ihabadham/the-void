import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createGmailAuthUrl } from "@/lib/gmail-server";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Debug environment variables
    console.log("=== Gmail Connect Debug ===");
    console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL);
    console.log("GOOGLE_CLIENT_ID exists:", !!process.env.GOOGLE_CLIENT_ID);
    console.log(
      "GOOGLE_CLIENT_SECRET exists:",
      !!process.env.GOOGLE_CLIENT_SECRET
    );
    console.log("===========================");

    const authUrl = createGmailAuthUrl();

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Gmail connect error:", error);
    return NextResponse.json(
      {
        error: "Failed to create Gmail auth URL",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
