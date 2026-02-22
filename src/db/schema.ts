import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const Priority = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
} as const;

export const Status = {
  BACKLOG: "backlog",
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  IN_REVIEW: "in_review",
  DONE: "done",
  CANCELLED: "cancelled",
} as const;

export type Priority = (typeof Priority)[keyof typeof Priority];
export type Status = (typeof Status)[keyof typeof Status];

export const boards = sqliteTable("boards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  ownedBy: text("owned_by").notNull(),
  deletedAt: text("deleted_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  boardId: integer("board_id")
    .notNull()
    .references(() => boards.id),
  title: text("title").notNull(),
  description: text("description"),
  createdBy: text("created_by").notNull(),
  priority: text("priority", {
    enum: ["low", "medium", "high", "urgent"],
  })
    .notNull()
    .default("medium"),
  status: text("status", {
    enum: ["backlog", "todo", "in_progress", "in_review", "done", "cancelled"],
  })
    .notNull()
    .default("backlog"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  deletedAt: text("deleted_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type Board = typeof boards.$inferSelect;
export type NewBoard = typeof boards.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
