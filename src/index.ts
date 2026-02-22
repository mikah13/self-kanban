import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { sqlite } from "./db";
import { boardRoutes } from "./routes/boards";
import { taskRoutes } from "./routes/tasks";

const app = new Hono();

app.use("*", logger());
app.use("*", cors());
app.use("*", prettyJSON());

function bootstrap() {
  // Boards table
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

  // Tasks table — board_id column added; kept as nullable for safe migration
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

  // Migration: add board_id to tasks if it was created without it
  const cols = sqlite.prepare("PRAGMA table_info(tasks)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "board_id")) {
    sqlite.exec("ALTER TABLE tasks ADD COLUMN board_id INTEGER REFERENCES boards(id)");
  }

  console.log("Database ready.");
}

bootstrap();

app.get("/", (c) =>
  c.json({
    app: "self-kanban",
    version: "0.2.0",
    status: "ok",
    endpoints: {
      boards: {
        "GET    /boards":              "List boards (filters: ownedBy, deleted=true|all)",
        "GET    /boards/:id":          "Get a board",
        "POST   /boards":              "Create a board",
        "PATCH  /boards/:id":          "Update a board",
        "DELETE /boards/:id":          "Soft-delete a board",
        "POST   /boards/:id/restore":  "Restore a soft-deleted board",
      },
      tasks: {
        "GET    /boards/:boardId/tasks":                  "List tasks (filters: status, priority, createdBy, upcoming=<days>, deleted=true|all)",
        "GET    /boards/:boardId/tasks/:id":              "Get a task",
        "POST   /boards/:boardId/tasks":                  "Create a task",
        "PATCH  /boards/:boardId/tasks/:id":              "Update task fields",
        "PATCH  /boards/:boardId/tasks/:id/status":       "Move task to a new status",
        "DELETE /boards/:boardId/tasks/:id":              "Soft-delete a task",
        "POST   /boards/:boardId/tasks/:id/restore":      "Restore a soft-deleted task",
      },
    },
  })
);

app.route("/boards", boardRoutes);
app.route("/boards/:boardId/tasks", taskRoutes);

app.notFound((c) => c.json({ error: "Not found" }, 404));

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

const port = parseInt(process.env.PORT ?? "3000", 10);

serve({ fetch: app.fetch, port }, () => {
  console.log(`self-kanban API running on http://localhost:${port}`);
});
