import { eq } from "drizzle-orm";
import { database } from "../database/connection";
import {
  type UserSettings,
  userSettings,
  type NewUserSettings,
} from "../database/schemas";
import { validateData, ValidationError } from "../validation/utils";
import { userSettingsSchemas } from "../validation/schemas/settings";
import { commonSchemas } from "../validation/schemas/common";

// Safe update type that excludes protected fields
export type UserSettingsUpdate = Omit<
  Partial<NewUserSettings>,
  "id" | "userId" | "createdAt" | "updatedAt"
>;

export async function getUserSettings(
  userId: string
): Promise<UserSettings | null> {
  try {
    // Validate user ID
    const validatedUserId = validateData(commonSchemas.uuid, userId);

    const result = await database
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, validatedUserId))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error("User settings fetch validation error:", error.message);
      throw error;
    }
    console.error("Error fetching user settings:", error);
    throw new Error("Failed to fetch user settings");
  }
}

export async function createUserSettings(
  settingsData: NewUserSettings
): Promise<UserSettings> {
  try {
    // Validate input data
    const validatedData = validateData(
      userSettingsSchemas.create.extend({
        userId: commonSchemas.uuid, // Add userId validation
      }),
      settingsData
    );

    const result = await database
      .insert(userSettings)
      .values({
        ...validatedData,
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error("User settings creation validation error:", error.message);
      throw error;
    }
    console.error("Error creating user settings:", error);
    throw new Error("Failed to create user settings");
  }
}

export async function updateUserSettings(
  userId: string,
  updateData: UserSettingsUpdate
): Promise<UserSettings | null> {
  try {
    // Validate user ID
    const validatedUserId = validateData(commonSchemas.uuid, userId);

    // Validate update data
    const validatedUpdateData = validateData(
      userSettingsSchemas.update,
      updateData
    );

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
      if (
        field in validatedUpdateData &&
        validatedUpdateData[field] !== undefined
      ) {
        safeUpdateData[field] = validatedUpdateData[field];
      }
    }

    const result = await database
      .update(userSettings)
      .set({
        ...safeUpdateData,
        updatedAt: new Date(),
      })
      .where(eq(userSettings.userId, validatedUserId))
      .returning();

    return result[0] || null;
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error("User settings update validation error:", error.message);
      throw error;
    }
    console.error("Error updating user settings:", error);
    throw new Error("Failed to update user settings");
  }
}

export async function upsertUserSettings(
  userId: string,
  settingsData: UserSettingsUpdate
): Promise<UserSettings> {
  try {
    // Validate user ID
    const validatedUserId = validateData(commonSchemas.uuid, userId);

    // Validate settings data
    const validatedSettingsData = validateData(
      userSettingsSchemas.update,
      settingsData
    );

    // Try to get existing settings
    const existing = await getUserSettings(validatedUserId);

    if (existing) {
      // Update existing settings
      const updated = await updateUserSettings(
        validatedUserId,
        validatedSettingsData
      );

      if (!updated) {
        throw new Error("Failed to update existing user settings");
      }

      return updated;
    } else {
      // Create new settings
      return await createUserSettings({
        userId: validatedUserId,
        ...validatedSettingsData,
      } as NewUserSettings);
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error("User settings upsert validation error:", error.message);
      throw error;
    }
    console.error("Error upserting user settings:", error);
    throw new Error("Failed to save user settings");
  }
}
