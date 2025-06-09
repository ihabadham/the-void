import { google } from "googleapis";

/**
 * Server-side Gmail authentication utilities
 * These functions use googleapis and should only be called from API routes
 */

/**
 * OAuth token response structure from Google
 */
export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token?: string;
}

/**
 * Get the Gmail callback redirect URI consistently
 */
export function getGmailRedirectUri(): string {
  const baseUrl =
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "http://localhost:3000";
  return `${baseUrl}/api/gmail/callback`;
}

/**
 * Create a configured OAuth2 client for Gmail
 * Used only for generating the authorization URL
 */
function createGmailOAuth2Client() {
  const redirectUri = getGmailRedirectUri();

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri
  );

  return oauth2Client;
}

/**
 * Create Gmail authentication URL for explicit Gmail connection
 * This is used when users click "Connect Gmail" on the Gmail page
 */
export function createGmailAuthUrl(): string {
  const oauth2Client = createGmailOAuth2Client();

  const scopes = ["https://www.googleapis.com/auth/gmail.readonly"];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent", // Force consent to ensure refresh token
  });

  return url;
}

/**
 * Exchange authorization code for access tokens
 *
 * Note: We use direct HTTP requests instead of googleapis.oauth2Client.getToken()
 * because the googleapis library automatically enables PKCE (Proof Key for Code Exchange)
 * under certain conditions, which requires additional parameters (code_verifier) that
 * we're not providing. Direct HTTP gives us explicit control over the OAuth flow.
 */
export async function exchangeCodeForTokens(
  code: string
): Promise<GoogleTokenResponse> {
  const redirectUri = getGmailRedirectUri();

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error(
      "Missing Google OAuth credentials in environment variables"
    );
  }

  try {
    const tokenUrl = "https://oauth2.googleapis.com/token";
    const params = new URLSearchParams({
      code: code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `Token exchange failed (${response.status}): ${
          data.error_description || data.error || JSON.stringify(data)
        }`
      );
    }

    // Validate required fields
    if (!data.access_token) {
      throw new Error("Missing access_token in response");
    }

    return data as GoogleTokenResponse;
  } catch (error: any) {
    // Re-throw with additional context
    throw new Error(`Gmail OAuth token exchange failed: ${error.message}`);
  }
}

/**
 * Create an authenticated Gmail client using stored tokens
 */
export function createAuthenticatedGmailClient(tokens: GoogleTokenResponse) {
  const oauth2Client = createGmailOAuth2Client();
  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    scope: tokens.scope,
    token_type: tokens.token_type,
    expiry_date: tokens.expires_in
      ? Date.now() + tokens.expires_in * 1000
      : undefined,
  });

  return google.gmail({ version: "v1", auth: oauth2Client });
}
