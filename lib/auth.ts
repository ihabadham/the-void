import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { ensureUserExists } from "./gmail-token-store";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          // Only request basic profile info for authentication
          // Gmail access will be requested separately when user chooses to connect
          scope: "openid email profile",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the OAuth access_token to the token right after signin
      if (account && profile) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;

        // Ensure user exists in our database when they first sign in
        if (profile.email) {
          try {
            const user = await ensureUserExists(
              profile.email,
              profile.name || null,
              (profile as any).picture || null
            );
            token.userId = user.id;
          } catch (error) {
            console.error("Failed to ensure user exists in database:", error);
            // Don't fail authentication, but log the error
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      session.userId = token.userId as string;

      // Ensure we have the latest user data from database
      if (session.user?.email && !session.userId) {
        try {
          const user = await ensureUserExists(
            session.user.email,
            session.user.name || null,
            session.user.image || null
          );
          session.userId = user.id;
        } catch (error) {
          console.error("Failed to sync user with database:", error);
        }
      }

      return session;
    },
    async signIn({ user, account, profile }) {
      // Additional validation can be added here if needed
      // For now, allow all Google OAuth sign-ins
      return true;
    },
  },
  events: {
    async signIn({ user, account, profile }) {
      // Log successful sign-ins for debugging
      console.log(`User signed in: ${user.email}`);
    },
    async signOut({ session, token }) {
      // Log sign-outs for debugging
      console.log(`User signed out: ${session?.user?.email || "unknown"}`);
    },
  },
  pages: {
    signIn: "/auth",
  },
  session: {
    strategy: "jwt",
  },
};
