import { and, eq, desc } from "drizzle-orm";
import { database } from "../database/connection";
import {
  type Document,
  documents,
  type NewDocument,
} from "../database/schemas";
import { validateData, ValidationError } from "../validation/utils";
import { documentSchemas } from "../validation/schemas/documents";
import { commonSchemas } from "../validation/schemas/common";

export async function getDocumentsByApplicationId(
  userId: string,
  applicationId: string
): Promise<Document[]> {
  try {
    // Validate input parameters
    const validatedUserId = validateData(commonSchemas.uuid, userId);
    const validatedAppId = validateData(commonSchemas.uuid, applicationId);

    return await database
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.applicationId, validatedAppId),
          eq(documents.userId, validatedUserId)
        )
      )
      .orderBy(desc(documents.uploadDate));
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error("Documents fetch validation error:", error.message);
      throw error;
    }
    console.error("Error fetching documents:", error);
    throw new Error("Failed to fetch documents");
  }
}

export async function getDocumentsByUserId(
  userId: string
): Promise<Document[]> {
  try {
    // Validate user ID
    const validatedUserId = validateData(commonSchemas.uuid, userId);

    return await database
      .select()
      .from(documents)
      .where(eq(documents.userId, validatedUserId))
      .orderBy(desc(documents.uploadDate));
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error("User documents fetch validation error:", error.message);
      throw error;
    }
    console.error("Error fetching user documents:", error);
    throw new Error("Failed to fetch user documents");
  }
}

export async function createDocument(
  documentData: NewDocument
): Promise<Document> {
  try {
    // Validate input data
    const validatedData = validateData(
      documentSchemas.create.extend({
        userId: commonSchemas.uuid, // Add userId validation
      }),
      documentData
    );

    const result = await database
      .insert(documents)
      .values(validatedData)
      .returning();

    return result[0];
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error("Document creation validation error:", error.message);
      throw error;
    }
    console.error("Error creating document:", error);
    throw new Error("Failed to create document");
  }
}

export async function deleteDocument(
  userId: string,
  documentId: string
): Promise<boolean> {
  try {
    // Validate input parameters
    const validatedUserId = validateData(commonSchemas.uuid, userId);
    const validatedDocId = validateData(commonSchemas.uuid, documentId);

    const result = await database
      .delete(documents)
      .where(
        and(
          eq(documents.id, validatedDocId),
          eq(documents.userId, validatedUserId)
        )
      )
      .returning();

    return result.length > 0;
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error("Document deletion validation error:", error.message);
      throw error;
    }
    console.error("Error deleting document:", error);
    throw new Error("Failed to delete document");
  }
}
