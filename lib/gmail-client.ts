/**
 * Client-side Gmail authentication utilities
 * Note: Server-side functions are in gmail-server.ts to avoid client-side module resolution issues
 */

/**
 * Store Gmail tokens separately from NextAuth session
 * This allows users to have app access without Gmail, and Gmail access as an add-on
 */
export function storeGmailTokens(userId: string, tokens: any) {
  // For now, we'll store in localStorage (in production, this would be in database)
  if (typeof window !== "undefined") {
    localStorage.setItem(
      "void-gmail-tokens",
      JSON.stringify({
        userId,
        tokens,
        connectedAt: new Date().toISOString(),
      })
    );
    localStorage.setItem("void-gmail-connected", "true");
    localStorage.setItem("void-gmail-connected-date", new Date().toISOString());
  }
}

export function getGmailTokens(userId: string) {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("void-gmail-tokens");
    if (stored) {
      const data = JSON.parse(stored);
      if (data.userId === userId) {
        return data.tokens;
      }
    }
  }
  return null;
}

export function clearGmailTokens() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("void-gmail-tokens");
    localStorage.removeItem("void-gmail-connected");
    localStorage.removeItem("void-gmail-connected-date");
  }
}
