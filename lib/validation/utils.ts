import { z } from "zod";

// Re-export all schemas from modular files
export * from "./schemas";

/**
 * Validation error handling utilities
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: z.ZodError["errors"]
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Helper to create validation error from Zod error
 */
export function createValidationError(error: z.ZodError): ValidationError {
  const message = error.errors
    .map((err) => `${err.path.join(".")}: ${err.message}`)
    .join("; ");

  return new ValidationError(`Validation failed: ${message}`, error.errors);
}

/**
 * Safe validation wrapper
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw createValidationError(result.error);
  }

  return result.data;
}

/**
 * Async validation wrapper
 */
export async function validateDataAsync<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<T> {
  try {
    return await schema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createValidationError(error);
    }
    throw error;
  }
}
