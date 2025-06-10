import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGmailConnectionInfo } from "@/lib/gmail-token-store";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connectionInfo = await getGmailConnectionInfo(session.user.email);

    if (!connectionInfo) {
      return NextResponse.json(
        { error: "Failed to get connection status" },
        { status: 500 }
      );
    }

    return NextResponse.json(connectionInfo);
  } catch (error) {
    console.error("Gmail status error:", error);
    return NextResponse.json(
      { error: "Failed to check Gmail status" },
      { status: 500 }
    );
  }
}
