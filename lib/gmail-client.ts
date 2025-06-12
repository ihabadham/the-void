/**
 * Client-side Gmail authentication utilities
 * SECURITY UPDATE: Client-side token storage removed for security
 * All token operations now happen server-side via secure APIs
 */

/**
 * @deprecated - Use server-side token storage instead
 * This function is kept for backward compatibility but no longer stores tokens client-side
 */
export function storeGmailTokens(userId: string, tokens: any) {
  console.warn(
    "storeGmailTokens is deprecated. Tokens are now stored securely server-side."
  );
  // No longer store tokens in localStorage for security reasons
  // Tokens are now handled server-side via /api/gmail/callback
}

/**
 * @deprecated - Use /api/gmail/status endpoint instead
 * This function is kept for backward compatibility but always returns null
 */
export function getGmailTokens(userId: string) {
  console.warn(
    "getGmailTokens is deprecated. Use /api/gmail/status endpoint to check connection status."
  );
  // No longer retrieve tokens from localStorage for security reasons
  return null;
}

/**
 * Clear any legacy Gmail token data from localStorage
 * This is safe to call and will clean up old insecure storage
 */
export function clearGmailTokens() {
  if (typeof window !== "undefined") {
    // Clean up any legacy localStorage data
    localStorage.removeItem("void-gmail-tokens");
    localStorage.removeItem("void-gmail-connected");
    localStorage.removeItem("void-gmail-connected-date");
    console.log("Legacy Gmail token data cleared from localStorage");
  }
}

/**
 * Check Gmail connection status via secure API
 * Use this instead of the deprecated getGmailTokens function
 */
export async function checkGmailConnection(): Promise<{
  isConnected: boolean;
  connectedAt: string | null;
  lastAccessed: string | null;
} | null> {
  try {
    const response = await fetch("/api/gmail/status");
    if (response.ok) {
      return await response.json();
    } else {
      console.error("Failed to check Gmail connection status");
      return null;
    }
  } catch (error) {
    console.error("Error checking Gmail connection:", error);
    return null;
  }
}

/**
 * Disconnect Gmail via secure API
 * Use this instead of the deprecated clearGmailTokens function
 */
export async function disconnectGmail(): Promise<boolean> {
  try {
    const response = await fetch("/api/gmail/disconnect", {
      method: "POST",
    });

    if (response.ok) {
      // Also clear any legacy localStorage data
      clearGmailTokens();
      return true;
    } else {
      console.error("Failed to disconnect Gmail");
      return false;
    }
  } catch (error) {
    console.error("Error disconnecting Gmail:", error);
    return false;
  }
}
