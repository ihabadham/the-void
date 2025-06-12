/**
 * Secure server-side Gmail token storage using database with encryption
 * Keeps OAuth tokens encrypted in database, away from client-side code
 */

import { GoogleTokenResponse } from "./gmail-server";
import { database as db } from "./database/connection";
import {
  users,
  gmailAccounts,
  userGmailTokens,
  type User,
  type GmailAccount,
  type UserGmailToken,
} from "./database/schemas/auth";
import { encrypt, decrypt } from "./database/encryption";
import { eq, and } from "drizzle-orm";

/**
 * Store Gmail tokens securely in encrypted database storage
 * This prevents tokens from being exposed in client-side code or URLs
 * Now supports many-to-many relationship between users and Gmail accounts
 */
export async function storeGmailTokensSecurely(
  userEmail: string,
  tokens: GoogleTokenResponse,
  gmailAddress?: string // The Gmail account being connected
): Promise<void> {
  try {
    // First, ensure user exists or create them
    let user = await db
      .select()
      .from(users)
      .where(eq(users.email, userEmail))
      .limit(1);

    if (user.length === 0) {
      // Create user if they don't exist
      const newUser = await db
        .insert(users)
        .values({
          email: userEmail,
          name: null, // Will be updated when they provide profile info
          image: null,
        })
        .returning();
      user = newUser;
    }

    const userId = user[0].id;

    // Determine Gmail address (use provided or fall back to user email)
    const targetGmailAddress = gmailAddress || userEmail;

    // Ensure Gmail account exists or create it
    let gmailAccount = await db
      .select()
      .from(gmailAccounts)
      .where(eq(gmailAccounts.email, targetGmailAddress))
      .limit(1);

    if (gmailAccount.length === 0) {
      // Create Gmail account if it doesn't exist
      const newGmailAccount = await db
        .insert(gmailAccounts)
        .values({
          email: targetGmailAddress,
          displayName: null, // Will be updated when profile info is fetched
        })
        .returning();
      gmailAccount = newGmailAccount;
    }

    const gmailAccountId = gmailAccount[0].id;
    const now = new Date();

    // Encrypt the sensitive tokens
    const encryptedAccessToken = encrypt(tokens.access_token);
    const encryptedRefreshToken = encrypt(tokens.refresh_token || "");

    // Calculate expiry time
    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null;

    // Check if tokens already exist for this user-gmail combination
    const existingTokens = await db
      .select()
      .from(userGmailTokens)
      .where(
        and(
          eq(userGmailTokens.userId, userId),
          eq(userGmailTokens.gmailAccountId, gmailAccountId)
        )
      )
      .limit(1);

    if (existingTokens.length > 0) {
      // Update existing tokens
      await db
        .update(userGmailTokens)
        .set({
          accessTokenEncrypted: encryptedAccessToken,
          refreshTokenEncrypted: encryptedRefreshToken,
          expiresAt,
          lastAccessed: now,
        })
        .where(
          and(
            eq(userGmailTokens.userId, userId),
            eq(userGmailTokens.gmailAccountId, gmailAccountId)
          )
        );
    } else {
      // Insert new tokens
      await db.insert(userGmailTokens).values({
        userId,
        gmailAccountId,
        accessTokenEncrypted: encryptedAccessToken,
        refreshTokenEncrypted: encryptedRefreshToken,
        expiresAt,
        connectedAt: now,
        lastAccessed: now,
      });
    }

    console.log(
      `Gmail tokens stored securely for user: ${userEmail} -> ${targetGmailAddress}`
    );
  } catch (error) {
    console.error("Failed to store Gmail tokens:", error);
    throw new Error("Failed to store Gmail authentication");
  }
}

/**
 * Retrieve Gmail tokens securely from encrypted database storage
 * Only accessible from API routes, never from client-side code
 * For users with multiple Gmail accounts, returns the first available tokens
 */
export async function getGmailTokensSecurely(
  userEmail: string,
  gmailAddress?: string // Optional: specify which Gmail account
): Promise<GoogleTokenResponse | null> {
  try {
    // If specific Gmail address is requested, filter by it
    if (gmailAddress) {
      const result = await db
        .select({
          userGmailToken: userGmailTokens,
          user: users,
          gmailAccount: gmailAccounts,
        })
        .from(userGmailTokens)
        .innerJoin(users, eq(userGmailTokens.userId, users.id))
        .innerJoin(
          gmailAccounts,
          eq(userGmailTokens.gmailAccountId, gmailAccounts.id)
        )
        .where(
          and(eq(users.email, userEmail), eq(gmailAccounts.email, gmailAddress))
        )
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      return await processTokenResult(result[0]);
    }

    // Otherwise, return first available tokens
    const result = await db
      .select({
        userGmailToken: userGmailTokens,
        user: users,
        gmailAccount: gmailAccounts,
      })
      .from(userGmailTokens)
      .innerJoin(users, eq(userGmailTokens.userId, users.id))
      .innerJoin(
        gmailAccounts,
        eq(userGmailTokens.gmailAccountId, gmailAccounts.id)
      )
      .where(eq(users.email, userEmail))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return await processTokenResult(result[0]);
  } catch (error) {
    console.error("Failed to retrieve Gmail tokens:", error);
    return null;
  }
}

/**
 * Helper function to process token result and update last accessed time
 */
