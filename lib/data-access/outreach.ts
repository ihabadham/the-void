import { eq, and } from "drizzle-orm";

import { database } from "../database/connection";
import {
  outreachContacts,
  outreachActions,
  outreachMessages,
  type NewOutreachContact,
  type NewOutreachAction,
  type NewOutreachMessage,
  type OutreachContact,
  type OutreachAction,
  type OutreachMessage,
} from "../database/schemas/outreach";
import { validateData, ValidationError } from "../validation/utils";
import { outreachSchemas } from "../validation/schemas/outreach";

/**
 * Create (or fetch existing) outreach contact by LinkedIn URL for a user.
 */
export async function createOrGetContact(
  userId: string,
  contactData: Pick<
    NewOutreachContact,
    "fullName" | "headline" | "linkedinUrl" | "avatarUrl"
  >
): Promise<OutreachContact> {
  try {
    const validatedUserId = validateData(outreachSchemas.id, userId);
    const validatedData = validateData(
      outreachSchemas.contactCreate,
      contactData
    );

    // Check if contact already exists for this user & url
    const existing = await database
      .select()
      .from(outreachContacts)
      .where(
        and(
          eq(outreachContacts.userId, validatedUserId),
          eq(outreachContacts.linkedinUrl, validatedData.linkedinUrl)
        )
      )
      .limit(1);

    if (existing.length) {
      return existing[0];
    }

    const [created] = await database
      .insert(outreachContacts)
      .values({
        userId: validatedUserId,
        ...validatedData,
      })
      .returning();

    return created;
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error("Outreach contact validation error:", error.message);
      throw error;
    }
    console.error("Error creating outreach contact:", error);
    throw new Error("Failed to create outreach contact");
  }
}

/**
 * Upsert (insert or update) a message template for an application.
 */
export async function upsertMessage(
  userId: string,
  messageData: Pick<NewOutreachMessage, "body" | "applicationId">
): Promise<OutreachMessage> {
  try {
    const validatedUserId = validateData(outreachSchemas.id, userId);
    const validatedData = validateData(
      outreachSchemas.messageUpsert,
      messageData
    );

    // Atomic upsert prevents race condition on unique application_id
    const [message] = await database
      .insert(outreachMessages)
      .values({ userId: validatedUserId, ...validatedData })
      .onConflictDoUpdate({
        target: outreachMessages.applicationId,
        set: { body: validatedData.body, updatedAt: new Date() },
      })
      .returning();

    return message;
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error("Outreach message validation error:", error.message);
      throw error;
    }
    console.error("Error upserting outreach message:", error);
    throw new Error("Failed to upsert outreach message");
  }
}

/**
 * Log an outreach action (connection request).
 */
export async function logOutreachAction(
  userId: string,
  actionData: Pick<
    NewOutreachAction,
    | "contactId"
    | "applicationId"
    | "company"
    | "messageId"
    | "status"
    | "sentAt"
    | "respondedAt"
    | "notes"
  >
): Promise<OutreachAction> {
  try {
    const validatedUserId = validateData(outreachSchemas.id, userId);
    const validatedData = validateData(
      outreachSchemas.actionCreate,
      actionData
    );

    const [created] = await database
      .insert(outreachActions)
      .values({
        userId: validatedUserId,
        ...validatedData,
      })
      .returning();

    return created;
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error("Outreach action validation error:", error.message);
      throw error;
    }
    console.error("Error logging outreach action:", error);
    throw new Error("Failed to log outreach action");
  }
}
