import { authOptions } from "@/lib/auth";
import GoogleProvider from "next-auth/providers/google";

// Mock the Google provider
jest.mock("next-auth/providers/google");

describe("Auth Configuration", () => {
  it("should have correct providers configured", () => {
    expect(authOptions.providers).toHaveLength(1);
    expect(GoogleProvider).toHaveBeenCalledWith({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
    });
  });

  it("should have correct session strategy", () => {
    expect(authOptions.session?.strategy).toBe("jwt");
  });

  it("should have correct sign in page", () => {
    expect(authOptions.pages?.signIn).toBe("/auth");
  });

  describe("JWT Callback", () => {
    it("should persist OAuth tokens to JWT", async () => {
      const mockAccount = {
        access_token: "mock-access-token",
        refresh_token: "mock-refresh-token",
        provider: "google",
        providerAccountId: "123",
        type: "oauth" as const,
      };
      const mockToken = {};
      const mockUser = {
        id: "123",
        name: "Test User",
        email: "test@example.com",
        image: null,
      };

      const result = await authOptions.callbacks?.jwt?.({
        token: mockToken,
        account: mockAccount,
        user: mockUser,
        profile: undefined,
        session: undefined,
        trigger: "signIn",
        isNewUser: false,
      });

      expect(result).toEqual({
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
      });
    });

    it("should return token unchanged when no account", async () => {
      const mockToken = { existingData: "test" };
      const mockUser = {
        id: "123",
        name: "Test User",
        email: "test@example.com",
        image: null,
      };

      const result = await authOptions.callbacks?.jwt?.({
        token: mockToken,
        account: null,
        user: mockUser,
        profile: undefined,
        session: undefined,
        trigger: "update",
        isNewUser: false,
      });

      expect(result).toEqual(mockToken);
    });
  });

  describe("Session Callback", () => {
    it("should add tokens to session", async () => {
      const mockSession = {
        user: {
          name: "Test User",
          email: "test@example.com",
        },
        expires: "2024-12-31",
      };
      const mockToken = {
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
      };
      const mockUser = {
        id: "123",
        name: "Test User",
        email: "test@example.com",
        emailVerified: null,
        image: null,
      };

      const result = await authOptions.callbacks?.session?.({
        session: mockSession,
        token: mockToken,
        user: mockUser,
        newSession: undefined,
        trigger: "update",
      });

      expect(result).toEqual({
        ...mockSession,
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
      });
    });
  });
});
