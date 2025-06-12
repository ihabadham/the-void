import type { Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";

export const mockUser: User = {
  id: "1",
  name: "Test User",
  email: "test@example.com",
  image: "https://example.com/avatar.jpg",
};

export const mockSession: Session = {
  user: mockUser,
  expires: "2024-12-31T23:59:59.000Z",
};

export const mockJWT: JWT = {
  name: mockUser.name,
  email: mockUser.email,
  picture: mockUser.image,
  sub: mockUser.id,
};

export const createMockSession = (overrides?: Partial<Session>): Session => ({
  ...mockSession,
  ...overrides,
});

export const createMockUseSessionReturn = (
  data: Session | null = null,
  status: "loading" | "authenticated" | "unauthenticated" = "unauthenticated"
) => ({
  data,
  status,
  update: jest.fn(),
});
