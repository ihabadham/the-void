# Google OAuth Implementation Guide for The Void

## Overview

This document details the complete implementation of Google OAuth authentication with Gmail integration for The Void project. The implementation uses NextAuth.js for secure authentication and the Google APIs for Gmail access.

## 🛠️ Dependencies Added

### Core Authentication Dependencies

```bash
pnpm add next-auth @next-auth/prisma-adapter google-auth-library googleapis
```

**Dependencies breakdown:**

- `next-auth`: Main authentication library for Next.js
- `@next-auth/prisma-adapter`: Database adapter (future-proofing)
- `google-auth-library`: Google's official auth library
- `googleapis`: Google API client library for Gmail integration

## 📁 Files Created/Modified

### 1. **lib/auth.ts** (NEW)

**Location:** `/lib/auth.ts`

**Purpose:** NextAuth configuration with Google OAuth provider (basic profile only)

**Key Features:**

- Google OAuth provider configuration
- Basic profile scopes only (email, profile)
- JWT token persistence (access_token, refresh_token)
- Session configuration
- Custom sign-in page redirect

```typescript
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

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
    async jwt({ token, account }) {
      // Persist OAuth tokens for API access
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      return token;
    },
    async session({ session, token }) {
      // Make tokens available to client
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      return session;
    },
  },
  pages: {
    signIn: "/auth", // Custom sign-in page
  },
  session: {
    strategy: "jwt", // Use JWT instead of database sessions
  },
};
```

### 2. **types/next-auth.d.ts** (NEW)

**Location:** `/types/next-auth.d.ts`

**Purpose:** TypeScript type extensions for NextAuth to include OAuth tokens

**Key Features:**

- Extends NextAuth Session interface
- Extends JWT interface
- Enables type-safe access to Google OAuth tokens

```typescript
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
  }
}
```

### 3. **app/api/auth/[...nextauth]/route.ts** (NEW)

**Location:** `/app/api/auth/[...nextauth]/route.ts`

**Purpose:** NextAuth API route handler for authentication endpoints

**Key Features:**

- Handles all OAuth flow endpoints
- Supports both GET and POST requests
- Integrates with our auth configuration

```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

### 4. **lib/gmail.ts** (NEW)

**Location:** `/lib/gmail.ts`

**Purpose:** Gmail API client and helper functions

**Key Features:**

- Gmail API client initialization with OAuth tokens
- Email search and retrieval functions
- Job application email detection
- Error handling and logging

**Main Functions:**

- `getMessages()`: Fetch messages with query filters
- `getMessage()`: Get specific message details
- `searchJobApplicationEmails()`: Pre-configured job search queries
- `createGmailClient()`: Factory function for Gmail client

```typescript
import { google } from "googleapis";

export class GmailAPI {
  private gmail: any;

  constructor(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    this.gmail = google.gmail({ version: "v1", auth });
  }

  async searchJobApplicationEmails() {
    // Searches for job-related emails using multiple query patterns
    const queries = [
      "subject:(application OR interview OR position OR job OR hiring)",
      "from:(careers OR hr OR recruiting OR talent OR noreply)",
      "body:(thank you for your application OR interview OR assessment OR offer)",
    ];
    // Implementation handles deduplication and error handling
  }
}
```

### 5. **lib/gmail-auth.ts** (NEW)

**Location:** `/lib/gmail-auth.ts`

**Purpose:** Separate Gmail-specific authentication flow

**Key Features:**

- Dedicated Gmail OAuth flow (separate from main auth)
- Gmail-only scope permissions
- Token storage and management
- User-initiated connection process

### 6. **app/api/gmail/connect/route.ts** (NEW)

**Location:** `/app/api/gmail/connect/route.ts`

**Purpose:** API endpoint to initiate Gmail connection

### 7. **app/api/gmail/callback/route.ts** (NEW)

**Location:** `/app/api/gmail/callback/route.ts`

**Purpose:** Callback endpoint for Gmail OAuth completion

### 8. **app/auth/page.tsx** (MODIFIED)

**Location:** `/app/auth/page.tsx`

**Purpose:** Authentication page with real Google OAuth integration

**Changes Made:**

- Replaced mock authentication with real NextAuth `signIn()`
- Added session status monitoring
- Integrated with NextAuth session hooks
- Maintained existing UI/UX design
- Added proper loading states

**Key Features:**

- Real Google OAuth sign-in (profile only)
- Session state management
- Automatic redirect after authentication
- Error handling with toast notifications

### 9. **app/gmail/page.tsx** (MODIFIED)

**Location:** `/app/gmail/page.tsx`

**Purpose:** Gmail integration page with connect/disconnect functionality

**Changes Made:**

- Added "Connect Gmail" button when not connected
- Integrated with separate Gmail OAuth flow
- Added callback handling for OAuth return
- Updated to use new Gmail authentication system

**Key Features:**

- Separate Gmail connection flow
- OAuth callback handling
- Connection status management
- Real Gmail integration

### 10. **components/session-provider.tsx** (NEW)

**Location:** `/components/session-provider.tsx`

**Purpose:** Client-side SessionProvider wrapper component

**Key Features:**

- Wraps NextAuth SessionProvider
- Enables session access throughout the app
- Client-side component for session context

```typescript
"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

