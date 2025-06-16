import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ValidationError } from "./utils";

/**
 * API validation utilities for Next.js App Router
 */

/**
 * Validate URL search parameters
 */
export function validateSearchParams<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): T {
  const { searchParams } = new URL(request.url);
  const params: Record<string, any> = {};

  // Convert URLSearchParams to regular object
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }

  const result = schema.safeParse(params);

  if (!result.success) {
    throw new ValidationError("Invalid search parameters", result.error.errors);
  }

  return result.data;
}

/**
 * Validate JSON request body
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      throw new ValidationError("Invalid request body", result.error.errors);
    }

    return result.data;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    // For JSON parsing errors, create a simpler error
    throw new Error("Invalid JSON in request body");
  }
}

/**
 * Validate route parameters (like [id])
 */
export function validateParams<T>(params: unknown, schema: z.ZodSchema<T>): T {
  const result = schema.safeParse(params);

  if (!result.success) {
    throw new ValidationError("Invalid route parameters", result.error.errors);
  }

  return result.data;
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: unknown,
  defaultMessage: string = "An error occurred"
): NextResponse {
  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        message: error.message,
        details: error.errors.map((err) => ({
          field: err.path.join(".") || "root",
          message: err.message,
          code: err.code,
        })),
      },
      { status: 400 }
    );
  }

  if (error instanceof Error) {
    // Handle specific error types
    if (error.message.includes("not authenticated")) {
      return NextResponse.json(
        {
          error: "Authentication required",
          message: "Please log in to continue",
        },
        { status: 401 }
      );
    }

    if (error.message.includes("not found")) {
      return NextResponse.json(
        { error: "Not found", message: error.message },
        { status: 404 }
      );
    }

    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal error", message: defaultMessage },
      { status: 500 }
    );
  }

  console.error("Unknown API Error:", error);
  return NextResponse.json(
    { error: "Internal error", message: defaultMessage },
    { status: 500 }
  );
}

/**
 * Wrapper for API route handlers with automatic validation and error handling
 */
export function withValidation<TBody = any, TParams = any, TQuery = any>(
  handler: (
    request: NextRequest,
    context: {
      params?: TParams;
      body?: TBody;
      query?: TQuery;
    }
  ) => Promise<NextResponse>,
  options: {
    bodySchema?: z.ZodSchema<TBody>;
    paramsSchema?: z.ZodSchema<TParams>;
    querySchema?: z.ZodSchema<TQuery>;
  } = {}
) {
  return async (
    request: NextRequest,
    { params }: { params?: Promise<Record<string, string>> } = {}
  ): Promise<NextResponse> => {
    try {
      const context: {
        params?: TParams;
        body?: TBody;
        query?: TQuery;
      } = {};

      // Validate route parameters
      if (options.paramsSchema && params) {
        const resolvedParams = await params;
        context.params = validateParams(resolvedParams, options.paramsSchema);
      }

      // Validate query parameters
      if (options.querySchema) {
        context.query = validateSearchParams(request, options.querySchema);
      }

      // Validate request body for non-GET requests
      if (options.bodySchema && request.method !== "GET") {
        context.body = await validateRequestBody(request, options.bodySchema);
      }

      return await handler(request, context);
    } catch (error) {
      return createErrorResponse(error);
    }
  };
}

/**
 * Success response helper
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      ...(message && { message }),
      data,
    },
    { status }
  );
}

/**
 * Paginated response helper
 */
export function createPaginatedResponse<T>(
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
  },
  message?: string
): NextResponse {
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return NextResponse.json({
    success: true,
    ...(message && { message }),
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1,
    },
  });
}
