import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import AuthPage from "@/app/auth/page";
import { useToast } from "@/hooks/use-toast";

// Mock the hooks
jest.mock("next-auth/react");
jest.mock("next/navigation");
jest.mock("@/hooks/use-toast");

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

const mockPush = jest.fn();
const mockToast = jest.fn();

describe("AuthPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    });
    mockUseToast.mockReturnValue({
      toast: mockToast,
      dismiss: jest.fn(),
      toasts: [],
    });
  });

  describe("Loading State", () => {
    it("should show loading state when session is loading", () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "loading",
        update: jest.fn(),
      });

      render(<AuthPage />);

      expect(screen.getByText("Initializing the void...")).toBeInTheDocument();
      // Check for the Terminal icon SVG by its class
      expect(document.querySelector(".lucide-terminal")).toBeInTheDocument();
    });
  });

  describe("Unauthenticated State", () => {
    it("should show sign-in form when user is not authenticated", () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "unauthenticated",
        update: jest.fn(),
      });

      render(<AuthPage />);

      expect(screen.getByText("Welcome to The Void")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Sign in with Google to begin tracking your job applications in the digital abyss."
        )
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /sign in with google/i })
      ).toBeInTheDocument();
    });

    it("should display security features", () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "unauthenticated",
        update: jest.fn(),
      });

      render(<AuthPage />);

      expect(screen.getByText("Secure OAuth 2.0")).toBeInTheDocument();
      expect(screen.getByText("Read-only access to Gmail")).toBeInTheDocument();
      expect(screen.getByText("Email Monitoring")).toBeInTheDocument();
      expect(
        screen.getByText("Auto-detect job application updates")
      ).toBeInTheDocument();
    });

    it("should handle Google sign-in", async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "unauthenticated",
        update: jest.fn(),
      });
      mockSignIn.mockResolvedValue(undefined);

      render(<AuthPage />);

      const signInButton = screen.getByRole("button", {
        name: /sign in with google/i,
      });
      fireEvent.click(signInButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith("google", {
          callbackUrl: "/",
        });
      });
    });
  });

  describe("Authenticated State", () => {
    it("should redirect to home when user is authenticated", async () => {
      const mockSession = {
        user: {
          name: "Test User",
          email: "test@example.com",
          image: "https://example.com/avatar.jpg",
        },
        expires: "2024-12-31",
      };

      mockUseSession.mockReturnValue({
        data: mockSession,
        status: "authenticated",
        update: jest.fn(),
      });

      render(<AuthPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/");
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Successfully signed in",
        description: "Welcome to the void. Your digital abyss awaits.",
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle sign-in errors", async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "unauthenticated",
        update: jest.fn(),
      });
      mockSignIn.mockRejectedValue(new Error("Sign-in failed"));

      render(<AuthPage />);

      const signInButton = screen.getByRole("button", {
        name: /sign in with google/i,
      });
      fireEvent.click(signInButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Authentication failed",
          description: "The void rejected your sign-in attempt.",
          variant: "destructive",
        });
      });
    });

    it("should show signing in state during authentication", async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "unauthenticated",
        update: jest.fn(),
      });

      // Mock signIn to be slow so we can test the loading state
      mockSignIn.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<AuthPage />);

      const signInButton = screen.getByRole("button", {
        name: /sign in with google/i,
      });
      fireEvent.click(signInButton);

      // Check for loading state
      expect(screen.getByText("Signing in...")).toBeInTheDocument();
      expect(signInButton).toBeDisabled();
    });
  });
});
