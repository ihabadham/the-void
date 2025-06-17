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
import {
  uploadDocument,
  deleteDocumentFile,
  getSignedDocumentUrl,
  generateDocumentPath,
} from "../storage/documents";

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
  userId: string,
  filters?: {
    applicationId?: string;
    type?: string;
  }
): Promise<Document[]> {
  try {
    // Validate user ID
    const validatedUserId = validateData(commonSchemas.uuid, userId);

    // Build where conditions array starting with user ID filter
    const whereConditions = [eq(documents.userId, validatedUserId)];

    // Add application ID filter if provided
    if (filters?.applicationId) {
      const validatedAppId = validateData(
        commonSchemas.uuid,
        filters.applicationId
      );
      whereConditions.push(eq(documents.applicationId, validatedAppId));
    }

    // Add type filter if provided
    if (filters?.type) {
      const validatedType = validateData(documentSchemas.type, filters.type);
      whereConditions.push(eq(documents.type, validatedType));
    }

    return await database
      .select()
      .from(documents)
      .where(and(...whereConditions))
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

export async function getDocumentById(
  userId: string,
  documentId: string
): Promise<Document | null> {
  try {
    // Validate input parameters
    const validatedUserId = validateData(commonSchemas.uuid, userId);
    const validatedDocId = validateData(commonSchemas.uuid, documentId);

    const result = await database
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.id, validatedDocId),
          eq(documents.userId, validatedUserId)
        )
      )
      .limit(1);

    return result[0] || null;
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error("Document fetch validation error:", error.message);
      throw error;
    }
    console.error("Error fetching document:", error);
    throw new Error("Failed to fetch document");
  }
}

export async function createDocumentWithFile(
  file: File,
  documentData: Omit<NewDocument, "url" | "size" | "mimeType">,
  userId: string,
  applicationId: string
): Promise<Document> {
  try {
    // Generate document ID first
    const documentId = crypto.randomUUID();

    // Upload file to storage
    const uploadResult = await uploadDocument(
      file,
      userId,
      applicationId,
      documentId
    );

    // Create document record with file info
    const completeDocumentData: NewDocument = {
      ...documentData,
      id: documentId,
      url: uploadResult.publicUrl,
      size: file.size,
      mimeType: file.type,
    };

    // Validate and create document
    const validatedData = validateData(
      documentSchemas.create.extend({
        id: commonSchemas.uuid,
        userId: commonSchemas.uuid,
      }),
      completeDocumentData
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
    console.error("Error creating document with file:", error);
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

    // First, get the document to find the file path
    const document = await getDocumentById(userId, documentId);
    if (!document) {
      return false;
    }

    // Delete the database record first
    const result = await database
      .delete(documents)
      .where(
        and(
          eq(documents.id, validatedDocId),
          eq(documents.userId, validatedUserId)
        )
      )
      .returning();

    if (result.length === 0) {
      return false;
    }

    // Delete the file from storage (if it exists)
    if (document.url) {
      try {
        // Extract file path from URL or generate it
        const filePath = generateDocumentPath(
          userId,
          document.applicationId,
          documentId,
          document.name
        );
        await deleteDocumentFile(filePath);
      } catch (storageError) {
        console.warn("Failed to delete file from storage:", storageError);
        // Don't fail the entire operation if file deletion fails
      }
    }

    return true;
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error("Document deletion validation error:", error.message);
      throw error;
    }
    console.error("Error deleting document:", error);
    throw new Error("Failed to delete document");
  }
}

export async function getDocumentWithSignedUrl(
  userId: string,
  documentId: string,
  expiresIn: number = 3600
): Promise<(Document & { signedUrl?: string }) | null> {
  try {
    const document = await getDocumentById(userId, documentId);
    if (!document) {
      return null;
    }

    // Generate signed URL if document has a file
    if (document.url) {
      try {
        const filePath = generateDocumentPath(
          userId,
          document.applicationId,
          documentId,
          document.name
        );
        const signedUrl = await getSignedDocumentUrl(filePath, expiresIn);
        return { ...document, signedUrl };
      } catch (error) {
        console.warn("Failed to generate signed URL:", error);
        // Return document without signed URL
      }
    }

    return document;
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error(
        "Document with signed URL validation error:",
        error.message
      );
      throw error;
    }
    console.error("Error getting document with signed URL:", error);
    throw new Error("Failed to get document with signed URL");
  }
}
