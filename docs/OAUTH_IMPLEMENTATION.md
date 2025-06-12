# OAuth Implementation Guide

## Overview

This document explains our Gmail OAuth implementation and the technical decisions behind using direct HTTP requests for token exchange.

## Architecture

### Two-Phase OAuth Flow

1. **Basic Authentication**: NextAuth handles Google OAuth for basic user profile (email, name)
2. **Gmail Connection**: Separate OAuth flow specifically for Gmail API access

### Why Separate Flows?

- **User Choice**: Not all users need Gmail integration
- **Scope Separation**: Basic auth uses minimal scopes, Gmail connection requests specific permissions
- **PRD Alignment**: Matches the product requirement of optional Gmail connection

## Technical Implementation

### Token Exchange: Direct HTTP vs googleapis

We use **direct HTTP requests** to Google's OAuth endpoint instead of the googleapis library for token exchange.

#### The Problem with googleapis

```typescript
// This approach caused PKCE issues:
const { tokens } = await oauth2Client.getToken(code);
```

The googleapis library automatically enables PKCE (Proof Key for Code Exchange) under certain conditions:

- Modern OAuth best practices
- Client configuration detection
- Google Cloud Console settings

When PKCE is enabled, Google expects additional parameters:

- `code_challenge` and `code_challenge_method` during authorization
- `code_verifier` during token exchange

Since we weren't providing these parameters, token exchange failed with "invalid_grant" errors.

#### Our Solution

```typescript
// Direct HTTP request gives explicit control:
const response = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
  },
  body: new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  }).toString(),
});
```

#### Why This Is Professional

1. **RFC 6749 Compliant**: Uses standard OAuth 2.0 authorization code flow
2. **Predictable**: No automatic library decisions about OAuth flow
3. **Industry Standard**: Many production systems use direct HTTP for OAuth
4. **Explicit Control**: We specify exactly which parameters to send

## File Structure

```
lib/
├── auth.ts                    # NextAuth configuration
├── gmail-server.ts           # Server-side Gmail OAuth & API
├── gmail-client.ts           # Client-side token utilities
└── types/next-auth.d.ts      # TypeScript extensions

app/api/
├── auth/[...nextauth]/       # NextAuth endpoints
├── gmail/
│   ├── callback/            # Gmail OAuth callback
│   ├── messages/            # Gmail API endpoints
│   └── test/                # Token validation test
```

## Usage Examples

### 1. Initiate Gmail Connection

```typescript
import { createGmailAuthUrl } from "@/lib/gmail-server";

// Generate authorization URL
const authUrl = createGmailAuthUrl();
window.location.href = authUrl;
```

### 2. Handle OAuth Callback

```typescript
// app/api/gmail/callback/route.ts
const tokens = await exchangeCodeForTokens(code);
// Store tokens securely (database, encrypted session, etc.)
```

### 3. Make Gmail API Calls

```typescript
import { createAuthenticatedGmailClient } from "@/lib/gmail-server";

const gmail = createAuthenticatedGmailClient(tokens);
const messages = await gmail.users.messages.list({
  userId: "me",
  q: "from:noreply",
});
```

## Security Considerations

### Token Storage

- **Development**: Tokens in URL params (temporary demo)
- **Production**: Store in database with encryption
- **Client-side**: Use localStorage for demo, secure httpOnly cookies for production

### Scopes

- **Minimal**: Only request `gmail.readonly` scope
- **Explicit**: Clear to user what access we're requesting

### Error Handling

- Graceful degradation when Gmail connection fails
- Clear error messages without exposing sensitive details
- Automatic token refresh handling

## Environment Variables

Required for Gmail OAuth:

```bash
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret
```

## Testing

Use the test endpoint to validate token functionality:

```bash
curl -X POST http://localhost:3000/api/gmail/test \
  -H "Content-Type: application/json" \
  -d '{"tokens": {"access_token": "...", "refresh_token": "..."}}'
```

## Future Improvements

1. **Database Integration**: Store tokens securely in database
2. **Token Refresh**: Automatic refresh token handling
3. **Error Recovery**: Better handling of expired/revoked tokens
4. **PKCE Support**: If needed, implement proper PKCE flow end-to-end
