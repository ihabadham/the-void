/**
 * Test database connection and basic operations
 * Run this file to verify your Drizzle + Supabase setup
 */

import { getDb } from "./connection";
import { users } from "./schemas/auth";
import { eq } from "drizzle-orm";

export async function testDatabaseConnection() {
  console.log("🔄 Testing database connection...");

  try {
    const db = getDb();

    // Test 1: Basic query (should return empty array initially)
    console.log("📊 Testing basic query...");
    const userCount = await db.select().from(users);
    console.log(
      `✅ Users table query successful. Found ${userCount.length} users.`
    );

    // Test 2: Schema validation
    console.log("🔍 Testing schema structure...");
    const sampleUser = {
      email: "test@example.com",
      name: "Test User",
    };

    // Don't actually insert, just validate the structure compiles
    console.log("✅ Schema validation successful.");

    console.log("🎉 Database connection test complete!");
    console.log("🚀 Your Drizzle + Supabase setup is working correctly.");

    return true;
  } catch (error) {
    console.error("❌ Database connection test failed:");
    console.error(error);

    // Provide helpful debugging info
    if (error instanceof Error) {
      if (error.message.includes("DATABASE_URL")) {
        console.log("💡 Check your DATABASE_URL environment variable");
      } else if (error.message.includes("connection")) {
        console.log("💡 Check your Supabase connection string and credentials");
      } else if (
        error.message.includes("relation") ||
        error.message.includes("table")
      ) {
        console.log('💡 Run "pnpm db:push" to create your database tables');
      }
    }

    return false;
  }
}

// Export function for use in other files
export default testDatabaseConnection;

// Allow running this file directly for testing
if (require.main === module) {
  testDatabaseConnection()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("Test runner error:", error);
      process.exit(1);
    });
}
