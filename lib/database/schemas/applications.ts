import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";

// Applications table - core job application tracking
export const applications = pgTable("applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  company: text("company").notNull(),
  position: text("position").notNull(),
  status: text("status", {
    enum: [
      "applied",
      "assessment",
      "interview",
      "offer",
      "rejected",
      "withdrawn",
    ],
  })
    .notNull()
    .default("applied"),
  appliedDate: timestamp("applied_date").notNull(),
  nextDate: timestamp("next_date"),
  nextEvent: text("next_event"),
  cvVersion: text("cv_version"),
  notes: text("notes"),
  jobUrl: text("job_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations for applications (documents import will be resolved at runtime)
export const applicationsRelations = relations(applications, ({ one }) => ({
  user: one(users, {
    fields: [applications.userId],
    references: [users.id],
  }),
  // Documents relation will be defined in documents.ts to avoid circular import
}));

// Export types
export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
