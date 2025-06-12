import { render, screen, waitFor } from "@testing-library/react";
import { SessionProvider } from "next-auth/react";
import { useSession } from "next-auth/react";
import AuthPage from "@/app/auth/page";

// Mock useSession to control what it returns
jest.mock("next-auth/react", () => ({
  ...jest.requireActual("next-auth/react"),
  useSession: jest.fn(),
}));

// Mock useRouter
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock useToast
const mockToast = jest.fn();
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
    dismiss: jest.fn(),
    toasts: [],
  }),
}));

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

describe("Auth Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should integrate with SessionProvider when authenticated", async () => {
    const mockSession = {
      user: {
        name: "Test User",
        email: "test@example.com",
        image: "https://example.com/avatar.jpg",
      },
      expires: "2024-12-31T23:59:59.000Z",
    };

    // Mock useSession to return authenticated state
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: jest.fn(),
    });

    render(
      <SessionProvider session={mockSession}>
        <AuthPage />
      </SessionProvider>
    );

    // Should redirect to home page when authenticated
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });

    // Should show success toast
    expect(mockToast).toHaveBeenCalledWith({
      title: "Successfully signed in",
      description: "Welcome to the void. Your digital abyss awaits.",
    });
  });

  it("should handle session loading state", () => {
    // Mock useSession to return loading state
    mockUseSession.mockReturnValue({
      data: null,
      status: "loading",
      update: jest.fn(),
    });

    render(
      <SessionProvider session={null}>
        <AuthPage />
      </SessionProvider>
    );

    expect(screen.getByText("Initializing the void...")).toBeInTheDocument();
  });

  it("should handle unauthenticated state", () => {
    // Mock useSession to return unauthenticated state
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: jest.fn(),
    });

    render(
      <SessionProvider session={null}>
        <AuthPage />
      </SessionProvider>
    );

    expect(screen.getByText("Welcome to The Void")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in with google/i })
    ).toBeInTheDocument();
  });
});

// Test auth state management
describe("Auth State Management", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should handle token refresh scenario", async () => {
    const mockSessionWithRefreshToken = {
      user: {
        name: "Test User",
        email: "test@example.com",
        image: "https://example.com/avatar.jpg",
      },
      expires: "2024-12-31T23:59:59.000Z",
      accessToken: "new-access-token",
      refreshToken: "refresh-token",
    };

    // Mock useSession to return authenticated state with tokens
    mockUseSession.mockReturnValue({
      data: mockSessionWithRefreshToken,
      status: "authenticated",
      update: jest.fn(),
    });

    render(
      <SessionProvider session={mockSessionWithRefreshToken}>
        <AuthPage />
      </SessionProvider>
    );

    // Should redirect to home, NextAuth handles token refresh internally
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });
});

// Test error boundaries and edge cases
describe("Auth Error Handling Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should handle malformed session data", async () => {
    const malformedSession = {
      user: null, // Missing user data
      expires: "2024-12-31",
    } as any; // Cast to any to test edge case

    // Mock useSession to return authenticated status even with malformed data
    mockUseSession.mockReturnValue({
      data: malformedSession,
      status: "authenticated",
      update: jest.fn(),
    });

    render(
      <SessionProvider session={malformedSession}>
        <AuthPage />
      </SessionProvider>
    );

    // Should still redirect since session exists
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("should handle missing session provider", () => {
    // Mock useSession to return unauthenticated state
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: jest.fn(),
    });

    // Test component without SessionProvider
    render(<AuthPage />);

    // Should show the sign-in form (unauthenticated state)
    expect(screen.getByText("Welcome to The Void")).toBeInTheDocument();
  });
});
