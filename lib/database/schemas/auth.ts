import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users table - core auth entity
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Gmail tokens table - auth-related sensitive data
export const gmailTokens = pgTable("gmail_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  accessTokenEncrypted: text("access_token_encrypted").notNull(),
  refreshTokenEncrypted: text("refresh_token_encrypted").notNull(),
  expiresAt: timestamp("expires_at"),
  connectedAt: timestamp("connected_at").defaultNow().notNull(),
  lastAccessed: timestamp("last_accessed").defaultNow().notNull(),
});

// Relations for auth domain
export const usersRelations = relations(users, ({ many }) => ({
  gmailTokens: many(gmailTokens),
}));

export const gmailTokensRelations = relations(gmailTokens, ({ one }) => ({
  user: one(users, {
    fields: [gmailTokens.userId],
    references: [users.id],
  }),
}));

// Export types for auth domain
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type GmailToken = typeof gmailTokens.$inferSelect;
export type NewGmailToken = typeof gmailTokens.$inferInsert;
