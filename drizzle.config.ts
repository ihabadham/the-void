import type { Config } from "drizzle-kit";

export default {
  schema: "./lib/database/schemas/index.ts",
  out: "./lib/database/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
