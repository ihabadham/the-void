import { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { SessionProvider } from "next-auth/react";

// Mock session data for testing
export const mockSession = {
  user: {
    name: "Test User",
    email: "test@example.com",
    image: "https://example.com/avatar.jpg",
  },
  expires: "2024-12-31",
  accessToken: "mock-access-token",
  refreshToken: "mock-refresh-token",
};

export const mockUnauthenticatedSession = null;

// Custom render function with SessionProvider
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  session?: any;
}

export function renderWithSession(
  ui: ReactElement,
  {
    session = mockUnauthenticatedSession,
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <SessionProvider session={session}>{children}</SessionProvider>;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Auth state helpers for testing
export const authTestHelpers = {
  // Mock authenticated state
  mockAuthenticated: () => mockSession,

  // Mock unauthenticated state
  mockUnauthenticated: () => null,

  // Mock loading state
  mockLoading: () => undefined,

  // Mock session with custom data
  mockSessionWith: (overrides: Partial<typeof mockSession>) => ({
    ...mockSession,
    ...overrides,
  }),
};

// Common test scenarios
export const authScenarios = {
  authenticated: {
    session: mockSession,
    status: "authenticated" as const,
  },
  unauthenticated: {
    session: null,
    status: "unauthenticated" as const,
  },
  loading: {
    session: null,
    status: "loading" as const,
  },
};

// Re-export everything from testing-library
export * from "@testing-library/react";
export { renderWithSession as render };
