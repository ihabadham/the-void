import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { exchangeCodeForTokens } from "@/lib/gmail-server";
import { storeGmailTokensSecurely } from "@/lib/gmail-token-store";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth`);
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/gmail?error=${error}`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/gmail?error=no_code`
      );
    }

    // Exchange code for tokens server-side
    const tokens = await exchangeCodeForTokens(code);

    // Store tokens securely server-side (not in localStorage or URL)
    await storeGmailTokensSecurely(session.user.email, tokens);

    // Redirect with only a success flag - no sensitive data in URL
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/gmail?success=true`
    );
  } catch (error) {
    console.error("Gmail callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/gmail?error=callback_failed`
    );
  }
}
