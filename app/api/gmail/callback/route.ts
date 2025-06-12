import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { exchangeCodeForTokens } from "@/lib/gmail-server";
import { storeGmailTokensSecurely } from "@/lib/gmail-token-store";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
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

    // Store tokens securely server-side using database
    await storeGmailTokensSecurely(user.email, tokens);

    console.log(
      `Gmail successfully connected for user: ${user.email} (ID: ${user.id})`
    );

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
