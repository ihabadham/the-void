import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getGmailConnectionInfo } from "@/lib/gmail-token-store";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connectionInfo = await getGmailConnectionInfo(user.email);

    if (!connectionInfo) {
      return NextResponse.json(
        { error: "Failed to get connection status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...connectionInfo,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Gmail status error:", error);
    return NextResponse.json(
      { error: "Failed to check Gmail status" },
      { status: 500 }
    );
  }
}
