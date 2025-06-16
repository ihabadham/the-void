import { and, eq, desc } from "drizzle-orm";
import { database } from "../database/connection";
import {
  type Document,
  documents,
  type NewDocument,
} from "../database/schemas";

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
