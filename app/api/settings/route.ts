import { NextRequest } from "next/server";
import {
  withValidation,
  createSuccessResponse,
} from "@/lib/validation/api-utils";
import { requireAuth } from "@/lib/auth-helpers";
import {
  getUserSettings,
  upsertUserSettings,
} from "@/lib/data-access/settings";
import { userSettingsSchemas } from "@/lib/validation/schemas/settings";

// Request body schema for PUT requests
const updateBodySchema = userSettingsSchemas.update;

export const GET = withValidation(async (request: NextRequest) => {
  // Require authentication
  const user = await requireAuth();

  // Get user settings
  const settings = await getUserSettings(user.id);

  return createSuccessResponse(settings, "Settings retrieved successfully");
});

export const PUT = withValidation(
  async (request: NextRequest, { body }) => {
    // Require authentication
    const user = await requireAuth();

    // Update/create settings with user ID
    const updatedSettings = await upsertUserSettings(user.id, body!);

    return createSuccessResponse(
      updatedSettings,
      "Settings updated successfully"
    );
  },
  {
    bodySchema: updateBodySchema,
  }
);
