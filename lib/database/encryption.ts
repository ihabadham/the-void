import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }

  if (key.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be 64 characters (32 bytes in hex)");
  }

  return key;
}

/**
 * Encrypt a string using AES-256-GCM
 * Returns base64 encoded encrypted data with IV and auth tag
 */
export function encrypt(text: string): string {
  try {
    const key = Buffer.from(getEncryptionKey(), "hex");
    const iv = crypto.randomBytes(16); // 128-bit IV for GCM

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    cipher.setAAD(Buffer.from("the-void-auth", "utf8")); // Additional authenticated data

    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");

    const authTag = cipher.getAuthTag();

    // Combine IV + authTag + encrypted data
    const combined = Buffer.concat([
      iv,
      authTag,
      Buffer.from(encrypted, "base64"),
    ]);

    return combined.toString("base64");
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt a base64 encoded encrypted string
 * Expects format: IV + authTag + encrypted data
 */
export function decrypt(encryptedData: string): string {
  try {
    const key = Buffer.from(getEncryptionKey(), "hex");
    const combined = Buffer.from(encryptedData, "base64");

    // Extract components
    const iv = combined.subarray(0, 16); // First 16 bytes
    const authTag = combined.subarray(16, 32); // Next 16 bytes
    const encrypted = combined.subarray(32); // Rest is encrypted data

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    decipher.setAAD(Buffer.from("the-void-auth", "utf8"));

    let decrypted = decipher.update(encrypted, undefined, "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Generate a new encryption key (for initial setup)
 * Run this once and store the result in your environment variables
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash a string for non-reversible storage (for indexing/searching)
 */
export function hash(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}