async function processTokenResult(result: {
  userGmailToken: UserGmailToken;
  user: User;
  gmailAccount: GmailAccount;
}): Promise<GoogleTokenResponse> {
  const { userGmailToken } = result;

  // Update last accessed time
  await db
    .update(userGmailTokens)
    .set({ lastAccessed: new Date() })
    .where(eq(userGmailTokens.id, userGmailToken.id));

  // Decrypt the tokens
  const accessToken = decrypt(userGmailToken.accessTokenEncrypted);
  const refreshToken = userGmailToken.refreshTokenEncrypted
    ? decrypt(userGmailToken.refreshTokenEncrypted)
    : undefined;

  // Calculate remaining time for expires_in
  const expiresIn = userGmailToken.expiresAt
    ? Math.max(
        0,
        Math.floor((userGmailToken.expiresAt.getTime() - Date.now()) / 1000)
      )
    : 3600; // Default to 1 hour if no expiry stored

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: expiresIn,
    token_type: "Bearer",
    scope: "https://www.googleapis.com/auth/gmail.readonly",
  };
}

/**
 * Check if user has Gmail connected
 * Safe to call from both server and client via API
 */
export async function isGmailConnected(
  userEmail: string,
  gmailAddress?: string
): Promise<boolean> {
  try {
    const tokens = await getGmailTokensSecurely(userEmail, gmailAddress);
    return tokens !== null;
  } catch (error) {
    console.error("Failed to check Gmail connection:", error);
    return false;
  }
}

/**
 * Revoke and clear Gmail tokens from database
 * Can target specific Gmail account or clear all for a user
 */
export async function clearGmailTokensSecurely(
  userEmail: string,
  gmailAddress?: string // Optional: specify which Gmail account to disconnect
): Promise<void> {
  try {
    // TODO: In production, revoke tokens with Google before deleting
    // const tokens = await getGmailTokensSecurely(userEmail, gmailAddress);
    // if (tokens) {
    //   await revokeGoogleTokens(tokens.access_token);
    // }

    // Find user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, userEmail))
      .limit(1);

    if (user.length === 0) {
      return; // User doesn't exist, nothing to clear
    }

    const userId = user[0].id;

    if (gmailAddress) {
      // Clear tokens for specific Gmail account
      const gmailAccount = await db
        .select()
        .from(gmailAccounts)
        .where(eq(gmailAccounts.email, gmailAddress))
        .limit(1);

      if (gmailAccount.length > 0) {
        await db
          .delete(userGmailTokens)
          .where(
            and(
              eq(userGmailTokens.userId, userId),
              eq(userGmailTokens.gmailAccountId, gmailAccount[0].id)
            )
          );
        console.log(
          `Gmail tokens cleared for user: ${userEmail} -> ${gmailAddress}`
        );
      }
    } else {
      // Clear all Gmail tokens for user
      await db
        .delete(userGmailTokens)
        .where(eq(userGmailTokens.userId, userId));
      console.log(`All Gmail tokens cleared for user: ${userEmail}`);
    }
  } catch (error) {
    console.error("Failed to clear Gmail tokens:", error);
    throw new Error("Failed to disconnect Gmail");
  }
}

/**
 * Get Gmail connection info (safe metadata only)
 * Returns information about all connected Gmail accounts for a user
 */
export async function getGmailConnectionInfo(userEmail: string): Promise<{
  isConnected: boolean;
  connectedAccounts: Array<{
    email: string;
    displayName: string | null;
    connectedAt: string;
    lastAccessed: string;
  }>;
} | null> {
  try {
    const result = await db
      .select({
        gmailAccount: gmailAccounts,
        connectedAt: userGmailTokens.connectedAt,
        lastAccessed: userGmailTokens.lastAccessed,
      })
      .from(userGmailTokens)
      .innerJoin(users, eq(userGmailTokens.userId, users.id))
      .innerJoin(
        gmailAccounts,
        eq(userGmailTokens.gmailAccountId, gmailAccounts.id)
      )
      .where(eq(users.email, userEmail));

    if (result.length === 0) {
      return {
        isConnected: false,
        connectedAccounts: [],
      };
    }

    return {
      isConnected: true,
      connectedAccounts: result.map((row) => ({
        email: row.gmailAccount.email,
        displayName: row.gmailAccount.displayName,
        connectedAt: row.connectedAt.toISOString(),
        lastAccessed: row.lastAccessed.toISOString(),
      })),
    };
  } catch (error) {
    console.error("Failed to get Gmail connection info:", error);
    return null;
  }
}

/**
 * Ensure user exists in database (for NextAuth integration)
 */
export async function ensureUserExists(
  email: string,
  name?: string | null,
  image?: string | null
): Promise<User> {
  try {
    // Check if user exists
    let user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user.length === 0) {
      // Create new user
      const newUser = await db
        .insert(users)
        .values({
          email,
          name: name || null,
          image: image || null,
        })
        .returning();
      return newUser[0];
    } else {
      // Update existing user with new info if provided
      if (name || image) {
        const updatedUser = await db
          .update(users)
          .set({
            name: name || user[0].name,
            image: image || user[0].image,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user[0].id))
          .returning();
        return updatedUser[0];
      }
      return user[0];
    }
  } catch (error) {
    console.error("Failed to ensure user exists:", error);
    throw new Error("Failed to manage user account");
  }
}
