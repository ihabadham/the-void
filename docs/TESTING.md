# Testing Guide for Auth Feature

This document outlines the testing strategy and structure for the authentication feature, following Next.js recommended practices.

## Testing Stack

Based on Next.js documentation, we use these recommended tools:

- **Jest** - Unit and integration testing framework
- **React Testing Library** - Component testing with user-centric approach
- **Playwright** - End-to-end testing across browsers
- **@testing-library/jest-dom** - Custom Jest matchers for DOM testing

## Project Structure

```
__tests__/
├── auth/
│   └── AuthPage.test.tsx          # Component unit tests
├── lib/
│   └── auth.test.ts               # Auth configuration tests
├── integration/
│   └── auth-integration.test.tsx   # Integration tests
└── utils/
    └── test-utils.tsx             # Testing utilities

tests/
└── e2e/
    └── auth.spec.ts               # End-to-end tests

jest.config.js                    # Jest configuration
jest.setup.js                     # Jest setup and mocks
playwright.config.ts              # Playwright configuration
```

## Test Categories

### 1. Unit Tests (`__tests__/auth/`)

Test individual components and functions in isolation:

- **AuthPage Component**
  - Rendering in different states (loading, authenticated, unauthenticated)
  - User interactions (button clicks, form submissions)
  - Error handling
  - Loading states

- **Auth Configuration** (`lib/auth.test.ts`)
  - NextAuth configuration
  - JWT callbacks
  - Session callbacks
  - Provider configuration

### 2. Integration Tests (`__tests__/integration/`)

Test how auth integrates with other parts of the app:

- Session provider integration
- Route protection
- Token refresh flows
- Error boundaries

### 3. End-to-End Tests (`tests/e2e/`)

Test complete user flows:

- Full authentication flow
- Cross-browser compatibility
- Mobile responsive behavior
- Accessibility features
- Error scenarios

## Running Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

## Test Patterns and Best Practices

### Component Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import AuthPage from '@/app/auth/page'

// Mock external dependencies
jest.mock('next-auth/react')

describe('AuthPage', () => {
  it('should render sign in button', () => {
    render(<AuthPage />)
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })
})
```

### Mocking NextAuth

```javascript
// jest.setup.js
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }) => children,
}))
```

### Testing Authentication States

Use our custom utilities for consistent testing:

```typescript
import { renderWithSession, authScenarios } from '@/tests/utils/test-utils'

it('should redirect when authenticated', () => {
  renderWithSession(<AuthPage />, { 
    session: authScenarios.authenticated.session 
  })
  // Assert redirect behavior
})
```

## Test Coverage Goals

- **Branches**: 70%+
- **Functions**: 70%+
- **Lines**: 70%+
- **Statements**: 70%+

## Common Test Scenarios

### Authentication Flow
- User clicks sign in button
- Google OAuth redirect
- Successful authentication
- Failed authentication
- Session persistence

### Route Protection
- Unauthenticated user access
- Authenticated user access
- Token expiration handling
- Redirect after login

### Error Handling
- Network errors
- Invalid tokens
- Expired sessions
- OAuth failures

## Environment Setup

### Test Environment Variables

```bash
# .env.test
GOOGLE_CLIENT_ID=test-client-id
GOOGLE_CLIENT_SECRET=test-client-secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=test-secret
```

### CI/CD Integration

Tests are automatically run on:
- Pull requests
- Main branch pushes
- Release builds

## Accessibility Testing

We test for:
- Keyboard navigation
- Screen reader compatibility
- Focus management
- ARIA attributes
- Color contrast

## Performance Testing

E2E tests include:
- Page load times
- Authentication flow speed
- Mobile performance
- Network throttling scenarios

## Security Testing

We test for:
- CSRF protection
- XSS prevention
- Secure token handling
- OAuth flow security

## Debugging Tests

### Jest Debugging
```bash
# Debug specific test
npm test -- --testNamePattern="AuthPage" --verbose

# Debug with Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Playwright Debugging
```bash
# Run with browser UI
npm run test:e2e:ui

# Debug mode
npx playwright test --debug
```

## Continuous Improvement

- Regular test maintenance
- Coverage monitoring
- Performance regression testing
- Security vulnerability scanning
- User feedback integration

## Resources

- [Next.js Testing Documentation](https://nextjs.org/docs/app/building-your-application/testing)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Jest Documentation](https://jestjs.io/docs/getting-started) 