import { doublePrecision, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { groupsTable } from "./groups";

export const poopLogsTable = pgTable("poop_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  groupId: uuid("group_id").references(() => groupsTable.id, { onDelete: "set null" }),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  locationName: text("location_name"),
  notes: text("notes"),
  ratingSpeed: integer("rating_speed").notNull(),
  ratingComfort: integer("rating_comfort").notNull(),
  ratingPrivacy: integer("rating_privacy").notNull(),
  ratingAmbiance: integer("rating_ambiance").notNull(),
  ratingRelief: integer("rating_relief").notNull(),
  overallScore: doublePrecision("overall_score").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPoopLogSchema = createInsertSchema(poopLogsTable).omit({ id: true, createdAt: true });
export type InsertPoopLog = z.infer<typeof insertPoopLogSchema>;
export type PoopLog = typeof poopLogsTable.$inferSelect;
