import { eq, desc, and, count } from "drizzle-orm";
import { database } from "../database/connection";
import { applications } from "../database/schemas/applications";
import type {
  Application,
  NewApplication,
} from "../database/schemas/applications";

export async function getApplicationsByUserId(
  userId: string
): Promise<Application[]> {
  try {
    return await database
      .select()
      .from(applications)
      .where(eq(applications.userId, userId))
      .orderBy(desc(applications.createdAt));
  } catch (error) {
    console.error("Error fetching applications:", error);
    throw new Error("Failed to fetch applications");
  }
}

export async function getApplicationById(
  userId: string,
  applicationId: string
): Promise<Application | null> {
  try {
    const result = await database
      .select()
      .from(applications)
      .where(
        and(eq(applications.id, applicationId), eq(applications.userId, userId))
      )
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("Error fetching application:", error);
    throw new Error("Failed to fetch application");
  }
}

export async function createApplication(
  applicationData: NewApplication
): Promise<Application> {
  try {
    const result = await database
      .insert(applications)
      .values({
        ...applicationData,
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Error creating application:", error);
    throw new Error("Failed to create application");
  }
}

export async function updateApplication(
  userId: string,
  applicationId: string,
  updateData: Partial<NewApplication>
): Promise<Application | null> {
  try {
    const result = await database
      .update(applications)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(
        and(eq(applications.id, applicationId), eq(applications.userId, userId))
      )
      .returning();

    return result[0] || null;
  } catch (error) {
    console.error("Error updating application:", error);
    throw new Error("Failed to update application");
  }
}

export async function deleteApplication(
  userId: string,
  applicationId: string
): Promise<boolean> {
  try {
    const result = await database
      .delete(applications)
      .where(
        and(eq(applications.id, applicationId), eq(applications.userId, userId))
      )
      .returning();

    return result.length > 0;
  } catch (error) {
    console.error("Error deleting application:", error);
    throw new Error("Failed to delete application");
  }
}
