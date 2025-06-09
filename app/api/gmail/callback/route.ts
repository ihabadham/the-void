import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { exchangeCodeForTokens } from "@/lib/gmail-server";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
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

    const tokens = await exchangeCodeForTokens(code);

    // TODO: Store tokens (in production, this would be in database)
    // For now, we'll redirect with tokens in query params (not ideal, but for demo)
    const tokensEncoded = encodeURIComponent(JSON.stringify(tokens));

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/gmail?success=true&tokens=${tokensEncoded}`
    );
  } catch (error) {
    console.error("Gmail callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/gmail?error=callback_failed`
    );
  }
}