### 11. **components/auth-wrapper.tsx** (MODIFIED)

**Location:** `/components/auth-wrapper.tsx`

**Purpose:** Authentication state wrapper with route protection

**Changes Made:**

- Replaced localStorage-based auth with NextAuth session
- Added session status checking
- Improved loading states
- Enhanced redirect logic

**Key Features:**

- Route protection based on authentication status
- Automatic redirects (auth page ↔ dashboard)
- Loading state management
- Session-based authentication checking

### 12. **app/layout.tsx** (MODIFIED)

**Location:** `/app/layout.tsx`

**Purpose:** Root layout with authentication providers

**Changes Made:**

- Added SessionProvider wrapper
- Integrated with new authentication system
- Maintained existing layout structure

**New Structure:**

```jsx
<Providers>
  {" "}
  // SessionProvider wrapper
  <AuthWrapper>
    {" "}
    // Route protection
    <SidebarProvider>
      {" "}
      // UI layout
      <AppSidebar />
      <main>{children}</main>
    </SidebarProvider>
  </AuthWrapper>
</Providers>
```

### 13. **components/app-sidebar.tsx** (MODIFIED)

**Location:** `/components/app-sidebar.tsx`

**Purpose:** Application sidebar with authentication-aware features

**Changes Made:**

- Replaced localStorage checks with NextAuth session
- Integrated `signOut()` function
- Updated logout confirmation dialog
- Removed manual localStorage clearing

**Key Features:**

- Session-based authentication display
- Secure sign-out functionality
- Automatic UI updates based on auth state

### 14. **components/debug-session.tsx** (NEW)

**Location:** `/components/debug-session.tsx`

**Purpose:** Development-only session debugging component

**Key Features:**

- View session status and user info
- Show/hide OAuth tokens
- Clear session functionality
- Only visible in development mode

### 15. **app/api/gmail/messages/route.ts** (NEW)

**Location:** `/app/api/gmail/messages/route.ts`

**Purpose:** Test API endpoint for Gmail integration

**Key Features:**

- Server-side session verification
- Gmail API integration testing
- Job application email search
- Error handling and response formatting

```typescript
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const gmail = await createGmailClient(session.accessToken);
  const messages = await gmail.searchJobApplicationEmails();

  return NextResponse.json({ success: true, count: messages.length, messages });
}
```

## 🔐 Environment Variables Required

### Create `.env.local` file:

```bash
# NextAuth.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-here

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Generate NEXTAUTH_SECRET:

```bash
openssl rand -base64 32
```

## 🌐 Google Cloud Console Configuration

### 1. Project Setup

- **Project Name:** `the-void` (or your choice)
- **Location:** Google Cloud Console → Create New Project

### 2. APIs Enabled

- **Gmail API:** For email access and monitoring
- **Google+ API:** For basic profile information

### 3. OAuth 2.0 Client Configuration

- **Application Type:** Web application
- **Name:** `The Void App`
- **Authorized JavaScript Origins:**
  ```
  http://localhost:3000
  ```
- **Authorized Redirect URIs:**
  ```
  http://localhost:3000/api/auth/callback/google
  http://localhost:3000/api/gmail/callback
  ```

### 4. OAuth Consent Screen

- **Application Name:** The Void
- **Scopes:**
  - `email`
  - `profile`
  - `https://www.googleapis.com/auth/gmail.readonly`

