import { eq, desc, and, count } from "drizzle-orm";
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

export async function getApplicationsByUserId(
  userId: string
): Promise<Application[]> {
  try {
    // Validate user ID
    const validatedUserId = validateData(applicationSchemas.id, userId);

    return await database
      .select()
      .from(applications)
      .where(eq(applications.userId, validatedUserId))
      .orderBy(desc(applications.createdAt));
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
