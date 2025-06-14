import { eq, desc, and, count } from "drizzle-orm";
import { database } from "../database/connection";
import { applications } from "../database/schemas/applications";
import { documents } from "../database/schemas/documents";
import { userSettings } from "../database/schemas/settings";
import type {
  Application,
  NewApplication,
} from "../database/schemas/applications";
import type { Document, NewDocument } from "../database/schemas/documents";
import type {
  UserSettings,
  NewUserSettings,
} from "../database/schemas/settings";

/**
 * Application data access functions
 */

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

/**
 * Document data access functions
 */

export async function getDocumentsByApplicationId(
  userId: string,
  applicationId: string
): Promise<Document[]> {
  try {
    return await database
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.applicationId, applicationId),
          eq(documents.userId, userId)
        )
      )
      .orderBy(desc(documents.uploadDate));
  } catch (error) {
    console.error("Error fetching documents:", error);
    throw new Error("Failed to fetch documents");
  }
}

export async function getDocumentsByUserId(
  userId: string
): Promise<Document[]> {
  try {
    return await database
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.uploadDate));
  } catch (error) {
    console.error("Error fetching user documents:", error);
    throw new Error("Failed to fetch user documents");
  }
}

export async function createDocument(
  documentData: NewDocument
): Promise<Document> {
  try {
    const result = await database
      .insert(documents)
      .values({
        ...documentData,
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Error creating document:", error);
    throw new Error("Failed to create document");
  }
}

export async function deleteDocument(
  userId: string,
  documentId: string
): Promise<boolean> {
  try {
    const result = await database
      .delete(documents)
      .where(and(eq(documents.id, documentId), eq(documents.userId, userId)))
      .returning();

    return result.length > 0;
  } catch (error) {
    console.error("Error deleting document:", error);
    throw new Error("Failed to delete document");
  }
}

/**
 * User Settings data access functions
 */

export async function getUserSettings(
  userId: string
): Promise<UserSettings | null> {
  try {
    const result = await database
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("Error fetching user settings:", error);
    throw new Error("Failed to fetch user settings");
  }
}

export async function createUserSettings(
  settingsData: NewUserSettings
): Promise<UserSettings> {
  try {
    const result = await database
      .insert(userSettings)
      .values({
        ...settingsData,
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Error creating user settings:", error);
    throw new Error("Failed to create user settings");
  }
}

export async function updateUserSettings(
  userId: string,
  updateData: Partial<NewUserSettings>
): Promise<UserSettings | null> {
  try {
    const result = await database
      .update(userSettings)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(userSettings.userId, userId))
      .returning();

    return result[0] || null;
  } catch (error) {
    console.error("Error updating user settings:", error);
    throw new Error("Failed to update user settings");
  }
}

export async function upsertUserSettings(
  userId: string,
  settingsData: Partial<NewUserSettings>
): Promise<UserSettings> {
  try {
    // Try to get existing settings
    const existing = await getUserSettings(userId);

    if (existing) {
      // Update existing settings
      const updated = await updateUserSettings(userId, settingsData);
      return updated!;
    } else {
      // Create new settings
      return await createUserSettings({
        userId,
        ...settingsData,
      } as NewUserSettings);
    }
  } catch (error) {
    console.error("Error upserting user settings:", error);
    throw new Error("Failed to save user settings");
  }
}

/**
 * Dashboard statistics functions
 */

export async function getDashboardStats(userId: string) {
  try {
    // Get all applications for the user
    const userApplications = await getApplicationsByUserId(userId);

    // Calculate stats
    const total = userApplications.length;
    const pending = userApplications.filter((app) =>
      ["applied", "assessment", "interview"].includes(app.status)
    ).length;
    const interviews = userApplications.filter(
      (app) => app.status === "interview"
    ).length;
    const rejections = userApplications.filter(
      (app) => app.status === "rejected"
    ).length;
    const offers = userApplications.filter(
      (app) => app.status === "offer"
    ).length;

    // Get upcoming events
    const now = new Date();
    const upcomingEvents = userApplications
      .filter((app) => app.nextDate && new Date(app.nextDate) > now)
      .sort(
        (a, b) =>
          new Date(a.nextDate!).getTime() - new Date(b.nextDate!).getTime()
      )
      .slice(0, 5);

    // Get recent applications
    const recentApplications = userApplications
      .sort(
        (a, b) =>
          new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime()
      )
      .slice(0, 5);

    return {
      stats: {
        total,
        pending,
        interviews,
        rejections,
        offers,
      },
      upcomingEvents,
      recentApplications,
    };
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    throw new Error("Failed to get dashboard statistics");
  }
}
