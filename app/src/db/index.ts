import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

let sqlite: Database.Database;

export function initDb(path = "kanban.db") {
  sqlite = new Database(path);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return sqlite;
}

export function getDb() {
  if (!sqlite) {
    return initDb();
  }
  return sqlite;
}

const _sqlite = getDb();
export const db = drizzle(_sqlite, { schema });
