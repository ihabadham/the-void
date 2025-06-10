import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { clearGmailTokensSecurely } from "@/lib/gmail-token-store";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await clearGmailTokensSecurely(session.user.email);

    return NextResponse.json({
      success: true,
      message: "Gmail disconnected successfully",
    });
  } catch (error) {
    console.error("Gmail disconnect error:", error);
    return NextResponse.json(
      {
        error: "Failed to disconnect Gmail",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
