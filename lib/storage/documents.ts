import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Document storage utilities for Supabase storage
 * Handles file upload, download, delete operations with proper security
 */

export interface FileUploadResult {
  filePath: string;
  publicUrl: string;
  signedUrl?: string;
}

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified?: number;
}

// Storage bucket name for documents
const DOCUMENTS_BUCKET = "documents";

// Allowed file types for security
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/zip",
  "application/x-zip-compressed",
] as const;

// Maximum file size (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * Validate file before upload
 */
export function validateFile(file: File): void {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File size too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
    );
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type as any)) {
    throw new Error(`File type ${file.type} is not allowed`);
  }

  // Additional security checks
  if (file.name.includes("..") || file.name.includes("/")) {
    throw new Error("Invalid file name");
  }
}

/**
 * Generate storage path for document
 * Format: documents/{userId}/{applicationId}/{documentId}-{filename}
 */
export function generateDocumentPath(
  userId: string,
  applicationId: string,
  documentId: string,
  filename: string
): string {
  // Sanitize filename
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${userId}/${applicationId}/${documentId}-${sanitizedFilename}`;
}

/**
 * Upload document file to Supabase storage
 */
export async function uploadDocument(
  file: File,
  userId: string,
  applicationId: string,
  documentId: string
): Promise<FileUploadResult> {
  try {
    // Validate file
    validateFile(file);

    // Use service role client to bypass RLS policies
    const supabase = createServiceRoleClient();

    // Generate file path
    const filePath = generateDocumentPath(
      userId,
      applicationId,
      documentId,
      file.name
    );

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false, // Don't overwrite existing files
      });

    if (error) {
      console.error("Supabase upload error:", error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(DOCUMENTS_BUCKET)
      .getPublicUrl(data.path);

    return {
      filePath: data.path,
      publicUrl: publicUrlData.publicUrl,
    };
  } catch (error) {
    console.error("Document upload error:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to upload document");
  }
}

/**
 * Generate signed URL for secure document access
 */
export async function getSignedDocumentUrl(
  filePath: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> {
  try {
    // Use service role client to bypass RLS policies
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error("Signed URL error:", error);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }

    return data.signedUrl;
  } catch (error) {
    console.error("Get signed URL error:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to generate signed URL");
  }
}

/**
 * Delete document file from storage
 */
export async function deleteDocumentFile(filePath: string): Promise<void> {
  try {
    // Use service role client to bypass RLS policies
    const supabase = createServiceRoleClient();

    const { error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error("Supabase delete error:", error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  } catch (error) {
    console.error("Document delete error:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to delete document");
  }
}

/**
 * Download document file as buffer
 */
export async function downloadDocument(filePath: string): Promise<{
  data: Uint8Array;
  contentType?: string;
}> {
  try {
    // Use service role client to bypass RLS policies
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .download(filePath);

    if (error) {
      console.error("Supabase download error:", error);
      throw new Error(`Failed to download file: ${error.message}`);
    }

    const arrayBuffer = await data.arrayBuffer();
    return {
      data: new Uint8Array(arrayBuffer),
      contentType: data.type,
    };
  } catch (error) {
    console.error("Document download error:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to download document");
  }
}
