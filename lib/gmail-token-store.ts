/**
 * Secure server-side Gmail token storage
 * Keeps OAuth tokens away from client-side code and URL parameters
 */

import { GoogleTokenResponse } from "./gmail-server";

// In-memory token store for development
// In production, this should be replaced with a proper database
const tokenStore = new Map<
  string,
  {
    tokens: GoogleTokenResponse;
    connectedAt: string;
    lastAccessed: string;
  }
>();

/**
 * Store Gmail tokens securely server-side
 * This prevents tokens from being exposed in client-side code or URLs
 */
export async function storeGmailTokensSecurely(
  userEmail: string,
  tokens: GoogleTokenResponse
): Promise<void> {
  try {
    const now = new Date().toISOString();

    tokenStore.set(userEmail, {
      tokens,
      connectedAt: now,
      lastAccessed: now,
    });

    // TODO: In production, store in database instead of memory
    // Example:
    // await db.gmailTokens.upsert({
    //   where: { userEmail },
    //   update: { tokens: encrypt(tokens), lastAccessed: now },
    //   create: { userEmail, tokens: encrypt(tokens), connectedAt: now, lastAccessed: now }
    // });

    console.log(`Gmail tokens stored securely for user: ${userEmail}`);
  } catch (error) {
    console.error("Failed to store Gmail tokens:", error);
    throw new Error("Failed to store Gmail authentication");
  }
}

/**
 * Retrieve Gmail tokens securely server-side
 * Only accessible from API routes, never from client-side code
 */
export async function getGmailTokensSecurely(
  userEmail: string
): Promise<GoogleTokenResponse | null> {
  try {
    const stored = tokenStore.get(userEmail);

    if (!stored) {
      return null;
    }

    // Update last accessed time
    stored.lastAccessed = new Date().toISOString();
    tokenStore.set(userEmail, stored);

    return stored.tokens;
  } catch (error) {
    console.error("Failed to retrieve Gmail tokens:", error);
    return null;
  }
}

/**
 * Check if user has Gmail connected
 * Safe to call from both server and client via API
 */
export async function isGmailConnected(userEmail: string): Promise<boolean> {
  try {
    const tokens = await getGmailTokensSecurely(userEmail);
    return tokens !== null;
  } catch (error) {
    console.error("Failed to check Gmail connection:", error);
    return false;
  }
}

/**
 * Revoke and clear Gmail tokens
 */
export async function clearGmailTokensSecurely(
  userEmail: string
): Promise<void> {
  try {
    // TODO: In production, revoke tokens with Google before deleting
    // const tokens = await getGmailTokensSecurely(userEmail);
    // if (tokens) {
    //   await revokeGoogleTokens(tokens.access_token);
    // }

    tokenStore.delete(userEmail);
    console.log(`Gmail tokens cleared for user: ${userEmail}`);
  } catch (error) {
    console.error("Failed to clear Gmail tokens:", error);
    throw new Error("Failed to disconnect Gmail");
  }
}

/**
 * Get Gmail connection info (safe metadata only)
 */
export async function getGmailConnectionInfo(userEmail: string): Promise<{
  isConnected: boolean;
  connectedAt: string | null;
  lastAccessed: string | null;
} | null> {
  try {
    const stored = tokenStore.get(userEmail);

    if (!stored) {
      return {
        isConnected: false,
        connectedAt: null,
        lastAccessed: null,
      };
    }

    return {
      isConnected: true,
      connectedAt: stored.connectedAt,
      lastAccessed: stored.lastAccessed,
    };
  } catch (error) {
    console.error("Failed to get Gmail connection info:", error);
    return null;
  }
}
