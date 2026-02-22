import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { sqlite } from "./db";
import { taskRoutes } from "./routes/tasks";

const app = new Hono();

app.use("*", logger());
app.use("*", cors());
app.use("*", prettyJSON());

// Bootstrap: create tasks table if it doesn't exist
function bootstrap() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
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
  console.log("Database ready.");
}

bootstrap();

// Health / discovery endpoint
app.get("/", (c) =>
  c.json({
    app: "self-kanban",
    version: "0.1.0",
    status: "ok",
    endpoints: {
      "GET    /tasks":             "List tasks (filters: status, priority, createdBy, upcoming=<days>, deleted=true|all)",
      "GET    /tasks/:id":         "Get a single task",
      "POST   /tasks":             "Create a task",
      "PATCH  /tasks/:id":         "Update task fields",
      "PATCH  /tasks/:id/status":  "Move task to a new status",
      "DELETE /tasks/:id":         "Soft-delete a task",
      "POST   /tasks/:id/restore": "Restore a soft-deleted task",
    },
  })
);

app.route("/tasks", taskRoutes);

app.notFound((c) => c.json({ error: "Not found" }, 404));

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

const port = parseInt(process.env.PORT ?? "3000", 10);

serve({ fetch: app.fetch, port }, () => {
  console.log(`self-kanban API running on http://localhost:${port}`);
});