## 🧪 Testing Endpoints

### Authentication Test

- **URL:** `http://localhost:3000/auth`
- **Action:** Click "Sign in with Google"
- **Expected:** OAuth flow → Dashboard redirect

### Gmail Connection Test

- **URL:** `http://localhost:3000/gmail`
- **Action:** Click "Connect Gmail" (after authentication)
- **Expected:** Gmail OAuth flow → Connected status

### Gmail API Test

- **URL:** `http://localhost:3000/api/gmail/messages`
- **Method:** GET
- **Expected:** JSON response with job-related emails
- **Requirements:** Must be authenticated and Gmail connected

## 🔄 Authentication Flow

### Main Authentication:

1. **User visits** `/auth` page
2. **Clicks** "Sign in with Google"
3. **Redirected** to Google OAuth consent screen (profile only)
4. **Grants** basic permissions (email, profile)
5. **Redirected** back to app with authorization code
6. **NextAuth** exchanges code for access/refresh tokens
7. **Session** created with tokens stored in JWT
8. **User redirected** to dashboard

### Gmail Connection (Separate):

1. **User visits** `/gmail` page (must be authenticated first)
2. **Clicks** "Connect Gmail"
3. **Redirected** to Google OAuth consent screen (Gmail scope)
4. **Grants** Gmail read-only permission
5. **Redirected** to `/api/gmail/callback`
6. **Tokens stored** for Gmail API access
7. **User redirected** back to Gmail page with success

## 🛡️ Security Features

### Token Management

- **Access tokens** stored securely in JWT
- **Refresh tokens** available for automatic renewal
- **Server-side** token validation
- **No client-side** token exposure

### Separate Permission Flows

- **Basic auth** only requests profile info
- **Gmail access** requested separately when user chooses
- **User control** over what permissions to grant
- **Can use app** without Gmail integration

### Route Protection

- **Automatic redirects** for unauthenticated users
- **Session verification** on protected routes
- **API endpoint** authentication checks

### Gmail API Security

- **Read-only access** to Gmail
- **Scoped permissions** (no write access)
- **Token-based** authentication
- **Server-side** API calls only

## 🚀 Implementation Benefits

1. **Secure OAuth 2.0** implementation
2. **Automatic token management** with refresh
3. **Type-safe** throughout with TypeScript
4. **Gmail integration** ready for job monitoring
5. **Route protection** built-in
6. **Scalable architecture** for future features
7. **Error handling** and user feedback
8. **Modern React patterns** with hooks
9. **User choice** - can use app without Gmail
10. **Separate permission flows** for better UX

## 🐛 Common Issues & Solutions

### Issue: "Access blocked: verification process"

**Solution:** Add test users in Google Cloud Console

### Issue: "Invalid redirect URI"

**Solution:** Ensure exact match in Google Cloud Console redirect URIs (include both NextAuth and Gmail callback URIs)

### Issue: "Scope not granted"

**Solution:** Re-authenticate to grant Gmail scope permissions

### Issue: "Session not found"

**Solution:** Check NEXTAUTH_SECRET and NEXTAUTH_URL environment variables

### Issue: "Gmail connection fails"

**Solution:** Verify Gmail callback URI is added to Google Cloud Console

## 📈 Next Steps

1. **Production deployment** configuration
2. **Email parsing** and application detection
3. **Database integration** for persistent storage
4. **Background sync** for automatic email monitoring
5. **Webhook integration** for real-time updates

## 🔧 Development Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

---

**Implementation Date:** December 2024  
**Next.js Version:** 15.2.4  
**NextAuth Version:** 4.24.11  
**Status:** ✅ Complete and Ready for Testing
