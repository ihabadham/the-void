import {
  pgTable,
  pgEnum,
  uuid,
  boolean,
  text,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";

export const exportFormatEnum = pgEnum("export_format", ["json", "csv"]);

// User Settings table - user preferences and configuration
export const userSettings = pgTable("user_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .unique(), // One settings record per user
  notifications: boolean("notifications").notNull().default(true),
  autoSync: boolean("auto_sync").notNull().default(false),
  darkMode: boolean("dark_mode").notNull().default(true),
  emailReminders: boolean("email_reminders").notNull().default(true),
  exportFormat: exportFormatEnum("export_format").notNull().default("json"),
  dataRetention: integer("data_retention").notNull().default(365), // days
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations for user settings
export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

// Export types
export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;
