import { pgTable, uuid, text, timestamp, unique } from "drizzle-orm/pg-core";
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

// Gmail accounts table - represents unique Gmail accounts
export const gmailAccounts = pgTable("gmail_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(), // Gmail address
  displayName: text("display_name"), // Name from Gmail profile
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User-Gmail tokens table - junction table for many-to-many relationship
// This allows multiple users to access the same Gmail account and users to have multiple Gmail accounts
export const userGmailTokens = pgTable(
  "user_gmail_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    gmailAccountId: uuid("gmail_account_id")
      .references(() => gmailAccounts.id, { onDelete: "cascade" })
      .notNull(),
    accessTokenEncrypted: text("access_token_encrypted").notNull(),
    refreshTokenEncrypted: text("refresh_token_encrypted").notNull(),
    expiresAt: timestamp("expires_at"),
    connectedAt: timestamp("connected_at").defaultNow().notNull(),
    lastAccessed: timestamp("last_accessed").defaultNow().notNull(),
  },
  (table) => ({
    // Ensure one set of tokens per user-gmail combination
    userGmailUnique: unique().on(table.userId, table.gmailAccountId),
  })
);

// Relations for auth domain
export const usersRelations = relations(users, ({ many }) => ({
  userGmailTokens: many(userGmailTokens),
}));

export const gmailAccountsRelations = relations(gmailAccounts, ({ many }) => ({
  userGmailTokens: many(userGmailTokens),
}));

export const userGmailTokensRelations = relations(
  userGmailTokens,
  ({ one }) => ({
    user: one(users, {
      fields: [userGmailTokens.userId],
      references: [users.id],
    }),
    gmailAccount: one(gmailAccounts, {
      fields: [userGmailTokens.gmailAccountId],
      references: [gmailAccounts.id],
    }),
  })
);

// Export types for auth domain
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type GmailAccount = typeof gmailAccounts.$inferSelect;
export type NewGmailAccount = typeof gmailAccounts.$inferInsert;

export type UserGmailToken = typeof userGmailTokens.$inferSelect;
export type NewUserGmailToken = typeof userGmailTokens.$inferInsert;

// Legacy type exports for backward compatibility
export type GmailToken = UserGmailToken;
export type NewGmailToken = NewUserGmailToken;
