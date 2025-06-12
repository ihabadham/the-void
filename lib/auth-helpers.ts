/**
 * Helper functions to bridge NextAuth sessions with our database user system
 */

import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import { ensureUserExists } from "./gmail-token-store";
import { database as db } from "./database/connection";
import { users } from "./database/schemas/auth";
import { eq } from "drizzle-orm";
import type { User } from "./database/schemas/auth";

/**
 * Get the current authenticated user from database
 * Use this instead of directly accessing session.user
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return null;
    }

    // Ensure user exists in database and return the database record
    const user = await ensureUserExists(
      session.user.email,
      session.user.name || null,
      session.user.image || null
    );

    return user;
  } catch (error) {
    console.error("Failed to get current user:", error);
    throw error; // let the upstream handler deal with it
  }
}

/**
 * Get user by email from database
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("Failed to get user by email:", error);
    return null;
  }
}

/**
 * Check if the current user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Require authentication - throws if not authenticated
 * Use this in API routes that require authentication
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  return user;
}

/**
 * Get session with enhanced user data from database
 */
export async function getEnhancedSession() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return null;
    }

    const user = await getCurrentUser();

    return {
      ...session,
      user: {
        ...session.user,
        id: user?.id,
        createdAt: user?.createdAt,
        updatedAt: user?.updatedAt,
      },
    };
  } catch (error) {
    console.error("Failed to get enhanced session:", error);
    return null;
  }
}
