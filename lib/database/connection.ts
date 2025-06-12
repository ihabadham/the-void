import "@/envConfig";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schemas";

// Singleton pattern for database connection
let db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!db) {
    // Get database URL from environment
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    // Create postgres client
    const client = postgres(databaseUrl, {
      prepare: false, // Required for Supabase
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false,
    });

    // Create drizzle instance
    db = drizzle(client, { schema });
  }

  return db;
}

// Export database instance
export const database = getDb();

// Export schema for use in other files
export * from "./schemas";
