import { eq } from "drizzle-orm";
import { database } from "../database/connection";
import {
  type UserSettings,
  userSettings,
  type NewUserSettings,
} from "../database/schemas";

// Safe update type that excludes protected fields
export type UserSettingsUpdate = Omit<
  Partial<NewUserSettings>,
  "id" | "userId" | "createdAt" | "updatedAt"
>;

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
  updateData: UserSettingsUpdate
): Promise<UserSettings | null> {
  try {
    // Create a safe update object with only allowed fields
    const safeUpdateData: Record<string, any> = {};

    // Whitelist of allowed fields that can be updated
    const allowedFields = [
      "notifications",
      "autoSync",
      "darkMode",
      "emailReminders",
      "exportFormat",
      "dataRetention",
    ] as const;

    // Only include allowed fields from updateData
    for (const field of allowedFields) {
      if (field in updateData && updateData[field] !== undefined) {
        safeUpdateData[field] = updateData[field];
      }
    }

    const result = await database
      .update(userSettings)
      .set({
        ...safeUpdateData,
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
  settingsData: UserSettingsUpdate
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
