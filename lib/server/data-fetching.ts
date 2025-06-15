import { getCurrentUser } from "../auth-helpers";
import {
  getApplicationsByUserId,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
  getDocumentsByUserId,
  getDocumentsByApplicationId,
  createDocument,
  getUserSettings,
  upsertUserSettings,
  getDashboardStats,
} from "../data-access/applications";
import type {
  Application,
  Document,
  UserSettings,
  NewApplication,
  NewUserSettings,
  NewDocument,
} from "../database/schemas";

/**
 * Server-side data fetching utilities for use in Server Components
 * These functions handle authentication and provide clean data access
 */

/**
 * Get all applications for the current authenticated user
 */
export async function getApplicationsForCurrentUser(): Promise<Application[]> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  return await getApplicationsByUserId(user.id);
}

/**
 * Get a specific application for the current authenticated user
 */
export async function getApplicationForCurrentUser(
  applicationId: string
): Promise<Application | null> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  return await getApplicationById(user.id, applicationId);
}

/**
 * Create a new application for the current authenticated user
 */
export async function createApplicationForCurrentUser(
  applicationData: Omit<NewApplication, "userId">
): Promise<Application> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  return await createApplication({
    ...applicationData,
    userId: user.id,
  });
}

/**
 * Update an application for the current authenticated user
 */
export async function updateApplicationForCurrentUser(
  applicationId: string,
  updateData: Partial<NewApplication>
): Promise<Application | null> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  return await updateApplication(user.id, applicationId, updateData);
}

/**
 * Delete an application for the current authenticated user
 */
export async function deleteApplicationForCurrentUser(
  applicationId: string
): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  return await deleteApplication(user.id, applicationId);
}

/**
 * Get all documents for the current authenticated user
 */
export async function getDocumentsForCurrentUser(): Promise<Document[]> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  return await getDocumentsByUserId(user.id);
}

/**
 * Get documents for a specific application for the current authenticated user
 */
export async function getDocumentsForApplication(
  applicationId: string
): Promise<Document[]> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  return await getDocumentsByApplicationId(user.id, applicationId);
}

/**
 * Create a new document for the current authenticated user
 */
export async function createDocumentForCurrentUser(
  documentData: Omit<NewDocument, "userId">
): Promise<Document> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  return await createDocument({
    ...documentData,
    userId: user.id,
  });
}

/**
 * Get user settings for the current authenticated user
 */
export async function getSettingsForCurrentUser(): Promise<UserSettings | null> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  return await getUserSettings(user.id);
}

/**
 * Update user settings for the current authenticated user
 */
export async function updateSettingsForCurrentUser(
  settingsData: Partial<NewUserSettings>
): Promise<UserSettings> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  return await upsertUserSettings(user.id, settingsData);
}

/**
 * Get dashboard statistics for the current authenticated user
 */
export async function getDashboardDataForCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  return await getDashboardStats(user.id);
}

/**
 * Get application and documents together (for application detail pages)
 */
export async function getApplicationWithDocuments(applicationId: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  const [application, documents] = await Promise.all([
    getApplicationById(user.id, applicationId),
    getDocumentsByApplicationId(user.id, applicationId),
  ]);

  if (!application) {
    return null;
  }

  return {
    application,
    documents,
  };
}

/**
 * Default user settings for new users
 */
export const DEFAULT_USER_SETTINGS: Omit<
  UserSettings,
  "id" | "userId" | "createdAt" | "updatedAt"
> = {
  notifications: true,
  autoSync: false,
  darkMode: true,
  emailReminders: true,
  exportFormat: "json" as const,
  dataRetention: 365,
};

/**
 * Get user settings with defaults for current user
 * If no settings exist, return defaults without creating them
 */
export async function getSettingsWithDefaults(): Promise<UserSettings> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  const settings = await getUserSettings(user.id);

  if (settings) {
    return settings;
  }

  // Return defaults with user ID and dummy timestamps
  // These will not be persisted until explicitly saved
  return {
    id: "default",
    userId: user.id,
    ...DEFAULT_USER_SETTINGS,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Type definitions for server component props
 */
export interface DashboardData {
  stats: {
    total: number;
    pending: number;
    interviews: number;
    rejections: number;
    offers: number;
  };
  upcomingEvents: Application[];
  recentApplications: Application[];
}

export interface ApplicationDetailData {
  application: Application;
  documents: Document[];
}

/**
 * Error handling utilities for server components
 */
export class ServerDataError extends Error {
  constructor(
    message: string,
    public code:
      | "UNAUTHORIZED"
      | "NOT_FOUND"
      | "DATABASE_ERROR" = "DATABASE_ERROR"
  ) {
    super(message);
    this.name = "ServerDataError";
  }
}

/**
 * Wrapper for safe data fetching with error handling
 */
export async function safeServerFetch<T>(
  fetchFn: () => Promise<T>,
  errorMessage: string = "Failed to fetch data"
): Promise<T | null> {
  try {
    return await fetchFn();
  } catch (error) {
    console.error(`Server data fetch error: ${errorMessage}`, error);

    if (error instanceof Error && error.message.includes("not authenticated")) {
      throw new ServerDataError("User not authenticated", "UNAUTHORIZED");
    }

    throw new ServerDataError(errorMessage, "DATABASE_ERROR");
  }
}
