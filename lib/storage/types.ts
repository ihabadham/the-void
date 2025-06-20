/**
 * Storage types and interfaces for file operations
 */

export interface StorageFile {
  name: string;
  size: number;
  type: string;
  lastModified?: number;
}

export interface UploadedFile {
  id: string;
  path: string;
  publicUrl: string;
  signedUrl?: string;
  name: string;
  size: number;
  type: string;
  uploadDate: Date;
}

export interface FileValidationOptions {
  maxSize?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

export interface StorageError {
  code: string;
  message: string;
  details?: any;
}

export interface FileDownloadResult {
  data: Uint8Array;
  contentType?: string;
  filename?: string;
}

export interface SignedUrlOptions {
  expiresIn?: number; // seconds
  download?: boolean;
  transform?: {
    width?: number;
    height?: number;
    quality?: number;
  };
}
