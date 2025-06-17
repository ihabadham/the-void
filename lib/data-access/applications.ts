import { eq, desc, asc, and, count, like, sql, gte, lte } from "drizzle-orm";
import { database } from "../database/connection";
import { applications } from "../database/schemas/applications";
import type {
  Application,
  NewApplication,
} from "../database/schemas/applications";
import { validateData, ValidationError } from "../validation/utils";
import { applicationSchemas } from "../validation/schemas/applications";

// Safe update type that excludes protected fields
export type ApplicationUpdate = Omit<
  Partial<NewApplication>,
  "id" | "userId" | "createdAt" | "updatedAt"
>;

// Query types for pagination and filtering
export interface ApplicationsQuery {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: "createdAt" | "appliedDate" | "company" | "position";
  sortOrder?: "asc" | "desc";
  dateFrom?: Date;
  dateTo?: Date;
}

export interface PaginatedApplicationsResult {
  applications: Application[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Overloaded function signatures for better type safety
export async function getApplicationsByUserId(
  userId: string
): Promise<Application[]>;
export async function getApplicationsByUserId(
  userId: string,
  query: ApplicationsQuery & { page: number }
): Promise<PaginatedApplicationsResult>;
export async function getApplicationsByUserId(
  userId: string,
  query: ApplicationsQuery & { limit: number }
): Promise<PaginatedApplicationsResult>;
export async function getApplicationsByUserId(
  userId: string,
  query: ApplicationsQuery
): Promise<Application[] | PaginatedApplicationsResult>;
export async function getApplicationsByUserId(
  userId: string,
  query: ApplicationsQuery = {}
): Promise<Application[] | PaginatedApplicationsResult> {
  try {
    // Validate user ID
    const validatedUserId = validateData(applicationSchemas.id, userId);

    // Determine if pagination is requested
    const isPaginated = query.page !== undefined || query.limit !== undefined;

    // Set defaults
    const page = query.page || 1;
    const limit = query.limit ? Math.min(query.limit, 100) : undefined; // Cap at 100
    const sortBy = query.sortBy || "createdAt";
    const sortOrder = query.sortOrder || "desc";

    // Build where conditions
    const conditions = [eq(applications.userId, validatedUserId)];

    // Add status filter (validate enum value)
    if (query.status) {
      const validStatus = validateData(applicationSchemas.status, query.status);
      conditions.push(eq(applications.status, validStatus));
    }

    // Add search filter
    if (query.search) {
      const searchTerm = `%${query.search}%`;
      conditions.push(
        sql`(${applications.company} ILIKE ${searchTerm} OR ${applications.position} ILIKE ${searchTerm})`
      );
    }

    // Add date range filters
    if (query.dateFrom) {
      conditions.push(gte(applications.appliedDate, query.dateFrom));
    }
    if (query.dateTo) {
      conditions.push(lte(applications.appliedDate, query.dateTo));
    }

    // Combine all conditions
    const whereClause =
      conditions.length > 1 ? and(...conditions) : conditions[0];

    // Build order by clause
    const orderByClause =
      sortOrder === "desc"
        ? desc(applications[sortBy])
        : asc(applications[sortBy]);

    if (!isPaginated) {
      // Simple query - return just the applications array
      const applicationsResult = await database
        .select()
        .from(applications)
        .where(whereClause)
        .orderBy(orderByClause);

      return applicationsResult;
    }

    // Paginated query - return paginated result
    const offset = (page - 1) * limit!;

    // Get total count for pagination
    const [totalResult] = await database
      .select({ count: count() })
      .from(applications)
      .where(whereClause);

    const total = totalResult.count;
    const totalPages = Math.ceil(total / limit!);

    // Get applications with pagination
    const applicationsResult = await database
      .select()
      .from(applications)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit!)
      .offset(offset);

    return {
      applications: applicationsResult,
      pagination: {
        page,
        limit: limit!,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error("Applications fetch validation error:", error.message);
      throw error;
    }
    console.error("Error fetching applications:", error);
    throw new Error("Failed to fetch applications");
  }
}

export async function getApplicationById(
  userId: string,
  applicationId: string
): Promise<Application | null> {
  try {
    // Validate input parameters
    const validatedUserId = validateData(applicationSchemas.id, userId);
    const validatedAppId = validateData(applicationSchemas.id, applicationId);

    const result = await database
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.id, validatedAppId),
          eq(applications.userId, validatedUserId)
        )
      )
      .limit(1);

    return result[0] || null;
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error("Application fetch validation error:", error.message);
      throw error;
    }
    console.error("Error fetching application:", error);
    throw new Error("Failed to fetch application");
  }
}

export async function createApplication(
  applicationData: NewApplication
): Promise<Application> {
  try {
    // Validate input data
    const validatedData = validateData(
      applicationSchemas.create.extend({
        userId: applicationSchemas.id, // Add userId validation
      }),
      applicationData
    );

    const result = await database
      .insert(applications)
      .values({
        ...validatedData,
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error("Application creation validation error:", error.message);
      throw error;
    }
    console.error("Error creating application:", error);
    throw new Error("Failed to create application");
  }
}

export async function updateApplication(
  userId: string,
  applicationId: string,
  updateData: ApplicationUpdate
): Promise<Application | null> {
  try {
    // Validate user ID and application ID
    const validatedUserId = validateData(applicationSchemas.id, userId);
    const validatedAppId = validateData(applicationSchemas.id, applicationId);

    // Validate update data
    const validatedUpdateData = validateData(
      applicationSchemas.update,
      updateData
    );

    // Create a safe update object with only allowed fields
    const safeUpdateData: Record<string, any> = {};

    // Whitelist of allowed fields that can be updated
    const allowedFields = [
      "company",
      "position",
      "status",
      "appliedDate",
      "nextDate",
      "nextEvent",
      "cvVersion",
      "notes",
      "jobUrl",
    ] as const;

    // Only include allowed fields from updateData
    for (const field of allowedFields) {
      if (
        field in validatedUpdateData &&
        validatedUpdateData[field] !== undefined
      ) {
        safeUpdateData[field] = validatedUpdateData[field];
      }
    }

    const result = await database
      .update(applications)
      .set({
        ...safeUpdateData,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(applications.id, validatedAppId),
          eq(applications.userId, validatedUserId)
        )
      )
      .returning();

    return result[0] || null;
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error("Application update validation error:", error.message);
      throw error;
    }
    console.error("Error updating application:", error);
    throw new Error("Failed to update application");
  }
}

export async function deleteApplication(
  userId: string,
  applicationId: string
): Promise<boolean> {
  try {
    // Validate input parameters
    const validatedUserId = validateData(applicationSchemas.id, userId);
    const validatedAppId = validateData(applicationSchemas.id, applicationId);

    const result = await database
      .delete(applications)
      .where(
        and(
          eq(applications.id, validatedAppId),
          eq(applications.userId, validatedUserId)
        )
      )
      .returning();

    return result.length > 0;
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error("Application deletion validation error:", error.message);
      throw error;
    }
    console.error("Error deleting application:", error);
    throw new Error("Failed to delete application");
  }
}
