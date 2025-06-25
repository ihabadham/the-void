import { eq, and, desc } from "drizzle-orm";

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
import {
  applications,
  type Application,
} from "../database/schemas/applications";
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
 * Get message template for an application.
 */
export async function getMessageByApplicationId(
  userId: string,
  applicationId: string
): Promise<OutreachMessage | null> {
  try {
    const validatedUserId = validateData(outreachSchemas.id, userId);
    const validatedAppId = validateData(outreachSchemas.id, applicationId);

    const [message] = await database
      .select()
      .from(outreachMessages)
      .where(
        and(
          eq(outreachMessages.userId, validatedUserId),
          eq(outreachMessages.applicationId, validatedAppId)
        )
      )
      .limit(1);

    return message || null;
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error("Message fetch validation error:", error.message);
      throw error;
    }
    console.error("Error fetching message template:", error);
    throw new Error("Failed to fetch message template");
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

/**
 * Batch log outreach: upsert message template and create actions for multiple contacts atomically.
 */
export interface LogOutreachBatchInput {
  userId: string;
  applicationId?: string;
  company?: string;
  messageBody: string;
  contactUrls: string[];
}

export async function logOutreachBatch(
  input: LogOutreachBatchInput
): Promise<OutreachAction[]> {
  const { userId, applicationId, company, messageBody, contactUrls } = input;

  if (!applicationId && !company) {
    throw new Error("Either applicationId or company must be provided");
  }

  if (contactUrls.length === 0) {
    throw new Error("At least one contact URL is required");
  }

  // Validate upfront
  const validatedUserId = validateData(outreachSchemas.id, userId);
  contactUrls.forEach((url) =>
    validateData(outreachSchemas.contactCreate.shape.linkedinUrl, url)
  );

  return await database.transaction(async (tx) => {
    // Upsert message if applicationId exists
    let message: OutreachMessage | undefined;
    if (applicationId) {
      message = await upsertMessage(validatedUserId, {
        applicationId,
        body: messageBody,
      });
    }

    const actions: OutreachAction[] = [];

    for (const url of contactUrls) {
      // Create or get contact
      const contact = await createOrGetContact(validatedUserId, {
        linkedinUrl: url,
      });

      // Insert outreach action
      const [action] = await tx
        .insert(outreachActions)
        .values({
          userId: validatedUserId,
          contactId: contact.id,
          applicationId: applicationId || null,
          company: company || null,
          messageId: message?.id || null,
          status: "pending",
          sentAt: new Date(),
        })
        .returning();

      actions.push(action);
    }

    return actions;
  });
}

export interface OutreachActionWithContact extends OutreachAction {
  contact: OutreachContact;
  application?: Application;
}

type OutreachActionJoinResult = {
  outreach_actions: OutreachAction;
  outreach_contacts: OutreachContact;
};

type OutreachActionWithApplicationJoinResult = {
  outreach_actions: OutreachAction;
  outreach_contacts: OutreachContact;
  applications: Application | null;
};

export async function getOutreachByApplicationId(
  userId: string,
  applicationId: string
): Promise<OutreachActionWithContact[]> {
  const validatedUserId = validateData(outreachSchemas.id, userId);
  const validatedAppId = validateData(outreachSchemas.id, applicationId);

  const rows = await database
    .select()
    .from(outreachActions)
    .where(
      and(
        eq(outreachActions.applicationId, validatedAppId),
        eq(outreachActions.userId, validatedUserId)
      )
    )
    .innerJoin(
      outreachContacts,
      eq(outreachActions.contactId, outreachContacts.id)
    );

  return rows.map((row: OutreachActionJoinResult) => ({
    ...row.outreach_actions,
    contact: row.outreach_contacts,
  }));
}

/**
 * Get all outreach actions for a user with optional filtering
 */
export interface OutreachFilters {
  status?: "pending" | "accepted" | "ignored" | "other";
  company?: string;
  startDate?: Date;
  endDate?: Date;
}

export async function getAllUserOutreach(
  userId: string,
  filters?: OutreachFilters
): Promise<OutreachActionWithContact[]> {
  const validatedUserId = validateData(outreachSchemas.id, userId);

  // Build where conditions array
  const whereConditions = [eq(outreachActions.userId, validatedUserId)];

  if (filters?.status) {
    whereConditions.push(eq(outreachActions.status, filters.status));
  }

  if (filters?.company) {
    whereConditions.push(eq(outreachActions.company, filters.company));
  }

  const rows = await database
    .select()
    .from(outreachActions)
    .where(and(...whereConditions))
    .innerJoin(
      outreachContacts,
      eq(outreachActions.contactId, outreachContacts.id)
    )
    .leftJoin(applications, eq(outreachActions.applicationId, applications.id))
    .orderBy(desc(outreachActions.sentAt));

  return rows.map((row: OutreachActionWithApplicationJoinResult) => ({
    ...row.outreach_actions,
    contact: row.outreach_contacts,
    application: row.applications || undefined,
  }));
}

/**
 * Update outreach action status (e.g., pending -> accepted)
 */
export async function updateOutreachStatus(
  userId: string,
  actionId: string,
  status: "pending" | "accepted" | "ignored" | "other",
  respondedAt?: Date
): Promise<OutreachAction> {
  try {
    const validatedUserId = validateData(outreachSchemas.id, userId);
    const validatedActionId = validateData(outreachSchemas.id, actionId);
    const validatedStatus = validateData(outreachSchemas.status, status);

    const updateData: Partial<Pick<NewOutreachAction, 'status' | 'updatedAt' | 'respondedAt'>> = {
      status: validatedStatus,
      updatedAt: new Date(),
    };
      status: validatedStatus,
      updatedAt: new Date(),
    };

    // Set respondedAt if status is accepted/ignored and date provided
    if ((status === "accepted" || status === "ignored") && respondedAt) {
      updateData.respondedAt = respondedAt;
    }

    const [updated] = await database
      .update(outreachActions)
      .set(updateData)
      .where(
        and(
          eq(outreachActions.id, validatedActionId),
          eq(outreachActions.userId, validatedUserId)
        )
      )
      .returning();

    if (!updated) {
      throw new Error("Outreach action not found or not authorized");
    }

    return updated;
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error("Outreach status update validation error:", error.message);
      throw error;
    }
    console.error("Error updating outreach status:", error);
    throw new Error("Failed to update outreach status");
  }
}
