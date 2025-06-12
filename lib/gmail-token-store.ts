/**
 * Secure server-side Gmail token storage using database with encryption
 * Keeps OAuth tokens encrypted in database, away from client-side code
 */

import { GoogleTokenResponse } from "./gmail-server";
import { database as db } from "./database/connection";
import {
  users,
  gmailTokens,
  type User,
  type GmailToken,
} from "./database/schemas/auth";
import { encrypt, decrypt } from "./database/encryption";
import { eq } from "drizzle-orm";

/**
 * Store Gmail tokens securely in encrypted database storage
 * This prevents tokens from being exposed in client-side code or URLs
 */
export async function storeGmailTokensSecurely(
  userEmail: string,
  tokens: GoogleTokenResponse
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
    const now = new Date();

    // Encrypt the sensitive tokens
    const encryptedAccessToken = encrypt(tokens.access_token);
    const encryptedRefreshToken = encrypt(tokens.refresh_token || "");

    // Calculate expiry time
    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null;

    // Check if Gmail tokens already exist for this user
    const existingTokens = await db
      .select()
      .from(gmailTokens)
      .where(eq(gmailTokens.userId, userId))
      .limit(1);

    if (existingTokens.length > 0) {
      // Update existing tokens
      await db
        .update(gmailTokens)
        .set({
          accessTokenEncrypted: encryptedAccessToken,
          refreshTokenEncrypted: encryptedRefreshToken,
          expiresAt,
          lastAccessed: now,
        })
        .where(eq(gmailTokens.userId, userId));
    } else {
      // Insert new tokens
      await db.insert(gmailTokens).values({
        userId,
        accessTokenEncrypted: encryptedAccessToken,
        refreshTokenEncrypted: encryptedRefreshToken,
        expiresAt,
        connectedAt: now,
        lastAccessed: now,
      });
    }

    console.log(`Gmail tokens stored securely for user: ${userEmail}`);
  } catch (error) {
    console.error("Failed to store Gmail tokens:", error);
    throw new Error("Failed to store Gmail authentication");
  }
}

/**
 * Retrieve Gmail tokens securely from encrypted database storage
 * Only accessible from API routes, never from client-side code
 */
export async function getGmailTokensSecurely(
  userEmail: string
): Promise<GoogleTokenResponse | null> {
  try {
    // Find user and their Gmail tokens
    const result = await db
      .select({
        gmailToken: gmailTokens,
        user: users,
      })
      .from(gmailTokens)
      .innerJoin(users, eq(gmailTokens.userId, users.id))
      .where(eq(users.email, userEmail))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const { gmailToken } = result[0];

    // Update last accessed time
    await db
      .update(gmailTokens)
      .set({ lastAccessed: new Date() })
      .where(eq(gmailTokens.id, gmailToken.id));

    // Decrypt the tokens
    const accessToken = decrypt(gmailToken.accessTokenEncrypted);
    const refreshToken = gmailToken.refreshTokenEncrypted
      ? decrypt(gmailToken.refreshTokenEncrypted)
      : undefined;

    // Calculate remaining time for expires_in
    const expiresIn = gmailToken.expiresAt
      ? Math.max(
          0,
          Math.floor((gmailToken.expiresAt.getTime() - Date.now()) / 1000)
        )
      : 3600; // Default to 1 hour if no expiry stored

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
      token_type: "Bearer",
      scope: "https://www.googleapis.com/auth/gmail.readonly",
    };
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
 * Revoke and clear Gmail tokens from database
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

    // Find user and delete their Gmail tokens
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, userEmail))
      .limit(1);

    if (user.length > 0) {
      await db.delete(gmailTokens).where(eq(gmailTokens.userId, user[0].id));
    }

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
    // Find user and their Gmail tokens metadata
    const result = await db
      .select({
        connectedAt: gmailTokens.connectedAt,
        lastAccessed: gmailTokens.lastAccessed,
      })
      .from(gmailTokens)
      .innerJoin(users, eq(gmailTokens.userId, users.id))
      .where(eq(users.email, userEmail))
      .limit(1);

    if (result.length === 0) {
      return {
        isConnected: false,
        connectedAt: null,
        lastAccessed: null,
      };
    }

    const { connectedAt, lastAccessed } = result[0];

    return {
      isConnected: true,
      connectedAt: connectedAt.toISOString(),
      lastAccessed: lastAccessed.toISOString(),
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
