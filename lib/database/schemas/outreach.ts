import { pgTable, pgEnum, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { users } from "./auth";
import { applications } from "./applications";

/**
 * Outreach domain – keeps track of LinkedIn (or other) networking efforts
 */

// Enum for contact request status
export const outreachStatusEnum = pgEnum("outreach_status", [
  "pending",
  "accepted",
  "ignored",
  "other",
]);

// Contacts you reached out to
export const outreachContacts = pgTable("outreach_contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  fullName: text("full_name"),
  headline: text("headline"),
  linkedinUrl: text("linkedin_url").notNull().unique(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// The canned message template sent for an application
export const outreachMessages = pgTable("outreach_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  applicationId: uuid("application_id")
    .references(() => applications.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Each individual outreach action (connection request sent)
export const outreachActions = pgTable("outreach_actions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  contactId: uuid("contact_id")
    .references(() => outreachContacts.id, { onDelete: "cascade" })
    .notNull(),
  applicationId: uuid("application_id").references(() => applications.id, {
    onDelete: "cascade",
  }), // nullable to allow pre-application outreach
  messageId: uuid("message_id").references(() => outreachMessages.id, {
    onDelete: "set null",
  }),
  company: text("company"), // duplicated for pre-application scenario
  status: outreachStatusEnum("status").notNull().default("pending"),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  respondedAt: timestamp("responded_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ================== Relations ==================
export const outreachContactsRelations = relations(
  outreachContacts,
  ({ one, many }) => ({
    user: one(users, {
      fields: [outreachContacts.userId],
      references: [users.id],
    }),
    outreachActions: many(outreachActions),
  })
);

export const outreachMessagesRelations = relations(
  outreachMessages,
  ({ one, many }) => ({
    user: one(users, {
      fields: [outreachMessages.userId],
      references: [users.id],
    }),
    application: one(applications, {
      fields: [outreachMessages.applicationId],
      references: [applications.id],
    }),
    outreachActions: many(outreachActions),
  })
);

export const outreachActionsRelations = relations(
  outreachActions,
  ({ one }) => ({
    user: one(users, {
      fields: [outreachActions.userId],
      references: [users.id],
    }),
    contact: one(outreachContacts, {
      fields: [outreachActions.contactId],
      references: [outreachContacts.id],
    }),
    application: one(applications, {
      fields: [outreachActions.applicationId],
      references: [applications.id],
    }),
    message: one(outreachMessages, {
      fields: [outreachActions.messageId],
      references: [outreachMessages.id],
    }),
  })
);

// ================== Export Types ==================
export type OutreachContact = typeof outreachContacts.$inferSelect;
export type NewOutreachContact = typeof outreachContacts.$inferInsert;

export type OutreachMessage = typeof outreachMessages.$inferSelect;
export type NewOutreachMessage = typeof outreachMessages.$inferInsert;

export type OutreachAction = typeof outreachActions.$inferSelect;
export type NewOutreachAction = typeof outreachActions.$inferInsert;
