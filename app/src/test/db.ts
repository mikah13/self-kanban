import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { beforeEach } from "vitest";
import * as boardsSchema from "../db/schema";
import * as tasksSchema from "../db/schema";

const sqlite = new Database(":memory:");
export const testDb = drizzle(sqlite, {
  schema: { ...boardsSchema, ...tasksSchema },
});

beforeEach(() => {
  sqlite.exec("DROP TABLE IF EXISTS tasks");
  sqlite.exec("DROP TABLE IF EXISTS boards");

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS boards (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      description TEXT,
      owned_by    TEXT    NOT NULL,
      deleted_at  TEXT,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      board_id    INTEGER REFERENCES boards(id),
      title       TEXT    NOT NULL,
      description TEXT,
      created_by  TEXT    NOT NULL,
      priority    TEXT    NOT NULL DEFAULT 'medium'
                          CHECK(priority IN ('low','medium','high','urgent')),
      status      TEXT    NOT NULL DEFAULT 'backlog'
                          CHECK(status IN ('backlog','todo','in_progress','in_review','done','cancelled')),
      start_date  TEXT,
      end_date    TEXT,
      deleted_at  TEXT,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);
});

export { sqlite };
