# Zod Validation System

A comprehensive runtime validation system using [Zod](https://zod.dev/) for type-safe input validation across the entire application stack.

## Overview

This implementation provides **multi-layered security** and **runtime type safety** for:
- API request/response validation
- Database operations with input sanitization
- Client-side form validation
- Server-side data access protection

## Architecture

### 🏗️ **Modular Schema Organization**

```
lib/validation/
├── schemas/
│   ├── common.ts          # Shared patterns (UUID, email, dates)
│   ├── applications.ts    # Job application validation
│   ├── settings.ts        # User settings validation
│   ├── documents.ts       # File/document validation
│   ├── api.ts            # API request validation (Gmail, pagination)
│   ├── forms.ts          # Client-side form schemas
│   └── index.ts          # Re-exports all schemas
├── utils.ts            # Main utilities + re-exports
└── api-utils.ts          # API validation helpers
```

### 🛡️ **Security Layers**

1. **Input Validation** - Zod schemas validate all incoming data
2. **Type Safety** - Runtime validation ensures data matches TypeScript types
3. **Whitelisting** - Only allowed fields can be updated (prevents injection)
4. **UUID Validation** - Prevents SQL injection through malformed IDs

## File Purpose & Usage

### **Core Schemas (`lib/validation/schemas/`)**

#### `common.ts`
```typescript
// Shared validation patterns used across domains
import { commonSchemas } from "@/lib/validation/schemas/common";

commonSchemas.uuid        // UUID validation
commonSchemas.email       // Email validation
commonSchemas.timestamp   // Date/time validation
```

#### `applications.ts`
```typescript
// Job application validation
import { applicationSchemas } from "@/lib/validation/schemas/applications";

applicationSchemas.create  // New application validation
applicationSchemas.update  // Update application (whitelist)
applicationSchemas.status  // Status enum validation
```

#### `settings.ts`, `documents.ts`
Domain-specific validation schemas following the same pattern.

#### `api.ts`
```typescript
// API request validation
import { apiSchemas } from "@/lib/validation/schemas/api";

apiSchemas.gmail.search    // Gmail search parameters
apiSchemas.pagination      // Page/limit validation
apiSchemas.params.id       // Route parameter validation
```

#### `forms.ts`
```typescript
// Client-side form validation (string dates, etc.)
import { formSchemas } from "@/lib/validation/schemas/forms";

formSchemas.application    // Application form validation
formSchemas.settings       // Settings form validation
```

### **Utilities**

#### `utils.ts` - Main utilities file
```typescript
import { validateData, ValidationError } from "@/lib/validation/utils";

// Safe validation with error handling
const validData = validateData(schema, inputData);

// Custom error class with detailed information
catch (error) {
  if (error instanceof ValidationError) {
    console.log(error.errors); // Detailed validation errors
  }
}
```

#### `api-utils.ts` - API validation helpers
```typescript
import { withValidation, createSuccessResponse } from "@/lib/validation/api-utils";

// Automatic request validation wrapper
export const POST = withValidation(
  async (request, { body, params, query }) => {
    // body/params/query are already validated!
    return createSuccessResponse(data);
  },
  {
    bodySchema: applicationSchemas.create,
    paramsSchema: apiSchemas.params.id,
    querySchema: apiSchemas.pagination
  }
);
```

## Usage Examples

### **Data Access Layer (Server-side)**
```typescript
// Automatic validation before database operations
const app = await createApplication({
  userId: "valid-uuid",
  company: "Tech Corp",
  position: "Developer",
  appliedDate: new Date()
});
// ✅ Validates all fields, prevents injection
```

### **API Routes**
```typescript
export const GET = withValidation(
  async (request, { query }) => {
    // query.q and query.maxResults are validated
    const results = await searchService(query.q, query.maxResults);
    return createSuccessResponse(results);
  },
  { querySchema: apiSchemas.gmail.search }
);
```

### **Client-side Forms**
```typescript
const form = useFormValidation(formSchemas.application, {
  company: "",
  position: ""
});

await form.handleSubmit(async (validatedData) => {
  // validatedData is type-safe and validated
  await createApplication(validatedData);
});
```

## Benefits

### 🔒 **Security**
- **SQL Injection Prevention** - UUID validation blocks malicious IDs
- **Data Integrity** - Field length limits and format validation
- **Multi-tenant Security** - Fixed critical vulnerability allowing data theft
- **Input Sanitization** - All data validated before reaching database

### 🎯 **Developer Experience**
- **Type Safety** - Runtime validation matches TypeScript types
- **Clear Error Messages** - Detailed validation feedback
- **Reusable Schemas** - Consistent validation across app
- **API Standards** - Consistent error/success response format

### 🚀 **Features**
- **Real-time Validation** - Client-side forms with instant feedback  
- **Flexible Schemas** - Create/update schemas for different use cases
- **Modular Design** - Easy to extend and maintain
- **Performance** - Efficient validation with proper error handling

## Integration Points

### **Database Operations**
All CRUD operations in `lib/data-access/` now include validation:
- Input parameter validation (UUIDs, required fields)
- Update data validation (only allowed fields)
- Type-safe database queries

### **API Endpoints**
API routes use `withValidation()` wrapper for:
- Request body validation
- Query parameter validation  
- Route parameter validation
- Standardized error responses

### **Form Components**
React components can use `useFormValidation()` hook for:
- Real-time validation
- Error message display
- Submission handling
- Type-safe form data

## Security Fixes

This implementation specifically addresses:

1. **Critical Multi-tenant Vulnerability** - Prevented users from updating `userId` fields to steal data
2. **Injection Attacks** - UUID validation prevents malformed ID injection
3. **Data Validation** - Runtime validation prevents invalid data from reaching database
4. **Type Safety** - Ensures data integrity between client and server

---

For implementation details, see the individual schema files and refer to [Zod documentation](https://zod.dev/) for advanced usage patterns. 